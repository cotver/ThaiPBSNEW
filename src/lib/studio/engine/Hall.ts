import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import type { OutdoorUniforms } from "./outdoorMaterial";
import { concreteTexture, plasterTexture, studioSignTexture } from "./signage";
import { buildThaiPbsLogo } from "./ThaiPbsLogo3D";

export const NAVE_HALF_WIDTH = 8;
const CEILING = 7;
export const FRONT = 28;
const ENTRANCE_Z = 13;
/** A lit lightbox: warm and past white, so it blooms. Switched off it is a dull grey diffuser. */
const LAMP_ON = new THREE.Color("#ffe9c8").multiplyScalar(1.25);
const LAMP_OFF = new THREE.Color("#6f6d69");
const lampColour = new THREE.Color();

const glassVertex = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPos = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const glassFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uKeyDir;
  uniform vec3 uKeyColor;
  uniform vec3 uSkyAmbient;
  uniform vec3 uFogColor;
  uniform float uNight;
  uniform float uRain;
  varying vec3 vWorldPos;
  varying vec3 vNormal;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    vec3 view = normalize(cameraPosition - vWorldPos);
    vec3 normal = normalize(vNormal);
    if (dot(normal, view) < 0.0) normal = -normal;
    float fresnel = pow(1.0 - max(dot(normal, view), 0.0), 4.0);
    // By day the glass catches the sky at an angle; by night it mirrors the warm hall.
    vec3 reflection = mix(uFogColor * 0.85 + uSkyAmbient * 0.15, vec3(0.13, 0.1, 0.08), uNight);
    vec3 colour = mix(vec3(0.75, 0.86, 0.9) * (uSkyAmbient + 0.15), reflection, clamp(fresnel + uNight * 0.5, 0.0, 1.0));
    float alpha = 0.04 + fresnel * 0.5 + uNight * 0.1;
    float glint = pow(max(dot(reflect(-view, normal), uKeyDir), 0.0), 400.0);
    colour += uKeyColor * glint * 2.0;
    alpha += glint * 0.5;

    if (uRain > 0.01) {
      // Drops running down the pane, each in its own narrow column, and still beads between them.
      vec2 p = vec2(vWorldPos.x + vWorldPos.z, vWorldPos.y) * vec2(9.0, 3.0);
      vec2 id = floor(p);
      float r = hash(id);
      vec2 f = fract(p) - 0.5;
      float slide = fract(uTime * (0.12 + r * 0.25) + r * 7.0);
      vec2 centre = vec2((r - 0.5) * 0.6, 0.45 - slide * 0.9);
      vec2 offset = vec2(f.x - centre.x, (f.y - centre.y) * 3.0);
      float drop = smoothstep(0.16, 0.06, length(offset)) * step(0.35, r);
      float trail = smoothstep(0.05, 0.0, abs(f.x - centre.x)) * step(centre.y, f.y) * (0.5 - f.y) * step(0.35, r);
      vec2 q = vec2(vWorldPos.x + vWorldPos.z, vWorldPos.y) * 26.0;
      float bead = smoothstep(0.32, 0.12, length(fract(q) - 0.5)) * step(0.82, hash(floor(q)));
      float wet = (drop + trail * 0.35 + bead * 0.6) * uRain;
      colour += vec3(0.25) * wet + uFogColor * 0.2 * wet;
      alpha += wet * 0.32;
    }
    gl_FragColor = vec4(colour, clamp(alpha, 0.0, 0.9));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** The building around the rooms: polished floor, glass walls, lightbox ceiling, entrance portal. */
export class Hall {
  readonly group = new THREE.Group();
  private strips?: THREE.MeshBasicMaterial;
  private readonly stripLights: THREE.RectAreaLight[] = [];
  private readonly windowLights: THREE.RectAreaLight[] = [];

