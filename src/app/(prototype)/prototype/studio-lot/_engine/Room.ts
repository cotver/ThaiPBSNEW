import * as THREE from "three";
import type { LotSectionId } from "../_lib/data";
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
  label: { title: string; meta: string; note: string };
  focusDistance?: number;
};

const EYE_HEIGHT = 1.7;

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
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.4), new THREE.MeshStandardMaterial({ color: "#f3eee4", map: plaster, roughness: 0.94 }));
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
      new THREE.MeshStandardMaterial({ map: vinylTexture({ kicker: config.kicker, title: config.title, sub: config.sub, font }), transparent: true, depthWrite: false, roughness: 0.7 }),
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
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, 0.28),
      new THREE.MeshStandardMaterial({ map: labelTexture({ ...config.label, font }), roughness: 0.8 }),
    );
    const [artX, artY] = config.art;
    label.position.set(Math.min(width / 2 - 0.4, artX + config.artWidth / 2 + 0.42), 1.3, 0.015);
    this.wall.add(label);

    // Ceiling spot washing the work, plus a faint visible beam through the haze.
    const fixture = new THREE.Vector3(artX, 6.75, 3.6);
    const target = new THREE.Vector3(artX, artY, 0);
    this.spotBase = 6 + config.artWidth * 0.9;
    this.spot = new THREE.SpotLight("#ffe8d0", this.spotBase, 16, Math.min(0.78, 0.3 + config.artWidth * 0.048), 0.9, 1.4);
    this.spot.position.copy(fixture);
    this.spot.target.position.copy(target);
    this.wall.add(this.spot, this.spot.target);
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.32, 12), new THREE.MeshStandardMaterial({ color: "#1d1c1a", roughness: 0.5, metalness: 0.6 }));
    housing.position.copy(fixture);
    // Tilt the can along the fixture→work line (local space, so no world matrices needed yet).
    housing.rotation.x = Math.atan2(fixture.z - target.z, fixture.y - target.y);
    this.wall.add(housing);
    const beam = lightCone(fixture, target.clone().setZ(0.3), Math.max(1.2, config.artWidth * 0.5), "#ffdcb0", 0.025);
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
  focusPose(out: { position: THREE.Vector3; target: THREE.Vector3 }) {
    const { width, focusDistance } = this.config;
    const focusY = 2.6;
    // Stand back far enough that the whole wall, title included, fits left of the panel.
    const distance = focusDistance ?? Math.min(13.5, width * 1.1);
    const normal = new THREE.Vector3(Math.sin(this.config.facing), 0, Math.cos(this.config.facing));
    const right = new THREE.Vector3().crossVectors(normal.clone().negate(), new THREE.Vector3(0, 1, 0)).normalize();
    const centre = this.wall.localToWorld(new THREE.Vector3(0, focusY, 0));
    out.position.copy(centre).addScaledVector(normal, distance).addScaledVector(right, -width * 0.05);
    out.position.y = EYE_HEIGHT + 0.25;
    out.target.copy(centre).addScaledVector(right, distance * 0.2);
    out.target.y = focusY;
    return out;
  }

  update(dt: number) {
    this.hover = damp(this.hover, this.hoverTarget, 6, dt);
    this.spot.intensity = this.spotBase * (0.9 + this.hover * 0.3 + this.active * 0.1);
    this.cone.uniforms.uOpacity.value = 0.014 + this.hover * 0.014;
    this.underline.scale.x = 0.12 + this.hover * 0.88;
  }
}
