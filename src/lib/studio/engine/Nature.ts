import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { Conditions } from "./Environment";
import { damp, seeded } from "./math";
import { outdoorMaterial, type OutdoorUniforms } from "./outdoorMaterial";
import { radialTexture, THAI_PBS_ORANGE, thaiPbsKiteTexture } from "./signage";

/** The hall's footprint on the ground (metres): nature keeps clear of it. */
export type HallFootprint = { halfWidth: number; front: number; back: number };

type Random = () => number;

// ————————————————————————————————————————— noise (deterministic, so the land is the same on every visit)

function hash2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function noise2(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm2(x: number, y: number, octaves = 4) {
  let total = 0;
  let amplitude = 0.5;
  for (let i = 0; i < octaves; i += 1) {
    total += noise2(x, y) * amplitude;
    x = x * 2.03 + 1.7;
    y = y * 2.03 + 9.2;
    amplitude *= 0.5;
  }
  return total;
}

const GROUND_Y = -0.12;
/** Points along each kite's tail. */
const KITE_TAIL = 12;
const LIGHT_WARM = new THREE.Color("#ffc677");
const LIGHT_OFF = new THREE.Color(0.12, 0.11, 0.09);

/**
 * Which trees are in flower this month, after the Thai calendar: pink trumpet trees in the cool dry
 * start of the year, golden shower (ratchaphruek) and jacaranda in the hot season, flame trees and
 * inthanin as the rains arrive, a mostly green rainy season, and gold and orange in the cool season.
 * `share` is how many of the trees near the hall are in flower.
 */
function seasonBlossoms(month: number) {
  const seasons: { months: number[]; colours: string[]; share: number }[] = [
    { months: [0, 1], colours: ["#ff8fc0", "#ff6fb5", "#ffd1e3"], share: 0.45 },
    { months: [2, 3], colours: ["#ffc93c", "#ffd84d", "#b98cff", "#ff8fc0"], share: 0.6 },
    { months: [4, 5], colours: ["#ff5a3c", "#ff7a1a", "#c48cff"], share: 0.5 },
    { months: [6, 7, 8, 9], colours: ["#c48cff", "#ffffff"], share: 0.2 },
    { months: [10, 11], colours: ["#ffb000", "#ff7a1a", "#ffd23f"], share: 0.35 },
  ];
  const season = seasons.find((entry) => entry.months.includes(month)) ?? seasons[0];
  return { colours: season.colours.map((hex) => new THREE.Color(hex)), share: season.share };
}
/** How many ripples the water can show at once. */
const RIPPLES = 8;
const WATER_Y = -0.45;

const waterVertex = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPos = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const waterFragment = /* glsl */ `
  uniform float uTime;
  uniform float uWind;
  uniform float uRain;
  uniform vec3 uKeyDir;
  uniform vec3 uKeyColor;
  uniform vec3 uSkyAmbient;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform vec4 uRipples[${RIPPLES}];
  varying vec3 vWorldPos;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float surface(vec2 p) {
    float h = noise(p * 0.45 + vec2(uTime * 0.12, uTime * 0.05)) * (0.4 + uWind);
    h += noise(p * 1.6 - vec2(uTime * 0.3, 0.0)) * 0.35 * (0.3 + uWind);
    h += noise(p * 7.0 + vec2(0.0, uTime * 2.5)) * 0.25 * uRain;
    // Rings spreading from a paddling duck or a jumping fish: (x, z, start time, strength).
    for (int i = 0; i < ${RIPPLES}; i++) {
      vec4 ripple = uRipples[i];
      float age = uTime - ripple.z;
      if (age > 0.0 && age < 4.0) {
        float dist = length(p - ripple.xy);
        h += sin(dist * 7.0 - age * 7.0) * exp(-age * 1.1) * exp(-abs(dist - age * 1.4) * 1.8) * ripple.w * 0.6;
      }
    }
    return h;
  }

  void main() {
    vec2 p = vWorldPos.xz;
    float e = 0.12;
    float h = surface(p);
    vec3 normal = normalize(vec3((h - surface(p + vec2(e, 0.0))) / e * 0.22, 1.0, (h - surface(p + vec2(0.0, e))) / e * 0.22));
    vec3 view = normalize(cameraPosition - vWorldPos);
    float fresnel = 0.08 + 0.92 * pow(1.0 - max(dot(normal, view), 0.0), 4.0);
    vec3 deep = vec3(0.02, 0.07, 0.08) * (uSkyAmbient * 1.6 + uKeyColor * 0.25);
    vec3 colour = mix(deep, uFogColor * 0.9, fresnel);
    float glint = pow(max(dot(reflect(-view, normal), uKeyDir), 0.0), 140.0);
    colour += uKeyColor * glint * 2.5;
    float distance = length(vWorldPos - cameraPosition);
    colour = mix(colour, uFogColor, 1.0 - exp(-pow(distance * uFogDensity, 2.0)));
    gl_FragColor = vec4(colour, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const fireflyVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  attribute float aPhase;
  varying float vGlow;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.4 + aPhase * 7.0) * 0.8;
    p.y += sin(uTime * 0.7 + aPhase * 3.0) * 0.35;
    p.z += cos(uTime * 0.33 + aPhase * 5.0) * 0.8;
    vGlow = pow(0.5 + 0.5 * sin(uTime * (1.2 + aPhase) + aPhase * 30.0), 3.0);
    vec4 mv = viewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const fireflyFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOpacity;
  varying float vGlow;
  void main() {
    float a = texture2D(uMap, gl_PointCoord).a;
    gl_FragColor = vec4(vec3(0.85, 1.0, 0.45) * 2.2, a * vGlow * uOpacity);
  }
`;

const box = (w: number, h: number, d: number, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);

/** A body of water: the lake sits in a dip in the land; the clearing's pond lies on the flat. */
type Water = { x: number; z: number; rx: number; rz: number; y: number; dip: boolean };

/**
 * An animal that wanders near its home while the time and weather suit it (`wants`), and otherwise
 * walks off to its den in the trees and is gone until they suit it again.
 */
type Walker = {
  root: THREE.Group;
  legs: THREE.Object3D[];
  /** Lowered to graze; `head` tips back the other way so the muzzle meets the grass. */
  neck?: THREE.Object3D;
  head?: THREE.Object3D;
  /** An elephant's trunk: its joints, base to tip. */
  trunk?: THREE.Object3D[];
  home: THREE.Vector2;
  range: number;
  den: THREE.Vector2;
  target: THREE.Vector2;
  heading: number;
  state: "graze" | "look" | "walk" | "arrive" | "leave";
  timer: number;
  stride: number;
  speed: number;
  strideRate: number;
  swing: number;
  graze: number;
  gone: boolean;
  wants: (c: Conditions) => boolean;
  /** Picks the next spot to wander to (default: anywhere near home, clear of the glass and the water). */
  pick?: () => THREE.Vector2;
};

type Rabbit = { root: THREE.Group; home: THREE.Vector2; den: THREE.Vector2; target: THREE.Vector2; heading: number; hop: number; rest: number; gone: boolean };
type Duck = { root: THREE.Group; angle: number; speed: number; radius: THREE.Vector2; phase: number };
type Flyer = { phase: number; offset: THREE.Vector3; speed: number };
/** A loop a flock flies round: centre, radii across (x) and along (z) the land, and how fast. */
type FlightPath = { centre: THREE.Vector3; rx: number; rz: number; speed: number; scale: number };
type Bird = Flyer & { path: FlightPath };
type Butterfly = Flyer & { meadow: number; rest: THREE.Vector3; cycle: number };
type Petal = { tree: number; x: number; y: number; z: number; fall: number; drift: number };

/**
 * Everything beyond the glass: rolling meadows, a lake, a forest that thickens with distance, ranges of
 * hills fading into the haze, and a few animals going about their day. Kept sparse near the hall (open
 * lawn and flower meadows) so the view reads calmly through the glass; the density lives further out.
 */
export class Nature {
  readonly group = new THREE.Group();
  private readonly uniforms: OutdoorUniforms;
  private readonly random: Random = seeded(41);
  private readonly hall: HallFootprint;
  private readonly centreZ: number;
  private readonly lake: Water;
  /** The clearing beyond the far glass: kept open, with a pond, so there is always wildlife to watch. */
  private readonly clearing: { x: number; z: number; radius: number };
  private readonly pond: Water;
  private readonly waters: Water[];
  private readonly meadows: { x: number; z: number; radius: number }[] = [];
  private readonly occupied = new Set<string>();
  private readonly walkers: Walker[] = [];
  private owl?: { root: THREE.Group; head: THREE.Object3D; presence: number; look: number; timer: number };
  private started = false;
  private readonly rabbits: Rabbit[] = [];
  private readonly ducks: Duck[] = [];
  private birds?: { bodies: THREE.InstancedMesh; wings: THREE.InstancedMesh; flock: Bird[] };
  private butterflies?: { wings: THREE.InstancedMesh; flock: Butterfly[] };
  /** Flowering trees near the glass, which shed petals (see buildPetals). */
  private readonly blossomTrees: { x: number; z: number; scale: number; colour: THREE.Color }[] = [];
  private petals?: { points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>; drops: Petal[] };
  /** Ripples on the water, as (x, z, start time, strength), reused round-robin. */
  private readonly ripples = Array.from({ length: RIPPLES }, () => new THREE.Vector4(0, 0, -100, 0));
  private nextRipple = 0;
  private duckRipple = 0;
  private fish?: { mesh: THREE.Mesh; from: THREE.Vector2; to: THREE.Vector2; t: number; wait: number };
  private readonly kites: { body: THREE.Group; tail: THREE.Line; string: THREE.Line; anchor: THREE.Vector3; phase: number }[] = [];
  private kitePresence = 0;
  private gardenLights?: { caps: THREE.InstancedMesh; pools: THREE.InstancedMesh; thresholds: number[]; level: number };
  private readonly lightColour = new THREE.Color();
  private fireflies?: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private readonly matrix = new THREE.Matrix4();
  private readonly quaternion = new THREE.Quaternion();
  private readonly euler = new THREE.Euler();
  private readonly position = new THREE.Vector3();
  private readonly scale = new THREE.Vector3();
  private daylife = 1;

  constructor(options: { uniforms: OutdoorUniforms; hall: HallFootprint; quality: "high" | "low" }) {
    this.uniforms = options.uniforms;
    this.hall = options.hall;
    const high = options.quality === "high";
    this.centreZ = (options.hall.front + options.hall.back) / 2;
    this.lake = { x: options.hall.halfWidth + 34, z: this.centreZ - 6, rx: 20, rz: 34, y: WATER_Y, dip: true };
    const back = options.hall.back;
    this.clearing = { x: 0, z: back - 30, radius: 25 };
    this.pond = { x: 11, z: back - 35, rx: 6.5, rz: 4.5, y: GROUND_Y + 0.03, dip: false };
    this.waters = [this.lake, this.pond];
    // The clearing's own meadow comes first, so butterflies and fireflies always visit it.
    this.meadows.push({ x: -9, z: back - 16, radius: 4.5 });

    this.planMeadows(high ? 24 : 14);
    this.buildGround(high ? 260 : 170);
    this.buildLake();
    this.buildMountains();
    this.buildTrees(high ? 720 : 360);
    this.buildUndergrowth(high);
    this.buildFlowers(high);
    this.buildClearing();
    this.buildDeer();
    this.buildRabbits();
    this.buildDucks();
    this.buildBirds();
    this.buildButterflies(high ? 26 : 14);
    this.buildFireflies(high ? 150 : 70);
    this.buildPetals(high ? 240 : 110);
    this.buildKites();
    this.buildGardenLights();
    this.buildFish();
  }

  // ————————————————————————————————————————— the land

  /** Metres from the hall's footprint (0 inside it). */
  private fromHall(x: number, z: number) {
    const dx = Math.max(Math.abs(x) - this.hall.halfWidth, 0);
    const dz = Math.max(z - this.hall.front, this.hall.back - z, 0);
    return Math.hypot(dx, dz);
  }

  /** 1 at the nearest water's edge, < 1 inside it. */
  private lakeDistance(x: number, z: number, margin = 0, waters = this.waters) {
    let nearest = Infinity;
    for (const water of waters) nearest = Math.min(nearest, Math.hypot((x - water.x) / (water.rx + margin), (z - water.z) / (water.rz + margin)));
    return nearest;
  }

  private inClearing(x: number, z: number, margin = 0) {
    return Math.hypot(x - this.clearing.x, z - this.clearing.z) < this.clearing.radius + margin;
  }

  private groundHeight(x: number, z: number) {
    const d = this.fromHall(x, z);
    // Flat lawns around the hall, rolling gently further out.
    let h = GROUND_Y + THREE.MathUtils.smoothstep(d, 40, 280) * (fbm2(x * 0.007, z * 0.007) - 0.3) * 16;
    const e = this.lakeDistance(x, z, 0, [this.lake]);
    if (e < 1.25) h = THREE.MathUtils.lerp(h, -1.4, 1 - THREE.MathUtils.smoothstep(e, 0.8, 1.2));
    return h;
  }

  private planMeadows(count: number) {
    const { hall, random } = this;
    let tries = 0;
    while (this.meadows.length < count && tries < 400) {
      tries += 1;
      const side = random() > 0.5 ? 1 : -1;
      const x = side * (hall.halfWidth + 6 + random() * 32);
      const z = THREE.MathUtils.lerp(hall.back - 30, hall.front + 25, random());
      const radius = 2.6 + random() * 3;
      if (this.lakeDistance(x, z, radius + 4) < 1 || this.inClearing(x, z, radius)) continue;
      if (this.meadows.some((meadow) => Math.hypot(meadow.x - x, meadow.z - z) < meadow.radius + radius + 9)) continue;
      this.meadows.push({ x, z, radius });
    }
  }

  private buildGround(segments: number) {
    const size = 1800;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, 0, this.centreZ);
    const position = geometry.getAttribute("position") as THREE.BufferAttribute;
    const colours = new Float32Array(position.count * 3);
    const lawn = new THREE.Color("#6f9a45");
    const meadow = new THREE.Color("#86ab52");
    const forest = new THREE.Color("#47672f");
    const hill = new THREE.Color("#5f7f3c");
    const sand = new THREE.Color("#b5a47a");
    const colour = new THREE.Color();
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const z = position.getZ(i);
      position.setY(i, this.groundHeight(x, z));
      const d = this.fromHall(x, z);
      const n = fbm2(x * 0.05, z * 0.05, 3);
      colour.lerpColors(lawn, meadow, n);
      colour.lerp(forest, THREE.MathUtils.smoothstep(d, 35, 90) * 0.8);
      colour.lerp(hill, THREE.MathUtils.smoothstep(d, 160, 320));
      const e = this.lakeDistance(x, z, 0, [this.lake]);
      if (e < 1.18) colour.lerp(sand, 1 - THREE.MathUtils.smoothstep(e, 1.0, 1.18));
      colour.toArray(colours, i * 3);
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colours, 3));
    geometry.computeVertexNormals();
    const ground = new THREE.Mesh(geometry, outdoorMaterial(this.uniforms, { vertexColors: true }));
    ground.raycast = () => {};
    this.group.add(ground);

    // A pale stone apron round the glass, so the building sits on something.
    const { halfWidth, front, back } = this.hall;
    const apron = new THREE.Mesh(
      new THREE.PlaneGeometry(halfWidth * 2 + 3.2, front - back + 3.2).rotateX(-Math.PI / 2),
      outdoorMaterial(this.uniforms, { color: "#b9b2a6" }),
    );
    apron.position.set(0, -0.06, (front + back) / 2);
    this.group.add(apron);
  }

  private buildLake() {
    const { lake } = this;
    const waterMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uTime: this.uniforms.uTime,
          uWind: this.uniforms.uWind,
          uRain: this.uniforms.uRain,
          uKeyDir: this.uniforms.uKeyDir,
          uKeyColor: this.uniforms.uKeyColor,
          uSkyAmbient: this.uniforms.uSkyAmbient,
          uFogColor: this.uniforms.uFogColor,
          uFogDensity: this.uniforms.uFogDensity,
          uRipples: { value: this.ripples },
        },
        vertexShader: waterVertex,
        fragmentShader: waterFragment,
      });
    for (const body of this.waters) {
      const water = new THREE.Mesh(new THREE.CircleGeometry(1, 72).rotateX(-Math.PI / 2), waterMaterial);
      // The lake's rim is under the bank; the pond on the flat gets a muddy margin instead.
      const reach = body.dip ? 1.12 : 1;
      water.scale.set(body.rx * reach, 1, body.rz * reach);
      water.position.set(body.x, body.y, body.z);
      water.raycast = () => {};
      this.group.add(water);
      if (!body.dip) {
        const margin = new THREE.Mesh(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2), outdoorMaterial(this.uniforms, { color: "#8a7a5a" }));
        margin.scale.set(body.rx + 0.9, 1, body.rz + 0.9);
        margin.position.set(body.x, body.y - 0.015, body.z);
        this.group.add(margin);
      }
    }

    // Reeds along the near shore.
    const reed = outdoorMaterial(this.uniforms, { color: "#6d8a3a", sway: 0.12, flat: true });
    const geometry = mergeGeometries([0, 1, 2, 3].map((i) => new THREE.ConeGeometry(0.035, 1.1 + i * 0.25, 3, 1).translate(Math.cos(i * 2.1) * 0.12, 0.55 + i * 0.12, Math.sin(i * 2.1) * 0.12)));
    const count = 70;
    const reeds = new THREE.InstancedMesh(geometry, reed, count);
    for (let i = 0; i < count; i += 1) {
      const angle = Math.PI * (0.55 + this.random() * 0.9); // the side facing the hall
      const x = lake.x + Math.cos(angle) * lake.rx * (1.05 + this.random() * 0.07);
      const z = lake.z + Math.sin(angle) * lake.rz * (1.05 + this.random() * 0.07);
      this.place(reeds, i, x, this.groundHeight(x, z) - 0.05, z, 0.8 + this.random() * 0.6);
    }
    this.group.add(reeds);
  }

  /** Three ranges of hills ringing the land, each further, taller and hazier than the last. */
  private buildMountains() {
    const halfLength = (this.hall.front - this.hall.back) / 2;
    const ranges = [
      { distance: 280, height: [30, 85], haze: 0.05, low: "#3e5a33", high: "#5b6e4a", seed: 3 },
      { distance: 420, height: [60, 160], haze: 0.2, low: "#40553f", high: "#6c7a78", seed: 7 },
      { distance: 600, height: [110, 270], haze: 0.38, low: "#4a5a66", high: "#8a95a3", seed: 13 },
    ];
    for (const range of ranges) {
      const radius = halfLength + range.distance;
      const segments = 180;
      const rows = [
        { r: -70, lift: 0 },
        { r: -20, lift: 0.45 },
        { r: 25, lift: 1 },
        { r: 110, lift: 0 },
      ];
      const positions: number[] = [];
      const colours: number[] = [];
      const low = new THREE.Color(range.low);
      const high = new THREE.Color(range.high);
      const colour = new THREE.Color();
      for (let i = 0; i <= segments; i += 1) {
        const theta = (i / segments) * Math.PI * 2;
        // Sampling noise round a circle keeps the ridge seamless where it closes.
        const ridge = fbm2(Math.cos(theta) * 2.6 + range.seed, Math.sin(theta) * 2.6 + range.seed, 5);
        const peak = range.height[0] + Math.pow(ridge, 1.6) * (range.height[1] - range.height[0]) * 1.9;
        for (const [rowIndex, row] of rows.entries()) {
          const jitter = rowIndex === 1 ? (hash2(i, range.seed) - 0.5) * 6 : 0;
          const r = radius + row.r + jitter;
          const y = row.lift ? peak * row.lift + (rowIndex === 1 ? (hash2(range.seed, i) - 0.5) * peak * 0.15 : 0) : -12;
          positions.push(Math.cos(theta) * r, y, this.centreZ + Math.sin(theta) * r);
          colour.lerpColors(low, high, THREE.MathUtils.clamp(y / range.height[1], 0, 1));
          colours.push(colour.r, colour.g, colour.b);
        }
      }
      const index: number[] = [];
      const stride = rows.length;
      for (let i = 0; i < segments; i += 1) {
        for (let row = 0; row < rows.length - 1; row += 1) {
          const a = i * stride + row;
          const b = (i + 1) * stride + row;
          index.push(a, a + 1, b, b, a + 1, b + 1);
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colours, 3));
      geometry.setIndex(index);
      geometry.computeVertexNormals();
      const mesh = new THREE.Mesh(geometry, outdoorMaterial(this.uniforms, { vertexColors: true, flat: true, haze: range.haze, side: THREE.DoubleSide }));
      mesh.raycast = () => {};
      this.group.add(mesh);
    }
  }

  // ————————————————————————————————————————— trees and plants

  private place(mesh: THREE.InstancedMesh, index: number, x: number, y: number, z: number, scale: number, tilt = 0) {
    this.euler.set(tilt * (this.random() - 0.5), this.random() * Math.PI * 2, tilt * (this.random() - 0.5));
    this.quaternion.setFromEuler(this.euler);
    this.matrix.compose(this.position.set(x, y, z), this.quaternion, this.scale.setScalar(scale));
    mesh.setMatrixAt(index, this.matrix);
  }

  /** One thing per 4m cell, so nothing grows through anything else. */
  private claim(x: number, z: number, cell = 4) {
    const key = `${Math.round(x / cell)}:${Math.round(z / cell)}`;
    if (this.occupied.has(key)) return false;
    this.occupied.add(key);
    return true;
  }

  private buildTrees(count: number) {
    const { random } = this;
    const broadTrunk = new THREE.CylinderGeometry(0.16, 0.26, 3, 6).translate(0, 1.3, 0);
    const broadCanopy = mergeGeometries([
      new THREE.IcosahedronGeometry(1.7, 0).translate(0, 3.9, 0),
      new THREE.IcosahedronGeometry(1.25, 0).translate(1.1, 3.4, 0.4),
      new THREE.IcosahedronGeometry(1.2, 0).translate(-0.9, 3.5, -0.5),
      new THREE.IcosahedronGeometry(1.0, 0).translate(0.2, 4.9, -0.2),
    ]);
    const pineTrunk = new THREE.CylinderGeometry(0.12, 0.2, 2.4, 6).translate(0, 1.0, 0);
    const pineCanopy = mergeGeometries([
      new THREE.ConeGeometry(1.8, 2.8, 7).translate(0, 2.8, 0),
      new THREE.ConeGeometry(1.4, 2.4, 7).translate(0, 4.2, 0),
      new THREE.ConeGeometry(0.95, 2.0, 7).translate(0, 5.5, 0),
    ]);
    const palm = this.palmGeometry();

    const bark = outdoorMaterial(this.uniforms, { color: "#5a4433", flat: true, sway: 0.008 });
    const leaves = outdoorMaterial(this.uniforms, { flat: true, sway: 0.045 });
    const needles = outdoorMaterial(this.uniforms, { flat: true, sway: 0.025 });
    const palms = outdoorMaterial(this.uniforms, { flat: true, sway: 0.03, vertexColors: true, side: THREE.DoubleSide });

    type Spot = { x: number; z: number; d: number };
    const spots: Spot[] = [];
    let tries = 0;
    while (spots.length < count && tries < count * 40) {
      tries += 1;
      const x = (random() - 0.5) * 400;
      const z = THREE.MathUtils.lerp(this.hall.back - 190, this.hall.front + 190, random());
      const d = this.fromHall(x, z);
      // Trees grow from ~10m out: close enough to frame the glass, with canopies still clear of it.
      if (d < 10 || d > 190) continue;
      if (this.lakeDistance(x, z, 6) < 1 || this.inClearing(x, z, 2)) continue;
      if (this.meadows.some((meadow) => Math.hypot(meadow.x - x, meadow.z - z) < meadow.radius + 3)) continue;
      // Scattered trees close in, thickening into forest beyond ~45m.
      const chance = d < 30 ? 0.45 : d < 50 ? 0.6 : 0.95;
      if (random() > chance) continue;
      if (!this.claim(x, z, d < 50 ? 11 : 7)) continue;
      spots.push({ x, z, d });
    }

    const broad = spots.filter((_, i) => i % 3 !== 2);
    const pines = spots.filter((_, i) => i % 3 === 2);
    const greens = ["#4f7d34", "#5d8e3b", "#406d2f", "#6b9440", "#3a6331"].map((hex) => new THREE.Color(hex));
    // Flowering trees among the green near the hall, in whatever is in bloom this month.
    const { colours: blossoms, share: blossomShare } = seasonBlossoms(new Date().getMonth());

    const broadTrunks = new THREE.InstancedMesh(broadTrunk, bark, broad.length);
    const broadCanopies = new THREE.InstancedMesh(broadCanopy, leaves, broad.length);
    broad.forEach(({ x, z, d }, i) => {
      // Full-grown: roughly 10–18m tall.
      const s = 1.7 + random() * 1.1 + (d > 60 ? 0.3 : 0);
      const y = this.groundHeight(x, z) - 0.2;
      this.place(broadTrunks, i, x, y, z, s);
      broadCanopies.setMatrixAt(i, this.matrix);
      const blossom = d < 50 && random() < blossomShare;
      const colour = blossom ? blossoms[Math.floor(random() * blossoms.length)] : greens[Math.floor(random() * greens.length)];
      broadCanopies.setColorAt(i, colour);
      if (blossom && d < 35) this.blossomTrees.push({ x, z, scale: s, colour });
    });
    const pineTrunks = new THREE.InstancedMesh(pineTrunk, bark, pines.length);
    const pineCanopies = new THREE.InstancedMesh(pineCanopy, needles, pines.length);
    const pineGreens = ["#2f5a34", "#365f2f", "#2b5030"].map((hex) => new THREE.Color(hex));
    pines.forEach(({ x, z }, i) => {
      // Roughly 12–21m tall.
      const s = 1.8 + random() * 1.4;
      const y = this.groundHeight(x, z) - 0.2;
      this.place(pineTrunks, i, x, y, z, s);
      pineCanopies.setMatrixAt(i, this.matrix);
      pineCanopies.setColorAt(i, pineGreens[Math.floor(random() * pineGreens.length)]);
    });

    // Palms lean over the lake's far shore.
    const palmCount = 9;
    const palmMesh = new THREE.InstancedMesh(palm, palms, palmCount);
    const { lake } = this;
    for (let i = 0; i < palmCount; i += 1) {
      const angle = -Math.PI * 0.45 + (i / (palmCount - 1)) * Math.PI * 0.9 + (random() - 0.5) * 0.15;
      const x = lake.x + Math.cos(angle) * (lake.rx + 3 + random() * 3);
      const z = lake.z + Math.sin(angle) * (lake.rz + 3 + random() * 3);
      this.place(palmMesh, i, x, this.groundHeight(x, z) - 0.1, z, 1.3 + random() * 0.5, 0.25);
    }

    for (const mesh of [broadTrunks, broadCanopies, pineTrunks, pineCanopies, palmMesh]) {
      mesh.computeBoundingSphere();
      mesh.raycast = () => {};
      this.group.add(mesh);
    }
  }

  private palmGeometry() {
    const trunkColour = new THREE.Color("#7a6248");
    const frondColour = new THREE.Color("#4e8a3a");
    const parts: THREE.BufferGeometry[] = [];
    const paint = (geometry: THREE.BufferGeometry, colour: THREE.Color) => {
      const g = geometry.index ? geometry.toNonIndexed() : geometry;
      const count = g.getAttribute("position").count;
      const colours = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) colour.toArray(colours, i * 3);
      g.setAttribute("color", new THREE.BufferAttribute(colours, 3));
      g.deleteAttribute("uv");
      return g;
    };
    // A gently curving trunk in four stacked sections.
    for (let i = 0; i < 4; i += 1) {
      parts.push(paint(new THREE.CylinderGeometry(0.15 - i * 0.015, 0.19 - i * 0.015, 1.8, 6).translate(i * i * 0.06, 0.9 + i * 1.75, 0), trunkColour));
    }
    const top = new THREE.Vector3(0.54, 7.1, 0);
    for (let i = 0; i < 8; i += 1) {
      const frond = new THREE.PlaneGeometry(0.7, 3.2, 1, 3);
      // Droop the frond as it reaches out.
      const position = frond.getAttribute("position") as THREE.BufferAttribute;
      for (let v = 0; v < position.count; v += 1) {
        const along = (position.getY(v) + 1.6) / 3.2;
        position.setXYZ(v, position.getX(v) * (1 - along * 0.6), along * 3.2, -along * along * 1.6);
      }
      frond.rotateX(-Math.PI / 2 + 0.35);
      frond.rotateY((i / 8) * Math.PI * 2);
      frond.translate(top.x, top.y, top.z);
      parts.push(paint(frond, frondColour));
    }
    return mergeGeometries(parts);
  }

  private buildUndergrowth(high: boolean) {
    const { random } = this;
    // Bushes at the forest's edge and the odd one on the lawn.
    const bushCount = high ? 170 : 90;
    const bushes = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.8, 0).scale(1.2, 0.75, 1).translate(0, 0.35, 0), outdoorMaterial(this.uniforms, { flat: true, sway: 0.04 }), bushCount);
    const bushGreens = ["#4d7a33", "#5a8a3a", "#44702f"].map((hex) => new THREE.Color(hex));
    // Bougainvillea: a quarter of the bushes in flower, magenta and orange.
    const bushFlowers = ["#d6267a", "#ff7a1a", "#e8459b"].map((hex) => new THREE.Color(hex));
    let placed = 0;
    for (let tries = 0; placed < bushCount && tries < bushCount * 30; tries += 1) {
      const x = (random() - 0.5) * 260;
      const z = THREE.MathUtils.lerp(this.hall.back - 120, this.hall.front + 120, random());
      const d = this.fromHall(x, z);
      if (d < 12 || this.lakeDistance(x, z, 3) < 1 || this.inClearing(x, z)) continue;
      if (random() > (d < 35 ? 0.12 : 0.8)) continue;
      if (this.meadows.some((meadow) => Math.hypot(meadow.x - x, meadow.z - z) < meadow.radius + 1)) continue;
      if (!this.claim(x, z, 3)) continue;
      this.place(bushes, placed, x, this.groundHeight(x, z) - 0.1, z, 0.6 + random() * 0.9);
      bushes.setColorAt(placed, random() < 0.25 ? bushFlowers[Math.floor(random() * bushFlowers.length)] : bushGreens[Math.floor(random() * bushGreens.length)]);
      placed += 1;
    }
    bushes.count = placed;

    // Rocks, a few, half sunk.
    const rockCount = 34;
    const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.7, 0).scale(1.3, 0.7, 1), outdoorMaterial(this.uniforms, { color: "#8a8780", flat: true }), rockCount);
    placed = 0;
    for (let tries = 0; placed < rockCount && tries < 2000; tries += 1) {
      const x = (random() - 0.5) * 200;
      const z = THREE.MathUtils.lerp(this.hall.back - 80, this.hall.front + 80, random());
      const d = this.fromHall(x, z);
      if (d < 14 || this.lakeDistance(x, z, 1) < 1 || this.inClearing(x, z) || !this.claim(x, z, 3)) continue;
      this.place(rocks, placed, x, this.groundHeight(x, z) - 0.15, z, 0.4 + random() * 1.1, 0.6);
      placed += 1;
    }
    rocks.count = placed;

    // Grass tufts break up the lawn by the glass.
    const tuftCount = high ? 520 : 240;
    const tuftGeometry = mergeGeometries([0, 1, 2].map((i) => new THREE.ConeGeometry(0.05, 0.42 + i * 0.08, 3, 1).translate(0, 0.21 + i * 0.04, 0).rotateZ((i - 1) * 0.3).rotateY(i * 2.1)));
    const tufts = new THREE.InstancedMesh(tuftGeometry, outdoorMaterial(this.uniforms, { flat: true, sway: 0.3 }), tuftCount);
    const tuftGreens = ["#5f8a38", "#6a9640", "#557f33"].map((hex) => new THREE.Color(hex));
    placed = 0;
    for (let tries = 0; placed < tuftCount && tries < tuftCount * 6; tries += 1) {
      const side = random() > 0.5 ? 1 : -1;
      const x = side * (this.hall.halfWidth + 1.8 + random() ** 1.5 * 45);
      const z = THREE.MathUtils.lerp(this.hall.back - 40, this.hall.front + 30, random());
      if (this.lakeDistance(x, z, 0.5) < 1) continue;
      this.place(tufts, placed, x, this.groundHeight(x, z), z, 0.7 + random() * 0.8, 0.2);
      tufts.setColorAt(placed, tuftGreens[Math.floor(random() * tuftGreens.length)]);
      placed += 1;
    }
    tufts.count = placed;

    for (const mesh of [bushes, rocks, tufts]) {
      mesh.computeBoundingSphere();
      mesh.raycast = () => {};
      this.group.add(mesh);
    }
  }

  /** Flowers grow in meadows of two or three colours, never scattered everywhere. */
  private buildFlowers(high: boolean) {
    const { random } = this;
    // Vivid, saturated meadows: each in two or three colours, so they read as bold patches of colour.
    const palettes = [
      ["#ff2d55", "#ffcc00"],
      ["#ffffff", "#ffcc00", "#ff8a00"],
      ["#9b5cff", "#ff6ec7"],
      ["#ff6ec7", "#ff2d55", "#ffffff"],
      ["#ff8a00", "#ffd400"],
      ["#00b4ff", "#ffffff", "#9b5cff"],
      ["#ff3d7f", "#ffd400"],
    ].map((palette) => palette.map((hex) => new THREE.Color(hex)));
    const perMeadow = high ? 72 : 40;
    const total = this.meadows.length * perMeadow;
    const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.016, 0.42, 3).translate(0, 0.21, 0), outdoorMaterial(this.uniforms, { color: "#4f7f30", sway: 0.25 }), total);
    const head = mergeGeometries([new THREE.IcosahedronGeometry(0.1, 0).scale(1, 0.55, 1), new THREE.IcosahedronGeometry(0.04, 0).translate(0, 0.03, 0)]).translate(0, 0.43, 0);
    const heads = new THREE.InstancedMesh(head, outdoorMaterial(this.uniforms, { flat: true, sway: 0.25 }), total);
    let index = 0;
    this.meadows.forEach((meadow, m) => {
      const palette = palettes[m % palettes.length];
      for (let i = 0; i < perMeadow; i += 1) {
        // Denser at the heart of the meadow.
        const r = meadow.radius * Math.sqrt(random()) * (0.4 + random() * 0.6);
        const a = random() * Math.PI * 2;
        const x = meadow.x + Math.cos(a) * r;
        const z = meadow.z + Math.sin(a) * r;
        const s = 0.8 + random() * 0.7;
        this.place(stems, index, x, this.groundHeight(x, z), z, s, 0.2);
        heads.setMatrixAt(index, this.matrix);
        heads.setColorAt(index, palette[Math.floor(random() * palette.length)]);
        index += 1;
      }
    });
    for (const mesh of [stems, heads]) {
      mesh.computeBoundingSphere();
      mesh.raycast = () => {};
      this.group.add(mesh);
    }
  }

  // ————————————————————————————————————————— animals

  /** A four-legged body: `legs` hinge at the hip, `neck` at the shoulder, `head` at the top of the neck. */
  private quadruped(parts: {
    body: THREE.BufferGeometry;
    material: THREE.Material;
    legLength: number;
    legWidth: number;
    hips: [number, number][];
    neckAt: [number, number, number];
    neck?: THREE.BufferGeometry;
    headAt: [number, number, number];
    head: THREE.Object3D[];
    extras?: THREE.Object3D[];
  }) {
    const root = new THREE.Group();
    root.add(new THREE.Mesh(parts.body, parts.material));
    for (const extra of parts.extras ?? []) root.add(extra);
    const neck = new THREE.Group();
    neck.position.set(...parts.neckAt);
    if (parts.neck) neck.add(new THREE.Mesh(parts.neck, parts.material));
    const head = new THREE.Group();
    head.position.set(...parts.headAt);
    for (const piece of parts.head) head.add(piece);
    neck.add(head);
    root.add(neck);
    const legs: THREE.Object3D[] = [];
    for (const [x, z] of parts.hips) {
      const leg = new THREE.Group();
      leg.position.set(x, parts.legLength, z);
      leg.add(new THREE.Mesh(box(parts.legWidth, parts.legLength, parts.legWidth * 1.1, 0, -parts.legLength / 2, 0), parts.material));
      root.add(leg);
      legs.push(leg);
    }
    root.traverse((object) => (object.raycast = () => {}));
    return { root, neck, head, legs };
  }

  private deerModel(stag: boolean) {
    const coat = outdoorMaterial(this.uniforms, { color: "#8d5b34", flat: true });
    const pale = outdoorMaterial(this.uniforms, { color: "#d9c3a2", flat: true });
    const dark = outdoorMaterial(this.uniforms, { color: "#3a2a1f", flat: true });
    const head: THREE.Object3D[] = [
      new THREE.Mesh(box(0.2, 0.2, 0.42, 0, 0, 0.12), coat),
      new THREE.Mesh(box(0.08, 0.16, 0.04, -0.1, 0.16, -0.04).rotateZ(0.5), coat),
      new THREE.Mesh(box(0.08, 0.16, 0.04, 0.1, 0.16, -0.04).rotateZ(-0.5), coat),
      new THREE.Mesh(box(0.08, 0.06, 0.05, 0, -0.02, 0.34), dark),
    ];
    if (stag) {
      for (const side of [-1, 1]) {
        head.push(new THREE.Mesh(mergeGeometries([box(0.03, 0.42, 0.03, side * 0.07, 0.3, 0).rotateZ(side * -0.3), box(0.03, 0.2, 0.03, side * 0.16, 0.4, 0.06).rotateZ(side * 0.4)]), pale));
      }
    }
    return this.quadruped({
      body: mergeGeometries([box(0.42, 0.46, 1.15, 0, 0.98, 0), box(0.3, 0.3, 0.9, 0, 0.82, 0)]),
      material: coat,
      legLength: 0.82,
      legWidth: 0.08,
      hips: [[-0.13, 0.42], [0.13, 0.42], [-0.13, -0.42], [0.13, -0.42]],
      neckAt: [0, 1.12, 0.48],
      neck: box(0.17, 0.6, 0.2, 0, 0.26, 0.04).rotateX(0.35),
      headAt: [0, 0.56, 0.17],
      head,
      extras: [new THREE.Mesh(box(0.12, 0.14, 0.08, 0, 1.08, -0.6), pale)],
    });
  }

  /** An Asian elephant, at `size` (1 = a cow about 2.6m at the shoulder). */
  private elephantModel(size: number) {
    const hide = outdoorMaterial(this.uniforms, { color: "#7b7774", flat: true });
    const ivory = outdoorMaterial(this.uniforms, { color: "#ece4d2", flat: true });
    // The trunk: three tapered segments, each hinged at the end of the last, so it stays one piece
    // however it sways or curls.
    const trunk = new THREE.Group();
    trunk.position.set(0, -0.3, 0.42);
    const trunkJoints: THREE.Object3D[] = [];
    let parent: THREE.Object3D = trunk;
    let offset = 0;
    for (const [length, top, bottom] of [[0.8, 0.18, 0.14], [0.7, 0.14, 0.1], [0.55, 0.1, 0.07]]) {
      const joint = new THREE.Group();
      joint.position.y = -offset;
      joint.add(new THREE.Mesh(new THREE.CylinderGeometry(bottom, top, length + 0.04, 7).translate(0, -length / 2, 0), hide));
      parent.add(joint);
      trunkJoints.push(joint);
      parent = joint;
      offset = length;
    }
    const head: THREE.Object3D[] = [
      new THREE.Mesh(box(1.0, 1.1, 0.9, 0, 0, 0), hide),
      new THREE.Mesh(box(0.08, 1.0, 0.85, -0.6, -0.05, -0.25).rotateY(-0.35), hide),
      new THREE.Mesh(box(0.08, 1.0, 0.85, 0.6, -0.05, -0.25).rotateY(0.35), hide),
      trunk,
    ];
    if (size > 0.8) head.push(new THREE.Mesh(mergeGeometries([box(0.08, 0.08, 0.5, -0.22, -0.5, 0.55).rotateX(0.5), box(0.08, 0.08, 0.5, 0.22, -0.5, 0.55).rotateX(0.5)]), ivory));
    const model = this.quadruped({
      body: mergeGeometries([box(1.5, 1.45, 2.5, 0, 2.05, 0), box(1.3, 0.5, 2.1, 0, 2.85, 0), box(1.2, 0.6, 2.2, 0, 1.4, 0)]),
      material: hide,
      legLength: 1.45,
      legWidth: 0.42,
      hips: [[-0.45, 0.85], [0.45, 0.85], [-0.45, -0.85], [0.45, -0.85]],
      neckAt: [0, 2.5, 1.25],
      headAt: [0, 0.1, 0.35],
      head,
      extras: [new THREE.Mesh(box(0.07, 0.8, 0.07, 0, 2.2, -1.32).rotateX(0.2), hide)],
    });
    model.root.scale.setScalar(size);
    return { ...model, trunk: trunkJoints };
  }

  private boarModel() {
    const bristle = outdoorMaterial(this.uniforms, { color: "#6b5442", flat: true });
    const snout = outdoorMaterial(this.uniforms, { color: "#4a3a30", flat: true });
    const tusk = outdoorMaterial(this.uniforms, { color: "#ece4d2", flat: true });
    return this.quadruped({
      body: mergeGeometries([box(0.5, 0.55, 1.1, 0, 0.62, 0), box(0.36, 0.2, 0.8, 0, 0.98, 0.1)]),
      material: bristle,
      legLength: 0.38,
      legWidth: 0.09,
      hips: [[-0.15, 0.35], [0.15, 0.35], [-0.15, -0.38], [0.15, -0.38]],
      neckAt: [0, 0.72, 0.55],
      headAt: [0, 0, 0.1],
      head: [
        new THREE.Mesh(box(0.36, 0.38, 0.45, 0, 0, 0.15), bristle),
        new THREE.Mesh(box(0.16, 0.16, 0.18, 0, -0.08, 0.45), snout),
        new THREE.Mesh(mergeGeometries([box(0.03, 0.12, 0.03, -0.1, 0.0, 0.42).rotateZ(0.3), box(0.03, 0.12, 0.03, 0.1, 0.0, 0.42).rotateZ(-0.3)]), tusk),
        new THREE.Mesh(mergeGeometries([box(0.08, 0.14, 0.04, -0.13, 0.24, -0.02), box(0.08, 0.14, 0.04, 0.13, 0.24, -0.02)]), bristle),
      ],
    });
  }

  private heronModel() {
    const plumage = outdoorMaterial(this.uniforms, { color: "#c9ccd0", flat: true });
    const dark = outdoorMaterial(this.uniforms, { color: "#4b4f55", flat: true });
    const beak = outdoorMaterial(this.uniforms, { color: "#d9a640", flat: true });
    return this.quadruped({
      body: new THREE.IcosahedronGeometry(0.28, 0).scale(0.8, 0.85, 1.5).rotateX(-0.35).translate(0, 1.0, 0),
      material: plumage,
      legLength: 0.82,
      legWidth: 0.03,
      hips: [[-0.06, 0.02], [0.06, 0.02]],
      neckAt: [0, 1.12, 0.3],
      neck: box(0.07, 0.55, 0.07, 0, 0.27, 0).rotateX(0.25),
      headAt: [0, 0.55, 0.12],
      head: [
        new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), plumage),
        new THREE.Mesh(box(0.03, 0.03, 0.3, 0, -0.01, 0.2), beak),
        new THREE.Mesh(box(0.02, 0.02, 0.18, 0, 0.05, -0.12), dark),
      ],
    });
  }

  private addWalker(
    model: { root: THREE.Group; legs: THREE.Object3D[]; neck?: THREE.Object3D; head?: THREE.Object3D; trunk?: THREE.Object3D[] },
    options: {
      home: [number, number];
      range: number;
      den: [number, number];
      speed: number;
      strideRate: number;
      swing: number;
      graze: number;
      wants: (c: Conditions) => boolean;
      pick?: () => THREE.Vector2;
    },
  ) {
    const home = new THREE.Vector2(...options.home);
    this.group.add(model.root);
    const walker: Walker = {
      ...model,
      home,
      range: options.range,
      den: new THREE.Vector2(...options.den),
      target: home.clone(),
      heading: this.random() * Math.PI * 2,
      state: "graze",
      timer: 1 + this.random() * 6,
      stride: 0,
      speed: options.speed,
      strideRate: options.strideRate,
      swing: options.swing,
      graze: options.graze,
      gone: false,
      wants: options.wants,
      pick: options.pick,
    };
    // Scatter a herd round its home from the start.
    const start = this.wanderTarget(walker);
    model.root.position.set(start.x, this.groundHeight(start.x, start.y), start.y);
    this.walkers.push(walker);
    return walker;
  }

  /**
   * Who comes to the clearing beyond the far glass. Something is always there to see:
   * deer from dawn to dusk unless it pours, elephants on any day but a misty one (they love the rain),
   * a heron at the pond in rain or mist, wild boar and an owl after dark, and fireflies on dry nights.
   * Homes sit either side of the end wall's logo, which would hide whoever stood dead centre.
   */
  private buildClearing() {
    const { clearing, pond } = this;
    const z = clearing.z;
    const deerHours = (c: Conditions) => c.night < 0.85 && c.rain < 0.6;
    for (const stag of [true, false, false]) {
      this.addWalker(this.deerModel(stag), { home: [-9, z + 6], range: 6, den: [-30, z - 18], speed: 0.9, strideRate: 4.2, swing: 0.42, graze: 2.0, wants: deerHours });
    }
    const elephantDays = (c: Conditions) => c.day > 0.2 && c.mist < 0.6;
    const mother = this.addWalker(this.elephantModel(1), { home: [9, z + 9], range: 5, den: [30, z - 20], speed: 0.7, strideRate: 2.2, swing: 0.3, graze: 0.25, wants: elephantDays });
    // The calf keeps close to its mother.
    this.addWalker(this.elephantModel(0.55), {
      home: [10, z + 10],
      range: 3,
      den: [32, z - 19],
      speed: 0.8,
      strideRate: 3,
      swing: 0.32,
      graze: 0.25,
      wants: elephantDays,
      pick: () => new THREE.Vector2(mother.root.position.x + (this.random() - 0.5) * 4, mother.root.position.z + (this.random() - 0.5) * 4),
    });
    // Close to the glass, where the hall's lamplight reaches them.
    const boarNights = (c: Conditions) => c.night > 0.3;
    for (let i = 0; i < 2; i += 1) {
      this.addWalker(this.boarModel(), { home: [-6 - i * 2.5, this.hall.back - 10], range: 3.5, den: [-27, z + 4], speed: 0.8, strideRate: 7, swing: 0.5, graze: 0.7, wants: boarNights });
    }
    // The heron wades the pond's shallows.
    this.addWalker(this.heronModel(), {
      home: [pond.x, pond.z],
      range: 3,
      den: [pond.x + 30, pond.z - 25],
      speed: 0.35,
      strideRate: 3,
      swing: 0.35,
      graze: 0.9,
      wants: (c) => (c.rain > 0.5 || c.mist > 0.5) && c.night < 0.7,
      pick: () => {
        const angle = this.random() * Math.PI * 2;
        const reach = 0.7 + this.random() * 0.25;
        return new THREE.Vector2(pond.x + Math.cos(angle) * pond.rx * reach, pond.z + Math.sin(angle) * pond.rz * reach);
      },
    });

    // A big leafy tree at the clearing's edge; at night an owl perches on its low branch, under the canopy.
    const bark = outdoorMaterial(this.uniforms, { color: "#5a4433", flat: true });
    const leaves = outdoorMaterial(this.uniforms, { color: "#4f7d34", flat: true, sway: 0.012 });
    const perchTree = new THREE.Group();
    perchTree.add(
      new THREE.Mesh(
        mergeGeometries([
          new THREE.CylinderGeometry(0.24, 0.42, 6.4, 7).translate(0, 3.2, 0),
          new THREE.CylinderGeometry(0.06, 0.11, 1.8, 5).translate(0, 0.9, 0).rotateZ(-0.9).translate(0.15, 3.0, 0),
          new THREE.CylinderGeometry(0.08, 0.14, 2.2, 5).translate(0, 1.1, 0).rotateZ(0.7).translate(-0.1, 4.6, 0),
        ]),
        bark,
      ),
      new THREE.Mesh(
        mergeGeometries([
          new THREE.IcosahedronGeometry(3.0, 0).translate(0, 8.2, 0),
          new THREE.IcosahedronGeometry(2.3, 0).translate(2.2, 7.0, 0.6),
          new THREE.IcosahedronGeometry(2.2, 0).translate(-2.0, 7.3, -0.7),
          new THREE.IcosahedronGeometry(1.8, 0).translate(0.4, 9.9, -0.3),
        ]),
        leaves,
      ),
    );
    const perch = new THREE.Vector3(-13, 0, z + 4);
    perchTree.position.copy(perch).setY(this.groundHeight(perch.x, perch.z) - 0.1);
    perchTree.traverse((object) => (object.raycast = () => {}));
    this.group.add(perchTree);
    const feathers = outdoorMaterial(this.uniforms, { color: "#8a7458", flat: true });
    const eyes = outdoorMaterial(this.uniforms, { color: "#000000" });
    eyes.uniforms.uEmissive.value.set(1.6, 1.25, 0.25);
    const owl = new THREE.Group();
    owl.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0).scale(1, 1.35, 0.9), feathers));
    const head = new THREE.Group();
    head.position.y = 0.32;
    head.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 0).scale(1.1, 0.95, 1), feathers));
    head.add(new THREE.Mesh(mergeGeometries([new THREE.ConeGeometry(0.04, 0.12, 3).translate(-0.09, 0.15, 0), new THREE.ConeGeometry(0.04, 0.12, 3).translate(0.09, 0.15, 0)]), feathers));
    head.add(new THREE.Mesh(mergeGeometries([new THREE.SphereGeometry(0.035, 8, 6).translate(-0.06, 0.02, 0.13), new THREE.SphereGeometry(0.035, 8, 6).translate(0.06, 0.02, 0.13)]), eyes));
    owl.add(head);
    // On the end of the long branch, facing the hall.
    owl.position.set(perch.x + 1.45, perchTree.position.y + 3.95, perch.z);
    owl.scale.setScalar(0.001);
    owl.visible = false;
    owl.traverse((object) => (object.raycast = () => {}));
    this.group.add(owl);
    this.owl = { root: owl, head, presence: 0, look: 0, timer: 2 };
  }

  /** Deer on the side meadows too, keeping the same hours as the herd in the clearing. */
  private buildDeer() {
    const homes = this.meadows.slice(1).filter((meadow) => Math.abs(meadow.x) < this.hall.halfWidth + 34).slice(0, 3);
    homes.forEach((meadow, i) => {
      const side = Math.sign(meadow.x) || 1;
      this.addWalker(this.deerModel(i === 0), {
        home: [meadow.x, meadow.z],
        range: 9,
        den: [meadow.x + side * 45, meadow.z],
        speed: 0.9,
        strideRate: 4.2,
        swing: 0.42,
        graze: 2.0,
        wants: (c) => c.night < 0.85 && c.rain < 0.6,
      });
    });
  }

  private buildRabbits() {
    const fur = outdoorMaterial(this.uniforms, { color: "#a89a88", flat: true });
    const tail = outdoorMaterial(this.uniforms, { color: "#f2eee6", flat: true });
    // A pair in the clearing's meadow, and one on each of two side meadows.
    const homes = [this.meadows[0], this.meadows[0], ...this.meadows.slice(4, 6)].filter(Boolean);
    homes.forEach((meadow, i) => {
      const root = new THREE.Group();
      root.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0).scale(1, 0.9, 1.4).translate(0, 0.16, 0), fur));
      root.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0).translate(0, 0.3, 0.18), fur));
      root.add(new THREE.Mesh(mergeGeometries([box(0.04, 0.2, 0.025, -0.04, 0.46, 0.14).rotateZ(0.08), box(0.04, 0.2, 0.025, 0.04, 0.46, 0.14).rotateZ(-0.08)]), fur));
      root.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.05, 0).translate(0, 0.2, -0.22), tail));
      const home = new THREE.Vector2(meadow.x + i * 0.8, meadow.z);
      root.position.set(home.x, this.groundHeight(home.x, home.y), home.y);
      root.traverse((object) => (object.raycast = () => {}));
      this.group.add(root);
      const den = new THREE.Vector2(meadow.x - 12, meadow.z - 14);
      this.rabbits.push({ root, home, den, target: home.clone(), heading: this.random() * Math.PI * 2, hop: 0, rest: this.random() * 3, gone: false });
    });
  }

  private buildDucks() {
    const body = outdoorMaterial(this.uniforms, { color: "#f1ede4", flat: true });
    const beak = outdoorMaterial(this.uniforms, { color: "#e89a2c", flat: true });
    for (let i = 0; i < 3; i += 1) {
      const root = new THREE.Group();
      root.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0).scale(1, 0.7, 1.5).translate(0, 0.05, 0), body));
      root.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0).translate(0, 0.26, 0.2), body));
      root.add(new THREE.Mesh(box(0.06, 0.03, 0.1, 0, 0.24, 0.32), beak));
      root.traverse((object) => (object.raycast = () => {}));
      this.group.add(root);
      this.ducks.push({ root, angle: this.random() * Math.PI * 2, speed: 0.025 + this.random() * 0.02, radius: new THREE.Vector2(5 + i * 3.5, 9 + i * 5), phase: this.random() * 10 });
    }
  }

  /**
   * Two flocks: dark swifts wheeling high over the land, and a colourful low flock — kingfisher blue,
   * bee-eater green, oriole gold — that swings past close to the glass.
   */
  private buildBirds() {
    const high: FlightPath = { centre: new THREE.Vector3(-30, 32, this.centreZ - 20), rx: 70, rz: 95, speed: 0.06, scale: 1.6 };
    const low: FlightPath = {
      centre: new THREE.Vector3(0, 9, this.centreZ),
      rx: this.hall.halfWidth + 17,
      rz: (this.hall.front - this.hall.back) * 0.45,
      speed: 0.035,
      scale: 1.0,
    };
    const flock: Bird[] = [];
    for (let i = 0; i < 7; i += 1) {
      flock.push({ phase: this.random() * Math.PI * 2, offset: new THREE.Vector3((this.random() - 0.5) * 9, (this.random() - 0.5) * 4, (i - 3.5) * 1.6), speed: 1, path: high });
    }
    for (let i = 0; i < 9; i += 1) {
      flock.push({ phase: this.random() * Math.PI * 2, offset: new THREE.Vector3((this.random() - 0.5) * 3, (this.random() - 0.5) * 2.5, (i - 4.5) * 2.2), speed: 1, path: low });
    }
    const material = outdoorMaterial(this.uniforms, { side: THREE.DoubleSide });
    const bodies = new THREE.InstancedMesh(new THREE.ConeGeometry(0.12, 0.6, 4).rotateX(Math.PI / 2), material, flock.length);
    const wing = new THREE.BufferGeometry();
    // A swept triangle, hinged at the body (x = 0).
    wing.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0.18, 0, 0, -0.14, 0.75, 0, -0.3], 3));
    wing.computeVertexNormals();
    const wings = new THREE.InstancedMesh(wing, material, flock.length * 2);
    const dark = new THREE.Color("#2c2b30");
    const bright = ["#1e88e5", "#2fbf71", "#ffc928", "#ff7a1a", "#00a6d6"].map((hex) => new THREE.Color(hex));
    flock.forEach((bird, i) => {
      const colour = bird.path === high ? dark : bright[i % bright.length];
      bodies.setColorAt(i, colour);
      wings.setColorAt(i * 2, colour);
      wings.setColorAt(i * 2 + 1, colour);
    });
    for (const mesh of [bodies, wings]) {
      mesh.frustumCulled = false;
      mesh.raycast = () => {};
      this.group.add(mesh);
    }
    this.birds = { bodies, wings, flock };
  }

  /** Butterflies in bright colours over the meadows; every so often one settles on a flower. */
  private buildButterflies(count: number) {
    if (!this.meadows.length) return;
    const wing = new THREE.BufferGeometry();
    wing.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0.05, 0.11, 0, 0.09, 0.13, 0, -0.02, 0, 0, -0.06, 0.08, 0, -0.08], 3));
    wing.setIndex([0, 1, 2, 0, 2, 3, 3, 2, 4]);
    wing.computeVertexNormals();
    const wings = new THREE.InstancedMesh(wing, outdoorMaterial(this.uniforms, { side: THREE.DoubleSide }), count * 2);
    const colours = ["#ff8a00", "#ffd400", "#00b4ff", "#ff3d7f", "#b04dff", "#ffffff", "#3ddc84"].map((hex) => new THREE.Color(hex));
    const flock: Butterfly[] = Array.from({ length: count }, (_, i) => {
      const meadow = this.meadows[i % this.meadows.length];
      const a = this.random() * Math.PI * 2;
      const r = Math.sqrt(this.random()) * meadow.radius * 0.6;
      const x = meadow.x + Math.cos(a) * r;
      const z = meadow.z + Math.sin(a) * r;
      return {
        phase: this.random() * 100,
        offset: new THREE.Vector3(),
        speed: 0.6 + this.random() * 0.6,
        meadow: i % this.meadows.length,
        // Where it lands: on the flower heads (~0.45m up).
        rest: new THREE.Vector3(x, this.groundHeight(x, z) + 0.5, z),
        cycle: 9 + this.random() * 7,
      };
    });
    flock.forEach((_, i) => {
      const colour = colours[i % colours.length];
      wings.setColorAt(i * 2, colour);
      wings.setColorAt(i * 2 + 1, colour);
    });
    wings.frustumCulled = false;
    wings.raycast = () => {};
    this.group.add(wings);
    this.butterflies = { wings, flock };
  }

  /** Petals drifting down from the flowering trees nearest the glass, in each tree's own colour. */
  private buildPetals(count: number) {
    if (!this.blossomTrees.length) return;
    const drops: Petal[] = [];
    const positions = new Float32Array(count * 3);
    const colours = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const tree = i % this.blossomTrees.length;
      const drop: Petal = { tree, x: 0, y: 0, z: 0, fall: 0.35 + this.random() * 0.4, drift: this.random() * 10 };
      this.respawnPetal(drop, true);
      drops.push(drop);
      this.blossomTrees[tree].colour.toArray(colours, i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colours, 3));
    const points = new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.11, vertexColors: true, sizeAttenuation: true }));
    points.frustumCulled = false;
    points.raycast = () => {};
    this.group.add(points);
    this.petals = { points, drops };
  }

  /** A petal starts again somewhere in its tree's canopy (`anywhere`: at any height on the way down). */
  private respawnPetal(drop: Petal, anywhere = false) {
    const tree = this.blossomTrees[drop.tree];
    const a = this.random() * Math.PI * 2;
    const r = this.random() * 2.2 * tree.scale;
    drop.x = tree.x + Math.cos(a) * r;
    drop.z = tree.z + Math.sin(a) * r;
    const ground = this.groundHeight(drop.x, drop.z);
    drop.y = anywhere ? ground + this.random() * 3.4 * tree.scale : ground + 3.4 * tree.scale;
  }

  /** A fish that leaps from the lake now and then (see updateFish). */
  private buildFish() {
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0).scale(0.6, 0.7, 1.8), outdoorMaterial(this.uniforms, { color: "#c9d6dc", flat: true }));
    mesh.visible = false;
    mesh.raycast = () => {};
    this.group.add(mesh);
    this.fish = { mesh, from: new THREE.Vector2(), to: new THREE.Vector2(), t: 1, wait: 3 };
  }

  /**
   * Thai PBS kites — pakpao-style diamonds in the brand's colours, white with the orange-and-grey logo or
   * orange with a white one — flying high over the land on breezy dry days, each on a long string from
   * somewhere out in the fields, with an orange or white tail streaming downwind.
   */
  private buildKites() {
    const faces = { white: thaiPbsKiteTexture("white"), orange: thaiPbsKiteTexture("orange") };
    const geometry = new THREE.BufferGeometry();
    // The diamond: tip, right, bottom, left (x -0.65..0.65, y -1.2..0.9), its texture spanning that box.
    const corners = [
      [0, 0.9],
      [0.65, 0],
      [0, -1.2],
      [-0.65, 0],
    ];
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(corners.flatMap(([x, y]) => [x, y, 0]), 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(corners.flatMap(([x, y]) => [(x + 0.65) / 1.3, (y + 1.2) / 2.1]), 2));
    geometry.setIndex([0, 3, 1, 1, 3, 2]);
    geometry.computeVertexNormals();
    for (let i = 0; i < 5; i += 1) {
      const variant = i % 2 === 0 ? "white" : "orange";
      // Shown in true brand colours (kites only fly by day), whichever side faces the sun.
      const material = new THREE.MeshBasicMaterial({ map: faces[variant], color: new THREE.Color(0.92, 0.92, 0.92) });
      // Two faces back to back, so the logo reads the right way round from either side.
      const body = new THREE.Group();
      const front = new THREE.Mesh(geometry, material);
      const back = new THREE.Mesh(geometry, material);
      back.rotation.y = Math.PI;
      body.add(front, back);
      body.scale.setScalar(3);
      const tailColour = variant === "white" ? THAI_PBS_ORANGE : "#ffffff";
      const tail = new THREE.Line(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(KITE_TAIL * 3), 3)), new THREE.LineBasicMaterial({ color: tailColour }));
      const string = new THREE.Line(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3)), new THREE.LineBasicMaterial({ color: "#d8d4cc", transparent: true, opacity: 0.55 }));
      for (const object of [body, tail, string]) {
        object.frustumCulled = false;
        object.traverse((child) => (child.raycast = () => {}));
        this.group.add(object);
      }
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (this.hall.halfWidth + 45 + this.random() * 30);
      const z = THREE.MathUtils.lerp(this.hall.back + 10, this.hall.front - 5, (i + 0.5) / 5);
      this.kites.push({ body, tail, string, anchor: new THREE.Vector3(x, this.groundHeight(x, z), z), phase: this.random() * 10 });
    }
  }

  /**
   * Garden lights: low bollards along both lawns, round the clearing's pond and meadow, and along the near
   * lake shore. Each switches on at dusk, a moment apart, and casts a warm pool on the grass.
   */
  private buildGardenLights() {
    const spots: THREE.Vector2[] = [];
    const along = this.hall.halfWidth + 5.5;
    for (let z = this.hall.front + 6; z > this.hall.back - 6; z -= 7) {
      for (const side of [-1, 1]) {
        if (this.lakeDistance(side * along, z, 1) > 1) spots.push(new THREE.Vector2(side * along, z));
      }
    }
    const ring = (x: number, z: number, rx: number, rz: number, count: number, from = 0, to = Math.PI * 2) => {
      for (let i = 0; i < count; i += 1) {
        const a = from + ((i + 0.5) / count) * (to - from);
        spots.push(new THREE.Vector2(x + Math.cos(a) * rx, z + Math.sin(a) * rz));
      }
    };
    ring(this.pond.x, this.pond.z, this.pond.rx + 2.2, this.pond.rz + 2.2, 9);
    const meadow = this.meadows[0];
    if (meadow) ring(meadow.x, meadow.z, meadow.radius + 1.6, meadow.radius + 1.6, 7);
    ring(this.lake.x, this.lake.z, this.lake.rx * 1.2, this.lake.rz * 1.2, 9, Math.PI * 0.6, Math.PI * 1.4);

    const count = spots.length;
    const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.08, 0.6, 6).translate(0, 0.3, 0), outdoorMaterial(this.uniforms, { color: "#2b2a28", flat: true }), count);
    const caps = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 8).translate(0, 0.64, 0), new THREE.MeshBasicMaterial({ toneMapped: false }), count);
    const pools = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(4, 4).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: radialTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
      count,
    );
    const thresholds: number[] = [];
    spots.forEach((spot, i) => {
      const y = this.groundHeight(spot.x, spot.y);
      this.matrix.makeTranslation(spot.x, y, spot.y);
      posts.setMatrixAt(i, this.matrix);
      caps.setMatrixAt(i, this.matrix);
      this.matrix.makeTranslation(spot.x, y + 0.03, spot.y);
      pools.setMatrixAt(i, this.matrix);
      caps.setColorAt(i, LIGHT_OFF);
      pools.setColorAt(i, LIGHT_OFF);
      thresholds.push(this.random() * 0.2);
    });
    for (const mesh of [posts, caps, pools]) {
      mesh.computeBoundingSphere();
      mesh.raycast = () => {};
      this.group.add(mesh);
    }
    this.gardenLights = { caps, pools, thresholds, level: -1 };
  }

  private updateKites(dt: number, time: number) {
    // Up on breezy, dry days; down in rain, still air, and at night.
    const wind = this.uniforms.uWind.value;
    this.kitePresence = damp(this.kitePresence, this.daylife > 0.3 && wind > 0.18 ? 1 : 0, 0.6, dt);
    const visible = this.kitePresence > 0.02;
    const gust = THREE.MathUtils.clamp(wind, 0.2, 1);
    for (const kite of this.kites) {
      for (const object of [kite.body, kite.tail, kite.string]) object.visible = visible;
      if (!visible) continue;
      const t = time + kite.phase;
      const body = kite.body;
      // Downwind of its flyer, riding higher in a stronger wind; climbing up as it launches.
      body.position.set(
        kite.anchor.x + 14 + Math.sin(t * 0.6) * 3 * gust,
        kite.anchor.y + (22 + gust * 16) * this.kitePresence + Math.sin(t * 1.1) * 1.5 * gust,
        kite.anchor.z - 20 + Math.cos(t * 0.45) * 2.5,
      );
      body.lookAt(kite.anchor);
      body.rotateZ(Math.sin(t * 1.7) * 0.3 * gust);
      // The string: from the kite down to the flyer.
      const string = kite.string.geometry.getAttribute("position") as THREE.BufferAttribute;
      string.setXYZ(0, body.position.x, body.position.y, body.position.z);
      string.setXYZ(1, kite.anchor.x, kite.anchor.y + 1.2, kite.anchor.z);
      string.needsUpdate = true;
      // The tail streams from the kite's bottom tip, snaking in the wind.
      const tail = kite.tail.geometry.getAttribute("position") as THREE.BufferAttribute;
      const tip = this.position.set(0, -1.2, 0).applyMatrix4(body.matrixWorld.compose(body.position, body.quaternion, body.scale));
      for (let k = 0; k < KITE_TAIL; k += 1) {
        const f = k / (KITE_TAIL - 1);
        tail.setXYZ(k, tip.x + f * 3 + Math.sin(t * 4 - k * 0.7) * 0.35 * f, tip.y - f * 3.2, tip.z - f * 1.5 + Math.cos(t * 3.4 - k * 0.6) * 0.3 * f);
      }
      tail.needsUpdate = true;
    }
  }

  /** Garden lights come on through dusk, one after another, and go off again as day breaks. */
  private updateGardenLights(night: number) {
    const lights = this.gardenLights;
    if (!lights) return;
    if (Math.abs(night - lights.level) < 0.002) return;
    lights.level = night;
    lights.thresholds.forEach((threshold, i) => {
      const on = THREE.MathUtils.smoothstep(night, 0.08 + threshold, 0.18 + threshold);
      lights.caps.setColorAt(i, this.lightColour.copy(LIGHT_WARM).multiplyScalar(0.12 + on * 2.2));
      lights.pools.setColorAt(i, this.lightColour.copy(LIGHT_WARM).multiplyScalar(on * 0.55));
    });
    if (lights.caps.instanceColor) lights.caps.instanceColor.needsUpdate = true;
    if (lights.pools.instanceColor) lights.pools.instanceColor.needsUpdate = true;
  }

  /** Start a ripple ring on the water at (x, z). */
  private ripple(x: number, z: number, strength: number) {
    this.ripples[this.nextRipple].set(x, z, this.uniforms.uTime.value, strength);
    this.nextRipple = (this.nextRipple + 1) % this.ripples.length;
  }

  private buildFireflies(count: number) {
    if (!this.meadows.length) return;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      // Over the meadows and along the edge of the trees.
      const meadow = this.meadows[i % this.meadows.length];
      const a = this.random() * Math.PI * 2;
      const r = meadow.radius + this.random() * 8;
      const x = meadow.x + Math.cos(a) * r;
      const z = meadow.z + Math.sin(a) * r;
      positions.set([x, this.groundHeight(x, z) + 0.4 + this.random() * 2, z], i * 3);
      phases[i] = this.random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    this.fireflies = new THREE.Points(
      geometry,
      new THREE.ShaderMaterial({
        uniforms: { uTime: this.uniforms.uTime, uSize: { value: 260 * Math.min(window.devicePixelRatio || 1, 2) }, uMap: { value: radialTexture() }, uOpacity: { value: 0 } },
        vertexShader: fireflyVertex,
        fragmentShader: fireflyFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    );
    this.fireflies.frustumCulled = false;
    this.fireflies.raycast = () => {};
    this.fireflies.visible = false;
    this.group.add(this.fireflies);
  }

  // ————————————————————————————————————————— frame

  update(dt: number, reducedMotion: boolean, conditions: Conditions) {
    const { night, rain } = conditions;
    // Birds and butterflies are about in fair daylight; they shelter from rain and roost at night.
    this.daylife = damp(this.daylife, (1 - night) * (1 - THREE.MathUtils.smoothstep(rain, 0.3, 0.7)), 1.2, dt);
    const time = this.uniforms.uTime.value;

    if (!this.started) {
      // Whoever the opening hour and weather suit is already out; the rest start in their dens.
      this.started = true;
      for (const walker of this.walkers) {
        if (walker.wants(conditions)) continue;
        walker.gone = true;
        walker.root.visible = false;
      }
      for (const rabbit of this.rabbits) {
        rabbit.gone = !this.rabbitHours(conditions);
        rabbit.root.visible = !rabbit.gone;
      }
    }

    if (this.fireflies) {
      const glow = THREE.MathUtils.smoothstep(night, 0.4, 0.9) * (1 - rain);
      this.fireflies.material.uniforms.uOpacity.value = glow;
      this.fireflies.visible = glow > 0.01;
    }
    // Ducks paddle off to roost in the reeds after dark.
    const duckScale = 1 - THREE.MathUtils.smoothstep(night, 0.5, 0.8);
    for (const duck of this.ducks) {
      duck.root.visible = duckScale > 0.02;
      duck.root.scale.setScalar(Math.max(duckScale, 0.001));
    }
    this.updateOwl(dt, conditions, reducedMotion);

    if (reducedMotion) {
      // Still life: animals keep to whatever suits the hour, without walking there.
      for (const walker of this.walkers) walker.root.visible = walker.wants(conditions);
      for (const rabbit of this.rabbits) rabbit.root.visible = this.rabbitHours(conditions);
      this.updateBirds(0, true);
      this.updateButterflies(0, true);
      this.updatePetals(0, time, night);
      this.updateGardenLights(night);
      return;
    }
    for (const walker of this.walkers) this.updateWalker(walker, dt, time, conditions);
    for (const rabbit of this.rabbits) this.updateRabbit(rabbit, dt, conditions);
    for (const duck of this.ducks) {
      duck.angle += duck.speed * dt;
      const x = this.lake.x + Math.cos(duck.angle) * duck.radius.x;
      const z = this.lake.z + Math.sin(duck.angle) * duck.radius.y;
      duck.root.position.set(x, WATER_Y + Math.sin(time * 1.6 + duck.phase) * 0.03, z);
      duck.root.rotation.y = Math.atan2(-Math.sin(duck.angle) * duck.radius.x, Math.cos(duck.angle) * duck.radius.y);
      duck.root.rotation.z = Math.sin(time * 1.3 + duck.phase) * 0.05;
    }
    this.updateBirds(time, false);
    this.updateButterflies(time, false);
    this.updatePetals(dt, time, night);
    this.updateWater(dt);
    this.updateKites(dt, time);
    this.updateGardenLights(night);
  }

  private rabbitHours(c: Conditions) {
    return c.day > 0.25 && c.rain < 0.5;
  }

  /** Somewhere new near home: clear of the glass and out of the water (unless it picks its own). */
  private wanderTarget(walker: Walker) {
    if (walker.pick) return walker.pick();
    for (let tries = 0; tries < 10; tries += 1) {
      const x = walker.home.x + (this.random() - 0.5) * 2 * walker.range;
      const z = walker.home.y + (this.random() - 0.5) * 2 * walker.range;
      if (this.fromHall(x, z) > 4 && this.lakeDistance(x, z, 1.5) > 1) return new THREE.Vector2(x, z);
    }
    return walker.home.clone();
  }

  /** The owl flies in at nightfall and leaves at dawn; between times it turns its head about. */
  private updateOwl(dt: number, c: Conditions, reducedMotion: boolean) {
    const owl = this.owl;
    if (!owl) return;
    owl.presence = damp(owl.presence, c.night > 0.45 ? 1 : 0, 1.5, dt);
    owl.root.visible = owl.presence > 0.02;
    owl.root.scale.setScalar(Math.max(owl.presence, 0.001));
    if (!owl.root.visible || reducedMotion) return;
    owl.timer -= dt;
    if (owl.timer <= 0) {
      owl.timer = 1.5 + this.random() * 4;
      owl.look = (this.random() - 0.5) * 2.2;
    }
    owl.head.rotation.y = damp(owl.head.rotation.y, owl.look, 5, dt);
  }

  private updateWalker(walker: Walker, dt: number, time: number, c: Conditions) {
    const want = walker.wants(c);
    if (walker.gone) {
      if (!want) return;
      // Back out of the trees, toward home.
      walker.gone = false;
      walker.root.visible = true;
      walker.root.position.set(walker.den.x, this.groundHeight(walker.den.x, walker.den.y), walker.den.y);
      walker.target.copy(this.wanderTarget(walker));
      walker.state = "arrive";
      walker.timer = 90;
    } else if (!want && walker.state !== "leave") {
      walker.state = "leave";
      walker.target.copy(walker.den);
    } else if (want && walker.state === "leave") {
      walker.state = "walk";
      walker.target.copy(this.wanderTarget(walker));
      walker.timer = 90;
    }

    if (walker.state !== "leave") {
      walker.timer -= dt;
      if (walker.timer <= 0) {
        const roll = this.random();
        if (walker.state === "walk" || roll < 0.45) {
          walker.state = roll < 0.75 ? "graze" : "look";
          walker.timer = walker.state === "graze" ? 5 + this.random() * 8 : 2 + this.random() * 3;
        } else {
          walker.target.copy(this.wanderTarget(walker));
          walker.state = "walk";
          walker.timer = 30;
        }
      }
    }

    const position = walker.root.position;
    let speed = 0;
    // Comings and goings are brisker than wandering about.
    const travelling = walker.state === "arrive" || walker.state === "leave";
    if (walker.state === "walk" || travelling) {
      const dx = walker.target.x - position.x;
      const dz = walker.target.y - position.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 0.3) {
        if (walker.state === "leave") {
          walker.gone = true;
          walker.root.visible = false;
          return;
        }
        walker.state = "walk";
        walker.timer = 0;
      } else {
        const want = Math.atan2(dx, dz);
        let turn = want - walker.heading;
        turn = Math.atan2(Math.sin(turn), Math.cos(turn));
        walker.heading += turn * Math.min(1, dt * 2);
        speed = walker.speed * (travelling ? 1.7 : 1) * Math.max(0, Math.cos(turn));
        position.x += Math.sin(walker.heading) * speed * dt;
        position.z += Math.cos(walker.heading) * speed * dt;
        walker.stride += (speed / walker.speed) * dt * walker.strideRate;
      }
    }
    position.y = this.groundHeight(position.x, position.z);
    walker.root.rotation.y = walker.heading;
    const moving = speed > 0.01 ? 1 : 0;
    walker.legs.forEach((leg, i) => {
      const swing = Math.sin(walker.stride + (i === 0 || i === 3 ? 0 : Math.PI)) * walker.swing * moving;
      leg.rotation.x = damp(leg.rotation.x, swing, 10, dt);
    });
    // Head down to graze, up to look round.
    const grazing = walker.state === "graze" ? 1 : 0;
    if (walker.neck) {
      walker.neck.rotation.x = damp(walker.neck.rotation.x, grazing ? walker.graze : walker.state === "look" ? -0.15 : 0.1, 1.8, dt);
      walker.neck.rotation.y = damp(walker.neck.rotation.y, walker.state === "look" ? Math.sin(walker.timer) * 0.5 : 0, 2, dt);
    }
    if (walker.head) walker.head.rotation.x = damp(walker.head.rotation.x, grazing * -walker.graze * 0.35, 1.8, dt);
    // The trunk hangs a little forward and sways; grazing, it reaches down and its tip curls in.
    walker.trunk?.forEach((joint, i) => {
      const sway = Math.sin(time * 1.1 + walker.home.x + i * 0.7) * (0.06 + i * 0.04);
      joint.rotation.x = damp(joint.rotation.x, (i === 0 ? -0.12 : -0.08) - grazing * (i === 2 ? 0.55 : 0.15) + sway, 3, dt);
      joint.rotation.z = Math.sin(time * 0.8 + walker.home.y + i) * 0.04 * (i + 1);
    });
  }

  private updateRabbit(rabbit: Rabbit, dt: number, c: Conditions) {
    const out = this.rabbitHours(c);
    if (rabbit.gone) {
      if (!out) return;
      rabbit.gone = false;
      rabbit.root.visible = true;
      rabbit.root.position.set(rabbit.den.x, this.groundHeight(rabbit.den.x, rabbit.den.y), rabbit.den.y);
      rabbit.target.copy(rabbit.home);
    } else if (!out) {
      rabbit.target.copy(rabbit.den);
    }
    const position = rabbit.root.position;
    const toTarget = Math.hypot(rabbit.target.x - position.x, rabbit.target.y - position.z);
    if (!out && toTarget < 0.3) {
      rabbit.gone = true;
      rabbit.root.visible = false;
      return;
    }
    if (rabbit.hop > 0) {
      rabbit.hop = Math.max(0, rabbit.hop - dt * 2.6);
      const dx = rabbit.target.x - position.x;
      const dz = rabbit.target.y - position.z;
      const distance = Math.hypot(dx, dz);
      // Bolting for the den is quicker than nibbling about.
      const pace = out ? 1.6 : 3.2;
      if (distance > 0.05) {
        position.x += (dx / distance) * Math.min(distance, dt * pace);
        position.z += (dz / distance) * Math.min(distance, dt * pace);
      }
      position.y = this.groundHeight(position.x, position.z) + Math.sin(rabbit.hop * Math.PI) * 0.22;
    } else {
      rabbit.rest -= dt;
      if (rabbit.rest <= 0) {
        rabbit.rest = out ? 0.4 + this.random() * (this.random() < 0.3 ? 5 : 1.2) : 0.1;
        if (out && toTarget < 0.1) {
          rabbit.target.set(rabbit.home.x + (this.random() - 0.5) * 7, rabbit.home.y + (this.random() - 0.5) * 7);
          if (this.fromHall(rabbit.target.x, rabbit.target.y) < 5) rabbit.target.copy(rabbit.home);
        }
        rabbit.heading = Math.atan2(rabbit.target.x - position.x, rabbit.target.y - position.z);
        rabbit.hop = 1;
      }
    }
    rabbit.root.rotation.y = rabbit.heading;
  }

  private updateBirds(time: number, frozen: boolean) {
    const birds = this.birds;
    if (!birds) return;
    const visible = this.daylife > 0.05;
    birds.bodies.visible = visible;
    birds.wings.visible = visible;
    if (!visible) return;
    // Each flock loops lazily round its path, climbing away as the light goes.
    const lift = (1 - this.daylife) * 60;
    birds.flock.forEach((bird, i) => {
      const { centre, rx, rz, speed, scale } = bird.path;
      const angle = (frozen ? 0 : time * speed) + bird.offset.z * 0.012;
      const x = centre.x + Math.cos(angle) * rx + bird.offset.x;
      const y = centre.y + Math.sin(angle * 2) * (scale > 1.2 ? 6 : 2) + bird.offset.y + lift;
      const z = centre.z + Math.sin(angle) * rz + bird.offset.z;
      const heading = Math.atan2(-Math.sin(angle) * rx, Math.cos(angle) * rz);
      const bank = Math.sin(angle * 2) * 0.2;
      this.euler.set(0, heading, bank);
      this.quaternion.setFromEuler(this.euler);
      this.matrix.compose(this.position.set(x, y, z), this.quaternion, this.scale.setScalar(scale));
      birds.bodies.setMatrixAt(i, this.matrix);
      const flap = frozen ? 0.2 : Math.sin(time * (scale > 1.2 ? 7 : 11) + bird.phase) * 0.6;
      for (const side of [1, -1]) {
        this.euler.set(0, heading, bank + side * flap);
        this.quaternion.setFromEuler(this.euler);
        this.matrix.compose(this.position, this.quaternion, this.scale.set(side * scale, scale, scale));
        birds.wings.setMatrixAt(i * 2 + (side > 0 ? 0 : 1), this.matrix);
      }
    });
    birds.bodies.instanceMatrix.needsUpdate = true;
    birds.wings.instanceMatrix.needsUpdate = true;
  }

  private updateButterflies(time: number, frozen: boolean) {
    const butterflies = this.butterflies;
    if (!butterflies) return;
    butterflies.wings.visible = this.daylife > 0.05;
    if (!butterflies.wings.visible) return;
    const scale = this.daylife;
    butterflies.flock.forEach((butterfly, i) => {
      const meadow = this.meadows[butterfly.meadow];
      const t = time * butterfly.speed + butterfly.phase;
      let x = meadow.x + Math.sin(t * 0.7) * meadow.radius * 0.8 + Math.sin(t * 2.3) * 0.4;
      let z = meadow.z + Math.cos(t * 0.53) * meadow.radius * 0.8;
      let y = this.groundHeight(x, z) + 0.6 + Math.sin(t * 1.9) * 0.3 + Math.sin(t * 5.1) * 0.08;
      const heading = Math.atan2(Math.cos(t * 0.7) * 0.7, -Math.sin(t * 0.53) * 0.53);
      // Part of each cycle it settles on a flower, wings opening and closing slowly.
      const cycle = ((time + butterfly.phase) % butterfly.cycle) / butterfly.cycle;
      const settle = frozen ? 0 : THREE.MathUtils.smoothstep(cycle, 0.6, 0.66) * (1 - THREE.MathUtils.smoothstep(cycle, 0.86, 0.92));
      x = THREE.MathUtils.lerp(x, butterfly.rest.x, settle);
      y = THREE.MathUtils.lerp(y, butterfly.rest.y, settle);
      z = THREE.MathUtils.lerp(z, butterfly.rest.z, settle);
      const flying = frozen ? 0.6 : 0.25 + Math.abs(Math.sin(time * 14 + butterfly.phase)) * 1.1;
      const resting = 0.15 + Math.abs(Math.sin(time * 1.4 + butterfly.phase)) * 0.6;
      const flap = THREE.MathUtils.lerp(flying, resting, settle);
      for (const side of [1, -1]) {
        this.euler.set(0, heading, side * flap);
        this.quaternion.setFromEuler(this.euler);
        this.matrix.compose(this.position.set(x, y, z), this.quaternion, this.scale.set(side * scale, scale, scale));
        butterflies.wings.setMatrixAt(i * 2 + (side > 0 ? 0 : 1), this.matrix);
      }
    });
    butterflies.wings.instanceMatrix.needsUpdate = true;
  }

  /** Petals spiral down from the flowering trees on the breeze, and start again at the top. */
  private updatePetals(dt: number, time: number, night: number) {
    const petals = this.petals;
    if (!petals) return;
    // Unlit points: dim them with the daylight so they don't glow at night.
    petals.points.material.color.setScalar(0.18 + (1 - night) * 0.82);
    const wind = this.uniforms.uWind.value;
    const position = petals.points.geometry.getAttribute("position") as THREE.BufferAttribute;
    petals.drops.forEach((drop, i) => {
      drop.y -= drop.fall * dt;
      drop.x += (Math.sin(time * 1.3 + drop.drift) * 0.35 + wind * 0.6) * dt;
      drop.z += Math.cos(time * 1.1 + drop.drift * 1.7) * 0.35 * dt;
      if (drop.y < this.groundHeight(drop.x, drop.z) + 0.05) this.respawnPetal(drop);
      position.setXYZ(i, drop.x, drop.y, drop.z);
    });
    position.needsUpdate = true;
  }

  /** Ducks leave small ripples as they paddle; a fish leaps clear of the lake now and then. */
  private updateWater(dt: number) {
    this.duckRipple -= dt;
    if (this.duckRipple <= 0) {
      this.duckRipple = 0.9;
      const duck = this.ducks[Math.floor(this.random() * this.ducks.length)];
      if (duck?.root.visible) this.ripple(duck.root.position.x, duck.root.position.z, 0.35);
    }
    const fish = this.fish;
    if (!fish) return;
    if (fish.t >= 1) {
      fish.mesh.visible = false;
      fish.wait -= dt;
      if (fish.wait > 0) return;
      // Somewhere well inside the lake, leaping a metre or two.
      const { lake } = this;
      const a = this.random() * Math.PI * 2;
      const r = Math.sqrt(this.random()) * 0.6;
      fish.from.set(lake.x + Math.cos(a) * lake.rx * r, lake.z + Math.sin(a) * lake.rz * r);
      const heading = this.random() * Math.PI * 2;
      fish.to.set(fish.from.x + Math.cos(heading) * 1.6, fish.from.y + Math.sin(heading) * 1.6);
      fish.t = 0;
      fish.wait = 4 + this.random() * 7;
      fish.mesh.visible = true;
      this.ripple(fish.from.x, fish.from.y, 1);
    }
    fish.t = Math.min(1, fish.t + dt / 0.9);
    const x = THREE.MathUtils.lerp(fish.from.x, fish.to.x, fish.t);
    const z = THREE.MathUtils.lerp(fish.from.y, fish.to.y, fish.t);
    fish.mesh.position.set(x, this.lake.y + Math.sin(fish.t * Math.PI) * 0.9 - 0.1, z);
    fish.mesh.rotation.set(0, Math.atan2(fish.to.x - fish.from.x, fish.to.y - fish.from.y), 0);
    fish.mesh.rotateX(-Math.cos(fish.t * Math.PI) * 0.9);
    if (fish.t >= 1) this.ripple(fish.to.x, fish.to.y, 0.9);
  }
}