  /**
   * `back` is the end wall z — the hall grows with the number of rooms; `font` letters the portal sign;
   * `outdoor` is the light outside, which the glass reflects.
   */
  constructor(options: { benches: [number, number][]; back: number; font: string; outdoor: OutdoorUniforms }) {
    // Area lights (the ceiling strips, the glass walls) need their lookup tables loaded once.
    RectAreaLightUniformsLib.init();
    const BACK = options.back;
    const length = FRONT - BACK;
    const centreZ = (FRONT + BACK) / 2;

    // Pale polished concrete. Its sheen comes from the lights themselves (the sun, the strips), not from
    // a mirror pass, which would re-render the whole lit scene every frame.
    const floorMap = concreteTexture();
    // Keep the pours roughly 5m square however long the hall grows.
    floorMap.repeat.set(3, length / 5.3);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(NAVE_HALF_WIDTH * 2, length),
      new THREE.MeshStandardMaterial({
        map: floorMap,
        color: "#f4f0e8",
        roughness: 0.38,
        metalness: 0,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, centreZ);
    this.group.add(floor);

    // Every wall but the rooms' own is glass, looking out onto the land (see Nature).
    this.buildGlass(BACK, options.outdoor);
    this.buildEndLogo(BACK + 0.2);

    // Ceiling: pale soffit, coffer beams, and two lightbox strips running the length of the gallery.
    const ceilingMaterial = new THREE.MeshStandardMaterial({ color: "#e4dfd6", roughness: 1 });
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(NAVE_HALF_WIDTH * 2, length), ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, CEILING, centreZ);
    this.group.add(ceiling);
    const stripMaterial = new THREE.MeshBasicMaterial({ color: LAMP_ON.clone(), toneMapped: false });
    this.strips = stripMaterial;
    // Two runs of strips: down the gallery, and a shorter pair in the foyer that lights the entrance wall.
    const runs = [
      { length: ENTRANCE_Z - BACK - 2, z: (ENTRANCE_Z + BACK) / 2 - 1 },
      { length: FRONT - ENTRANCE_Z - 5, z: (FRONT + ENTRANCE_Z) / 2 + 0.5 },
    ];
    for (const run of runs) {
      for (const x of [-2.6, 2.6]) {
        const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.55, run.length), stripMaterial);
        strip.rotation.x = Math.PI / 2;
        strip.position.set(x, CEILING - 0.02, run.z);
        this.group.add(strip);
        // The strip itself is the light: an area light the size of the lightbox, shining down.
        const lamp = new THREE.RectAreaLight("#fff0dc", 0, 0.55, run.length);
        lamp.rotation.x = -Math.PI / 2;
        lamp.position.copy(strip.position).setY(CEILING - 0.05);
        this.group.add(lamp);
        this.stripLights.push(lamp);
      }
    }
    // Daylight through the glass: each side wall glows with the sky and lights the rooms facing it.
    for (const side of [-1, 1]) {
      const skyGlow = new THREE.RectAreaLight("#dfeeff", 0, length, CEILING);
      skyGlow.rotation.y = side * (Math.PI / 2);
      skyGlow.position.set(side * (NAVE_HALF_WIDTH - 0.05), CEILING / 2, centreZ);
      this.group.add(skyGlow);
      this.windowLights.push(skyGlow);
    }
    // Slim beams in the roof's own material, so they read as part of the soffit and take its light.
    const beams = new THREE.InstancedMesh(new THREE.BoxGeometry(NAVE_HALF_WIDTH * 2, 0.16, 0.14), ceilingMaterial, Math.max(1, Math.floor((ENTRANCE_Z - BACK) / 6)));
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < beams.count; i += 1) {
      matrix.makeTranslation(0, CEILING - 0.08, ENTRANCE_Z - 2 - i * 6);
      beams.setMatrixAt(i, matrix);
    }
    this.group.add(beams);

    // Benches facing the rooms — gallery furniture gives the scale.
    const benchTop = new THREE.MeshStandardMaterial({ color: "#3a2a1e", roughness: 0.55 });
    const benchLeg = new THREE.MeshStandardMaterial({ color: "#151412", roughness: 0.4, metalness: 0.6 });
    for (const [x, z] of options.benches) {
      const bench = new THREE.Group();
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 2.2), benchTop);
      top.position.y = 0.44;
      bench.add(top);
      for (const end of [-0.95, 0.95]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.06), benchLeg);
        leg.position.set(0, 0.2, end);
        bench.add(leg);
      }
      bench.position.set(x, 0, z);
      this.group.add(bench);
    }

    this.buildEntrance(options.font);
  }

  /**
   * Floor-to-ceiling glazing down both sides (the foyer too) and across the far end, on slim graphite
   * mullions. The glass is mostly clear by day, catches the sky at grazing angles, mirrors the lit hall
   * a little at night, and beads with rain when it rains.
   */
  private buildGlass(back: number, outdoor: OutdoorUniforms) {
    const glass = new THREE.ShaderMaterial({
      uniforms: {
        uTime: outdoor.uTime,
        uKeyDir: outdoor.uKeyDir,
        uKeyColor: outdoor.uKeyColor,
        uSkyAmbient: outdoor.uSkyAmbient,
        uFogColor: outdoor.uFogColor,
        uNight: outdoor.uNight,
        uRain: outdoor.uRain,
      },
      vertexShader: glassVertex,
      fragmentShader: glassFragment,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const length = FRONT - back;
    const x = NAVE_HALF_WIDTH + 0.05;
    for (const side of [-1, 1]) {
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(length, CEILING), glass);
      pane.rotation.y = side * (Math.PI / 2);
      pane.position.set(side * x, CEILING / 2, (FRONT + back) / 2);
      this.group.add(pane);
    }
    const end = new THREE.Mesh(new THREE.PlaneGeometry(x * 2, CEILING), glass);
    end.position.set(0, CEILING / 2, back);
    this.group.add(end);

    // Mullions every 3m, a sill and a head rail. The far end keeps its sill and head rail but has no
    // posts, so nothing stands between the visitor and the clearing beyond it.
    const metal = new THREE.MeshStandardMaterial({ color: "#2a2b2e", roughness: 0.45, metalness: 0.6 });
    const spacing = 3;
    const sideCount = Math.floor(length / spacing) + 1;
    const mullions = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, CEILING, 0.14), metal, sideCount * 2);
    const matrix = new THREE.Matrix4();
    const turn = new THREE.Matrix4().makeRotationY(Math.PI / 2);
    let index = 0;
    for (const side of [-1, 1]) {
      for (let i = 0; i < sideCount; i += 1) {
        const z = FRONT - i * spacing;
        // No corner posts: the end pane meets the side glass edge to edge.
        if (z < back + 1.5) continue;
        matrix.makeTranslation(side * x, CEILING / 2, z).multiply(turn);
        mullions.setMatrixAt(index++, matrix);
      }
    }
    mullions.count = index;
    this.group.add(mullions);
    for (const y of [0.06, CEILING - 0.08]) {
      const height = y < 1 ? 0.12 : 0.16;
      for (const side of [-1, 1]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.22, height, length), metal);
        rail.position.set(side * x, y, (FRONT + back) / 2);
        this.group.add(rail);
      }
      const rail = new THREE.Mesh(new THREE.BoxGeometry(x * 2, height, 0.22), metal);
      rail.position.set(0, y, back);
      this.group.add(rail);
    }
  }

  /**
   * The Thai PBS logo, rebuilt in 3D from its traced outlines, mounted on the end wall where the walk
   * finishes — the bird stands off the plaster, the wordmark is raised lettering beneath it.
   */
  private buildEndLogo(wallFace: number) {
    const logo = buildThaiPbsLogo(4.4);
    logo.position.set(0, 1.0, wallFace + 0.01);
    this.group.add(logo);

    // A warm ceiling wash, like the rooms, so the extruded edges catch light and cast depth.
    const wash = new THREE.SpotLight("#fff0dc", 6, 14, 0.62, 1, 1.4);
    wash.position.set(0, 6.8, wallFace + 4.5);
    wash.target.position.set(0, 3.2, wallFace);
    this.group.add(wash, wash.target);
  }

  /** The portal: a plaster wall with a doorway, lettering on the left — the first composition the camera sees. */
  private buildEntrance(font: string) {
    const portal = new THREE.Group();
    portal.position.set(0, 0, ENTRANCE_Z);
    // The same plaster as the room walls (see Room), so the entrance belongs to the gallery.
    const plaster = plasterTexture(13);
    plaster.repeat.set(1.4, 1.75);
    const material = new THREE.MeshStandardMaterial({ color: "#e9e3d7", map: plaster, roughness: 0.94 });
    const doorHalf = 2.4;
    const slabWidth = NAVE_HALF_WIDTH - doorHalf;
    for (const side of [-1, 1]) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(slabWidth, CEILING, 0.6), material);
      slab.position.set(side * (doorHalf + slabWidth / 2), CEILING / 2, 0);
      portal.add(slab);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorHalf * 2, CEILING - 4.6, 0.6), material);
    lintel.position.set(0, 4.6 + (CEILING - 4.6) / 2, 0);
    portal.add(lintel);

    // "ThaiPBS Studio" in dark cut vinyl on the plaster (the texture is 2048×512).
    const signWidth = 4.6;
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(signWidth, signWidth * (512 / 2048)),
      new THREE.MeshBasicMaterial({ depthWrite: false, map: studioSignTexture(font, "#1f1d1a"), toneMapped: false, transparent: true }),
    );
    sign.position.set(-doorHalf - slabWidth / 2 + 0.1, 3.4, 0.31);
    portal.add(sign);

    // A single warm spot on the lettering, and the bright gallery beyond the doorway.
    // (Gentler than on the old dark wall: pale plaster would glare under the full beam.)
    const spot = new THREE.SpotLight("#ffe0b8", 18, 12, 0.5, 0.8, 1.4);
    spot.position.set(-doorHalf - slabWidth / 2, 6.6, 3.6);
    spot.target.position.set(-doorHalf - slabWidth / 2, 3.2, 0);
    portal.add(spot, spot.target);
    this.group.add(portal);
  }

  /** The ceiling lightboxes: 1 lit, 0 switched off (a plain diffuser); `brightness` dims them when lit. */
  setLamps(level: number, brightness = 1) {
    for (const light of this.stripLights) light.intensity = 9 * level * brightness;
    if (!this.strips) return;
    lampColour.copy(LAMP_ON).multiplyScalar(brightness);
    this.strips.color.lerpColors(LAMP_OFF, lampColour, level);
  }

  /** Sky light coming in through the side glass (0 at night). */
  setDaylight(colour: THREE.Color, amount: number) {
    for (const light of this.windowLights) {
      light.color.copy(colour);
      light.intensity = 0.6 * amount;
    }
  }
}
