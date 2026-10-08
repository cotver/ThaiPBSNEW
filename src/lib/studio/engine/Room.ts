import * as THREE from "three";
import type { LotSectionId } from "@/lib/studio/data";
import { lightCone } from "./beam";
import { damp } from "./math";
import { labelTexture, plasterTexture, vinylTexture } from "./signage";

export type RoomConfig = {
  id: LotSectionId;
  position: [number, number];
  /** World yaw so the feature wall (local +Z) faces the gallery nave. */
  facing: number;
  width: number;
  height: number;
  kicker: string;
  title: string;
  sub: string;
  accent: string;
  /** Centre of the hung work, in local wall space (x across, y up). */
  art: [number, number];
  /** Horizontal extent of the hung work, used to place the label and aim the light. */
  artWidth: number;
  /** Museum label beside the work; left out where the work speaks for itself (the featured screen). */
  label?: { title: string; meta: string; note: string };
  /** Where the ON AIR box hangs: the top-right corner, or under the title when the work fills that corner. */
  onAir?: "corner" | "underTitle";
  focusDistance?: number;
};

/** Furthest the camera may stand from a wall — the nave is about 15m across. */
const MAX_FOCUS_DISTANCE = 14.4;

const SPOT_LIGHTS = "#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )";
const SUN_LIGHTS = "#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )";
const AREA_LIGHTS = "#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )";

/**
 * Sun or spotlight, not both: where the sun falls on a spotlit wall, the wall takes whichever light is
 * stronger instead of their sum, so a patch of sunlight doesn't glare out of the wall's spotlit wash.
 * (Patches three's light loop: the spot lights' share and the sun's share are set aside, then the
 * larger of the two is added back.)
 */
function sunOrSpotlight<T extends THREE.MeshStandardMaterial>(material: T) {
  material.onBeforeCompile = (shader) => {
    const lights = THREE.ShaderChunk.lights_fragment_begin
      .replace(SPOT_LIGHTS, `vec3 lotBefore = reflectedLight.directDiffuse;
vec3 lotBeforeSpecular = reflectedLight.directSpecular;
${SPOT_LIGHTS}`)
      .replace(SUN_LIGHTS, `vec3 lotSpot = reflectedLight.directDiffuse - lotBefore;
vec3 lotSpotSpecular = reflectedLight.directSpecular - lotBeforeSpecular;
reflectedLight.directDiffuse = lotBefore;
reflectedLight.directSpecular = lotBeforeSpecular;
${SUN_LIGHTS}`)
      .replace(AREA_LIGHTS, `reflectedLight.directDiffuse = lotBefore + max(lotSpot, reflectedLight.directDiffuse - lotBefore);
reflectedLight.directSpecular = lotBeforeSpecular + max(lotSpotSpecular, reflectedLight.directSpecular - lotBeforeSpecular);
${AREA_LIGHTS}`);
    shader.fragmentShader = shader.fragmentShader.replace("#include <lights_fragment_begin>", lights);
  };
  material.customProgramCacheKey = () => "sun-or-spotlight";
  return material;
}

/**
 * The focused camera's lens and the part of the screen left free by the room panel.
 * `usableX/Y` are fractions of the viewport; `centerX/Y` are that area's centre in NDC (-1..1).
 */
export type FocusView = { fov: number; aspect: number; zoom: number; usableX: number; usableY: number; centerX: number; centerY: number };

/**
 * One gallery room: a plaster feature wall with cut-vinyl title, a museum label and a ceiling
 * spot washing the work. The engine hangs the actual pieces on `wall`.
 */
export class Room {
  readonly config: RoomConfig;
  readonly group = new THREE.Group();
  /** Local space on the wall surface: origin at floor level, wall centre. */
  readonly wall = new THREE.Group();
  readonly hitTargets: THREE.Object3D[] = [];
  /** Path parameter of the point on the dolly track nearest this room. */
  trackT = 0;

  private hover = 0;
  private hoverTarget = 0;
  private active = 0;
  private readonly spot: THREE.SpotLight;
  private readonly spotBase: number;
  private readonly cone: THREE.ShaderMaterial;
  private readonly underline: THREE.Mesh;

  constructor(config: RoomConfig, font: string) {
    this.config = config;
    const { width, height } = config;
    this.group.position.set(config.position[0], 0, config.position[1]);
    this.group.rotation.y = config.facing;
    this.group.name = `room:${config.id}`;

    const plaster = plasterTexture(width * 31 + height);
    plaster.repeat.set(width / 4, height / 4);
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.4), sunOrSpotlight(new THREE.MeshStandardMaterial({ color: "#e9e3d7", map: plaster, roughness: 0.94 })));
    body.position.y = height / 2;
    this.group.add(body);

    this.wall.position.set(0, 0, 0.21);
    this.group.add(this.wall);

    const skirting = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, 0.03), new THREE.MeshStandardMaterial({ color: "#2b2926", roughness: 0.6 }));
    skirting.position.set(0, 0.06, 0.01);
    this.wall.add(skirting);

    // Room title in cut vinyl, top-left of the wall — the typography is part of the room.
    const titleWidth = Math.min(3.2, width * 0.25);
    const titleX = -width / 2 + 0.55 + titleWidth / 2;
    const title = new THREE.Mesh(
      new THREE.PlaneGeometry(titleWidth, titleWidth * 0.375),
      sunOrSpotlight(new THREE.MeshStandardMaterial({ map: vinylTexture({ kicker: config.kicker, title: config.title, sub: config.sub, font }), transparent: true, depthWrite: false, roughness: 0.7 })),
    );
    title.position.set(titleX, height - 0.55 - titleWidth * 0.1875, 0.01);
    this.wall.add(title);

    // Accent rule under the title; it draws itself out when the room is looked at.
    const ruleGeometry = new THREE.PlaneGeometry(titleWidth * 0.9, 0.035);
    ruleGeometry.translate((titleWidth * 0.9) / 2, 0, 0);
    this.underline = new THREE.Mesh(ruleGeometry, new THREE.MeshBasicMaterial({ color: config.accent }));
    this.underline.position.set(titleX - titleWidth / 2, height - 0.7 - titleWidth * 0.375, 0.012);
    this.underline.scale.x = 0.12;
    this.wall.add(this.underline);

    // Museum label beside the work.
    const [artX] = config.art;
    if (config.label) {
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(0.42, 0.28),
        sunOrSpotlight(new THREE.MeshStandardMaterial({ map: labelTexture({ ...config.label, font }), roughness: 0.8 })),
      );
      label.position.set(Math.min(width / 2 - 0.4, artX + config.artWidth / 2 + 0.42), 1.3, 0.015);
      this.wall.add(label);
    }

    // A ceiling wall-washer aimed at the middle of the wall, its beam wide enough to take in the whole
    // feature wall — title, hang, label and all — softening only at the very edges. Plus a faint visible
    // beam through the haze.
    const fixture = new THREE.Vector3(0, 6.75, 4.4);
    const target = new THREE.Vector3(0, height / 2, 0);
    const reach = fixture.distanceTo(target);
    const coverAngle = Math.atan(Math.hypot(width / 2, height / 2) / reach) * 1.15;
    // An even wash, not a hot spot: no fall-off with distance (decay 0), so the near middle of the wall is
    // barely brighter than its corners, at a level that lifts the wall out of the hall's shadows without
    // washing out the plaster. (The work itself is unlit, so it keeps its true colour either way.)
    this.spotBase = 2.6;
    this.spot = new THREE.SpotLight("#ffe8d0", this.spotBase, 20, Math.min(1.3, coverAngle), 0.3, 0);
    this.spot.position.copy(fixture);
    this.spot.target.position.copy(target);
    this.wall.add(this.spot, this.spot.target);
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.32, 12), new THREE.MeshStandardMaterial({ color: "#1d1c1a", roughness: 0.5, metalness: 0.6 }));
    housing.position.copy(fixture);
    // Tilt the can along the fixture→work line (local space, so no world matrices needed yet).
    housing.rotation.x = Math.atan2(fixture.z - target.z, fixture.y - target.y);
    this.wall.add(housing);
    const beam = lightCone(fixture, target.clone().setZ(0.3), width * 0.42, "#ffdcb0", 0.02);
    this.cone = beam.material;
    this.wall.add(beam.mesh);

    body.userData.section = config.id;
    this.hitTargets.push(body);
  }

  setHovered(hovered: boolean) {
    this.hoverTarget = hovered ? 1 : 0;
  }

  setActive(value: number) {
    this.active = value;
  }

  addHitTarget(object: THREE.Object3D) {
    object.userData.section = this.config.id;
    this.hitTargets.push(object);
  }

  get hoverAmount() {
    return this.hover;
  }

  /** World-space camera pose at eye height, framing the wall with room for the panel on the right. */
  /**
   * Square-on framing, like a gallery photograph: the camera faces the wall dead-on at the content's
   * mid-height (no yaw, no tilt — frames stay rectangular, verticals stay vertical) and stands back
   * just far enough to fit the hang inside the part of the screen the panel leaves free. It makes room
   * for the panel by sliding sideways, never by turning.
   */
  focusPose(out: { position: THREE.Vector3; target: THREE.Vector3 }, view: FocusView) {
    const { width, height, art, artWidth, focusDistance, label } = this.config;
    // What should be in frame, in wall-local metres: title at the left through the label at the right.
    const left = -width / 2 + 0.4;
    const workRight = Math.min(width / 2 - 0.2, art[0] + artWidth / 2 + (label ? 0.75 : 0.35));
    const bottom = 0.45;
    const top = height - 0.35;
    const contentWidth = workRight - left;
    const contentHeight = top - bottom;

    const vTan = Math.tan(THREE.MathUtils.degToRad(view.fov) / 2) / view.zoom;
    const hTan = vTan * view.aspect;
    const margin = 1.08;
    const fitDistance = Math.max((contentWidth * margin) / (view.usableX * 2 * hTan), (contentHeight * margin) / (view.usableY * 2 * vTan));
    // The nave is ~15m wall to wall; never back into the opposite wall.
    const distance = focusDistance ?? THREE.MathUtils.clamp(fitDistance, 6, MAX_FOCUS_DISTANCE);

    const visibleW = 2 * distance * hTan;
    const visibleH = 2 * distance * vTan;
    const usableW = view.usableX * visibleW;
    // Everything fits: centre it. Too wide for the hall: keep the work and label whole, let the title crop.
    const regionX = usableW >= contentWidth * margin ? (left + workRight) / 2 : workRight + 0.3 - usableW / 2;
    const regionY = (bottom + top) / 2;
    // Slide the (square-on) camera so the content's centre lands in the middle of the free screen area.
    const axisX = regionX - (view.centerX * visibleW) / 2;
    const axisY = THREE.MathUtils.clamp(regionY - (view.centerY * visibleH) / 2, 0.6, 6.4);

    const normal = new THREE.Vector3(Math.sin(this.config.facing), 0, Math.cos(this.config.facing));
    this.wall.localToWorld(out.target.set(axisX, axisY, 0));
    out.position.copy(out.target).addScaledVector(normal, distance);
    return out;
  }

  update(dt: number) {
    this.hover = damp(this.hover, this.hoverTarget, 6, dt);
    this.spot.intensity = this.spotBase * (0.9 + this.hover * 0.12 + this.active * 0.05);
    this.cone.uniforms.uOpacity.value = 0.01 + this.hover * 0.008;
    this.underline.scale.x = 0.12 + this.hover * 0.88;
  }
}
