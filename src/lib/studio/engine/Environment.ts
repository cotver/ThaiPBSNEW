import * as THREE from "three";
import { damp, seeded } from "./math";
import { createOutdoorUniforms, type OutdoorUniforms } from "./outdoorMaterial";

export type Weather = "clear" | "cloudy" | "rain" | "mist";
export type TimeOfDay = "morning" | "noon" | "sunset" | "night";

/** The moment of the day each time-of-day pick jumps to (0 = midnight, 0.25 = sunrise, 0.5 = noon). */
const TIMES: Record<TimeOfDay, number> = { morning: 0.27, noon: 0.5, sunset: 0.735, night: 0.95 };
/** How fast the sky runs to a picked time of day (days per second): never more than a few seconds. */
const TIME_TRAVEL = 0.16;

/**
 * The visitor's own clock as a time of day (0 = midnight, 0.25 = 6am sunrise, 0.5 = noon, 0.75 = 6pm
 * sunset): left to itself, the sky outside follows real time.
 */
function clockTime() {
  const now = new Date();
  return (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000) / 86400;
}
/** How long the sky keeps one weather before it drifts to another (auto weather), in seconds. */
const WEATHER_SPELL: [number, number] = [70, 140];

type WeatherParams = { cloud: number; sun: number; rain: number; mist: number; wind: number; gloom: number };
const WEATHER_PARAMS: Record<Weather, WeatherParams> = {
  clear: { cloud: 0.1, sun: 1, rain: 0, mist: 0, wind: 0.25, gloom: 0 },
  cloudy: { cloud: 0.72, sun: 0.38, rain: 0, mist: 0.15, wind: 0.5, gloom: 0.22 },
  rain: { cloud: 0.97, sun: 0.1, rain: 1, mist: 0.22, wind: 0.95, gloom: 0.5 },
  mist: { cloud: 0.42, sun: 0.45, rain: 0, mist: 1, wind: 0.08, gloom: 0.12 },
};

const c = (hex: string) => new THREE.Color(hex);
/** Sky and light colours at night, at sunrise/sunset and at full day. */
const PALETTE = {
  zenith: { night: c("#03050d"), dusk: c("#3a2c78"), day: c("#2a68d4") },
  horizon: { night: c("#0b1222"), dusk: c("#ff6a35"), day: c("#86bff0") },
  sun: { dusk: c("#ff8240"), day: c("#fff1dc") },
  /** The pink band that glows just above the horizon at sunrise and sunset. */
  afterglow: c("#ff4f8b"),
  skyAmbient: { night: c("#1a2440"), day: c("#9cc0e6") },
  groundAmbient: { night: c("#07090c"), day: c("#55603a") },
  moon: c("#8fa6d8"),
  overcast: { zenith: c("#7d8794"), horizon: c("#98a1aa"), night: c("#0d1017") },
  storm: { zenith: c("#454d58"), horizon: c("#58606a") },
  mist: c("#c9d0d4"),
  hall: c("#2e2822"),
  white: c("#ffffff"),
  lamp: c("#ffd9a8"),
};

const skyVertex = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragment = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uSunVisible;
  uniform vec3 uMoonDir;
  uniform float uMoonVisible;
  uniform float uNight;
  uniform float uCloud;
  uniform vec3 uCloudLit;
  uniform vec3 uCloudShade;
  uniform float uTime;
  uniform float uFlash;
  uniform vec3 uAfterglow;
  uniform float uRainbow;
  varying vec3 vDirection;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash2(i), hash2(i + vec2(1.0, 0.0)), u.x), mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float total = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      total += noise(p) * amplitude;
      p = p * 2.03 + vec2(1.7, 9.2);
      amplitude *= 0.5;
    }
    return total;
  }

  void main() {
    vec3 d = normalize(vDirection);
    float h = d.y;
    vec3 colour = mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.38));
    // Below the horizon (only ever glimpsed between ranges): the horizon, a shade darker.
    colour = mix(colour, uHorizon * 0.7, smoothstep(0.0, -0.2, h));

    // Clouds: a layer of drifting noise projected onto a dome, thinning to nothing at the horizon.
    float cloud = 0.0;
    if (h > 0.0) {
      vec2 uv = d.xz / (h + 0.18) * 1.3 + vec2(uTime * 0.006, uTime * 0.0025);
      float n = fbm(uv);
      cloud = smoothstep(1.0 - uCloud, 1.0 - uCloud + 0.3, n + 0.12) * smoothstep(0.0, 0.3, h);
      float lit = clamp((n - 0.35) * 1.6 + max(dot(d, uSunDir), 0.0) * 0.4, 0.0, 1.0);
      vec3 cloudColour = mix(uCloudShade, uCloudLit, lit);
      colour = mix(colour, cloudColour, cloud * 0.96);
    }

    // Stars and the moon behind any cloud.
    vec3 p = d * 260.0;
    vec3 cell = floor(p);
    float r = hash(cell);
    float star = step(0.986, r) * smoothstep(0.32, 0.0, length(fract(p) - 0.5));
    star *= 0.55 + 0.45 * sin(uTime * (1.5 + r * 3.0) + r * 60.0);
    colour += vec3(0.85, 0.9, 1.0) * star * uNight * smoothstep(0.02, 0.25, h) * (1.0 - cloud) * 1.6;
    float moon = dot(d, uMoonDir);
    float disc = smoothstep(0.99935, 0.99965, moon);
    colour += vec3(0.85, 0.88, 0.95) * (pow(max(moon, 0.0), 300.0) * 0.12 + disc * 1.4) * uMoonVisible * (1.0 - cloud * 0.85);

    // The sun: a wide glow and a hot disc (bright enough to bloom), dimmed by cloud.
    float sun = max(dot(d, uSunDir), 0.0);
    colour += uSunColor * (pow(sun, 6.0) * 0.18 + pow(sun, 90.0) * 0.45) * uSunVisible * (1.0 - cloud * 0.6);
    colour += uSunColor * smoothstep(0.99955, 0.9998, sun) * 7.0 * uSunVisible * (1.0 - cloud * 0.95);

    colour += vec3(0.75, 0.8, 1.0) * uFlash * (0.4 + cloud);

    // Sunrise/sunset afterglow: a pink band hugging the horizon, under the cloud.
    colour += uAfterglow * exp(-abs(h - 0.06) * 14.0) * (1.0 - cloud * 0.6);

    // A rainbow after rain: a ring ~42° round the point opposite the sun, red outside, violet inside.
    if (uRainbow > 0.001 && h > 0.0) {
      float fromAntisolar = acos(clamp(dot(d, -uSunDir), -1.0, 1.0));
      float x = (fromAntisolar - 0.705) / 0.035;
      if (abs(x) < 1.0) {
        vec3 bow = 0.5 + 0.5 * cos(6.2831 * (0.5 - x * 0.42) + vec3(0.0, 2.1, 4.2));
        colour += bow * (1.0 - x * x) * uRainbow * 0.75 * smoothstep(0.0, 0.12, h) * (1.0 - cloud * 0.7);
      }
    }
    gl_FragColor = vec4(colour, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Rain falls outside the glass only: streaks wrapped in a box that travels with the camera. */
const rainVertex = /* glsl */ `
  attribute float aEnd;
  uniform float uTime;
  uniform vec3 uCenter;
  uniform vec2 uSize;
  uniform float uHallHalfWidth;
  uniform float uWind;
  varying float vFade;
  void main() {
    vec3 p = position;
    float fall = 24.0;
    p.y = mod(p.y - uTime * fall, uSize.y);
    p.z = uCenter.z + mod(p.z - uCenter.z + uSize.x * 0.5, uSize.x) - uSize.x * 0.5;
    // Each streak is two vertices; the lower one trails the slant of the wind.
    p.y -= aEnd * 0.55;
    p.x += aEnd * uWind * 0.12 * sign(p.x);
    // Never inside the hall.
    if (abs(p.x) < uHallHalfWidth) p.y = -100.0;
    vFade = smoothstep(0.0, 2.0, p.y) * (1.0 - smoothstep(uSize.y - 4.0, uSize.y, p.y));
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }
`;

const rainFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vFade;
  void main() {
    gl_FragColor = vec4(uColor, uOpacity * vFade);
    #include <colorspace_fragment>
  }
`;

const scratch = { a: new THREE.Color(), b: new THREE.Color() };
const shadowScratch = { centre: new THREE.Vector3(), alongHall: new THREE.Vector3(0, 0, 1), min: new THREE.Vector3(), max: new THREE.Vector3(), corner: new THREE.Vector3() };

export type EnvironmentState = {
  weather: Weather;
  /** The weather drifts on its own (no visitor pick). */
  auto: boolean;
  night: boolean;
  /** Which part of the day it is now. */
  time: TimeOfDay;
  /** The sky follows the visitor's real clock (no visitor pick). */
  timeAuto: boolean;
};

/** What it is like outside right now, 0..1 each — the wildlife reads this to decide who is about. */
export type Conditions = { day: number; night: number; rain: number; mist: number; cloud: number; wind: number };

function phaseOf(time: number): TimeOfDay {
  if (time < 0.22 || time >= 0.8) return "night";
  if (time < 0.42) return "morning";
  return time < 0.64 ? "noon" : "sunset";
}

/**
 * The world outside the glass: time of day (the visitor's real clock, unless they pick a time),
 * the weather (clear, cloudy, rain, mist — drifting on its own unless a visitor picks one), the sky dome,
 * rain, and the sunlight that reaches into the hall. Everything outdoors reads its light from `uniforms`.
 */
export class Environment {
  readonly group = new THREE.Group();
  readonly uniforms: OutdoorUniforms = createOutdoorUniforms();
  /** Daylight through the glass, for the hall's own (standard) materials. */
  readonly sunlight = new THREE.DirectionalLight("#ffffff", 0);
  /** A soft fill of sky light; most daylight comes in through the glass itself (Hall.setDaylight). */
  readonly skylight = new THREE.HemisphereLight("#cfe3ff", "#e9e2d4", 0);
  /** How much daylight reaches the hall (0..1), and its colour — what the glass walls glow with. */
  daylight = 1;
  readonly daylightColour = new THREE.Color();
  readonly conditions: Conditions = { day: 1, night: 0, rain: 0, mist: 0, cloud: 0, wind: 0 };
  /**
   * The hall's ceiling lamps, 0 (off) to 1 (on): off while daylight alone lights the hall (a clear
   * day), on at night and under cloud, rain or mist. They switch, with a short warm-up, not a dimmer.
   */
  lamps = 0;
  private lampsOn: boolean | null = null;
  private timeTarget: number | null = null;
  private phase: TimeOfDay;
  private hallFogDensity: number | null = null;
  private hallBox: THREE.Box3 | null = null;
  onChange?: (state: EnvironmentState) => void;

  /** Opens on the real time of day. */
  private timeOfDay = clockTime();
  private weather: Weather = "clear";
  private auto = true;
  private spell = 0;
  private readonly random = seeded(23);
  private readonly params: WeatherParams = { ...WEATHER_PARAMS.clear };
  private readonly sky: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  private readonly rain: THREE.LineSegments<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private readonly sunDir = new THREE.Vector3();
  private readonly moonDir = new THREE.Vector3();
  private flash = 0;
  private nextFlash = 6;
  private wasNight = false;
  /** A rainbow shows for a while after rain clears in daylight. */
  private rainbow = 0;
  private rainbowTimer = 0;
  private lastRain = 0;

  constructor(options: { quality: "high" | "low"; hallHalfWidth: number }) {
    this.phase = phaseOf(this.timeOfDay);
    this.spell = THREE.MathUtils.lerp(WEATHER_SPELL[0], WEATHER_SPELL[1], this.random());

    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(1500, 48, 24),
      new THREE.ShaderMaterial({
        uniforms: {
          uZenith: { value: new THREE.Color() },
          uHorizon: { value: new THREE.Color() },
          uSunDir: { value: this.sunDir },
          uSunColor: { value: new THREE.Color() },
          uSunVisible: { value: 1 },
          uMoonDir: { value: this.moonDir },
          uMoonVisible: { value: 0 },
          uNight: this.uniforms.uNight,
          uCloud: { value: 0 },
          uCloudLit: { value: new THREE.Color() },
          uCloudShade: { value: new THREE.Color() },
          uTime: this.uniforms.uTime,
          uFlash: { value: 0 },
          uAfterglow: { value: new THREE.Color() },
          uRainbow: { value: 0 },
        },
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    );
    // Drawn after everything opaque, so the sky is only shaded where nothing else covers it.
    this.sky.renderOrder = 1000;
    this.sky.frustumCulled = false;
    this.sky.raycast = () => {};
    this.group.add(this.sky);

    const count = options.quality === "high" ? 2600 : 1100;
    const positions = new Float32Array(count * 6);
    const ends = new Float32Array(count * 2);
    const width = 70;
    for (let i = 0; i < count; i += 1) {
      const side = this.random() > 0.5 ? 1 : -1;
      // Denser near the glass, where it reads.
      const x = side * (options.hallHalfWidth + 0.6 + this.random() ** 1.8 * width);
      const y = this.random() * 30;
      const z = this.random() * 120;
      positions.set([x, y, z, x, y, z], i * 6);
      ends.set([0, 1], i * 2);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aEnd", new THREE.BufferAttribute(ends, 1));
    this.rain = new THREE.LineSegments(
      geometry,
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uCenter: { value: new THREE.Vector3() },
          uSize: { value: new THREE.Vector2(120, 30) },
          uHallHalfWidth: { value: options.hallHalfWidth + 0.3 },
          uWind: this.uniforms.uWind,
          uColor: { value: new THREE.Color("#c8d2dc") },
          uOpacity: { value: 0 },
        },
        vertexShader: rainVertex,
        fragmentShader: rainFragment,
        transparent: true,
        depthWrite: false,
      }),
    );
    this.rain.frustumCulled = false;
    this.rain.raycast = () => {};
    this.rain.visible = false;
    this.group.add(this.rain);

    if (options.quality === "high") {
      // Sun shadows over the whole hall, so the roof keeps the sun out however far down it you look.
      // The map is long and thin because the hall is: its long side runs down the hall (see fitShadow).
      const shadow = this.sunlight.shadow;
      this.sunlight.castShadow = true;
      shadow.mapSize.set(4096, 1024);
      shadow.bias = -0.0004;
      shadow.normalBias = 0.05;
      shadow.radius = 3;
    }
    this.group.add(this.sunlight, this.sunlight.target, this.skylight);
  }

  get state(): EnvironmentState {
    return { weather: this.weather, auto: this.auto, night: this.isNight, time: this.phase, timeAuto: this.timeTarget === null };
  }

  private get isNight() {
    return this.sunDir.y < -0.02;
  }

  /** A visitor's pick holds until they choose "auto" again. */
  setWeather(weather: Weather | "auto") {
    if (weather === "auto") {
      this.auto = true;
      this.spell = WEATHER_SPELL[0];
    } else {
      this.auto = false;
      this.weather = weather;
    }
    this.onChange?.(this.state);
  }

  /** The hall's solid volume: the sun's shadow map is fitted round it. */
  setHallBox(box: THREE.Box3) {
    this.hallBox = box;
  }

  /**
   * Aim the sun at the hall and fit its shadow camera tightly round the whole building, turned so the
   * map's long side runs down the hall. Without a hall box (before it is set), centre on the visitor.
   */
  private fitShadow(camera: THREE.Camera) {
    const light = this.sunlight;
    const box = this.hallBox;
    const centre = box ? box.getCenter(shadowScratch.centre) : shadowScratch.centre.copy(camera.position);
    light.target.position.copy(centre);
    light.position.copy(centre).addScaledVector(this.sunDir, 300);
    if (!box || !light.castShadow) return;
    const shadowCamera = light.shadow.camera;
    // "Up" for the shadow camera is chosen so its x axis lies along the hall (world z).
    shadowCamera.up.crossVectors(this.sunDir, shadowScratch.alongHall).normalize();
    shadowCamera.position.copy(light.position);
    shadowCamera.lookAt(centre);
    shadowCamera.updateMatrixWorld();
    const min = shadowScratch.min.set(Infinity, Infinity, Infinity);
    const max = shadowScratch.max.set(-Infinity, -Infinity, -Infinity);
    for (let i = 0; i < 8; i += 1) {
      const corner = shadowScratch.corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
      corner.applyMatrix4(shadowCamera.matrixWorldInverse);
      min.min(corner);
      max.max(corner);
    }
    Object.assign(shadowCamera, { left: min.x, right: max.x, bottom: min.y, top: max.y, near: Math.max(0.1, -max.z - 1), far: -min.z + 1 });
    shadowCamera.updateProjectionMatrix();
  }

  /** Run the sky to a time of day and hold it there, or back to the real clock and follow it ("auto"). */
  setTime(time: TimeOfDay | "auto") {
    this.timeTarget = time === "auto" ? null : TIMES[time];
    this.onChange?.(this.state);
  }

  update(dt: number, camera: THREE.Camera, scene: THREE.Scene, reducedMotion: boolean) {
    const u = this.uniforms;
    u.uTime.value += reducedMotion ? 0 : dt;
    // Always forward, like a time-lapse, so a sunset is reached through the afternoon. Following the
    // clock, it keeps pace once caught up.
    const goal = this.timeTarget ?? clockTime();
    const ahead = (goal - this.timeOfDay + 1) % 1;
    this.timeOfDay = ahead < 0.001 || ahead > 0.999 ? goal : (this.timeOfDay + Math.min(ahead, dt * TIME_TRAVEL)) % 1;
    const phase = phaseOf(this.timeOfDay);
    if (phase !== this.phase) {
      this.phase = phase;
      this.onChange?.(this.state);
    }

    if (this.auto) {
      this.spell -= dt;
      if (this.spell <= 0) {
        this.spell = THREE.MathUtils.lerp(WEATHER_SPELL[0], WEATHER_SPELL[1], this.random());
        // Mostly fair: rain and mist come round less often than clear and cloudy skies.
        const roll = this.random();
        const next: Weather = roll < 0.38 ? "clear" : roll < 0.68 ? "cloudy" : roll < 0.86 ? "rain" : "mist";
        if (next !== this.weather) {
          this.weather = next;
          this.onChange?.(this.state);
        }
      }
    }
    // Weather changes roll in over several seconds.
    const target = WEATHER_PARAMS[this.weather];
    for (const key of Object.keys(target) as (keyof WeatherParams)[]) this.params[key] = damp(this.params[key], target[key], 0.35, dt);
    const { cloud, sun: sunScale, rain, mist, wind, gloom } = this.params;

    // The sun crosses from east (+x) to west (-x), leaning toward the far end of the hall so sunsets
    // show through the glass. A small lift keeps the days a little longer than the nights.
    const angle = (this.timeOfDay - 0.25) * Math.PI * 2;
    this.sunDir.set(Math.cos(angle), Math.sin(angle) * 0.95 + 0.12, -0.42).normalize();
    this.moonDir.set(-Math.cos(angle), -Math.sin(angle) * 0.95 + 0.2, -0.3).normalize();
    const elevation = this.sunDir.y;
    const day = THREE.MathUtils.smoothstep(elevation, -0.08, 0.3);
    const dusk = (1 - THREE.MathUtils.smoothstep(Math.abs(elevation - 0.03), 0.04, 0.32)) * THREE.MathUtils.smoothstep(elevation, -0.25, -0.02);
    const night = 1 - THREE.MathUtils.smoothstep(elevation, -0.2, 0.02);
    const sunUp = THREE.MathUtils.smoothstep(elevation, -0.04, 0.06);
    const moonUp = THREE.MathUtils.smoothstep(this.moonDir.y, -0.02, 0.1) * night;
    u.uNight.value = night;
    Object.assign(this.conditions, { day, night, rain, mist, cloud, wind });

    // Sky colours: night → day, warmed at dusk, greyed by cloud, washed by mist.
    const sky = this.sky.material.uniforms;
    const overcast = THREE.MathUtils.smoothstep(cloud, 0.4, 0.95);
    const zenith = sky.uZenith.value as THREE.Color;
    const horizon = sky.uHorizon.value as THREE.Color;
    zenith.lerpColors(PALETTE.zenith.night, PALETTE.zenith.day, day).lerp(PALETTE.zenith.dusk, dusk * 0.6);
    horizon.lerpColors(PALETTE.horizon.night, PALETTE.horizon.day, day).lerp(PALETTE.horizon.dusk, dusk * 0.85);
    scratch.a.lerpColors(PALETTE.overcast.zenith, PALETTE.storm.zenith, gloom * 1.6).multiplyScalar(0.15 + day * 0.85);
    scratch.b.lerpColors(PALETTE.overcast.horizon, PALETTE.storm.horizon, gloom * 1.6).multiplyScalar(0.12 + day * 0.88);
    if (night > 0) {
      scratch.a.lerp(PALETTE.overcast.night, night);
      scratch.b.lerp(PALETTE.overcast.night, night);
    }
    zenith.lerp(scratch.a, overcast);
    horizon.lerp(scratch.b, overcast * 0.9);
    scratch.a.copy(PALETTE.mist).multiplyScalar(0.1 + day * 0.9);
    horizon.lerp(scratch.a, mist * 0.75);
    zenith.lerp(scratch.a, mist * 0.45);

    const sunColour = sky.uSunColor.value as THREE.Color;
    sunColour.lerpColors(PALETTE.sun.dusk, PALETTE.sun.day, THREE.MathUtils.smoothstep(elevation, 0.02, 0.4));
    sky.uSunVisible.value = sunUp;
    sky.uMoonVisible.value = moonUp;
    sky.uCloud.value = cloud;
    (sky.uCloudLit.value as THREE.Color).copy(sunColour).lerp(PALETTE.overcast.horizon, 0.25 + gloom).multiplyScalar(0.12 + day * 1.0);
    (sky.uCloudShade.value as THREE.Color).copy(PALETTE.overcast.zenith).lerp(PALETTE.storm.zenith, gloom * 1.4).multiplyScalar(0.08 + day * 0.75);

    // Lightning, now and then, in heavy rain.
    if (!reducedMotion && rain > 0.75) {
      this.nextFlash -= dt;
      if (this.nextFlash <= 0) {
        this.flash = 1;
        this.nextFlash = 7 + this.random() * 16;
      }
    }
    this.flash = Math.max(0, this.flash - dt * 3.2);
    const flicker = this.flash > 0 ? this.flash * (0.6 + 0.4 * Math.sin(this.flash * 40)) : 0;
    sky.uFlash.value = flicker;
    (sky.uAfterglow.value as THREE.Color).copy(PALETTE.afterglow).multiplyScalar(dusk * 0.45);

    if (this.lastRain >= 0.5 && rain < 0.5 && day > 0.5 && sunUp > 0.5) this.rainbowTimer = 55;
    this.lastRain = rain;
    this.rainbowTimer = Math.max(0, this.rainbowTimer - dt);
    this.rainbow = damp(this.rainbow, this.rainbowTimer > 0 && rain < 0.45 ? 1 : 0, 0.5, dt);
    sky.uRainbow.value = this.rainbow * sunUp;

    // The outdoor key light: the sun by day, the moon by night, softened by cloud.
    const keyStrength = sunUp > 0.01 ? sunUp * (0.25 + day * 0.85) * sunScale : moonUp * 0.22 * (1 - cloud * 0.7);
    u.uKeyDir.value.copy(sunUp > 0.01 ? this.sunDir : this.moonDir);
    u.uKeyColor.value.copy(sunUp > 0.01 ? sunColour : PALETTE.moon).multiplyScalar(keyStrength);
    u.uSkyAmbient.value.lerpColors(PALETTE.skyAmbient.night, PALETTE.skyAmbient.day, day).multiplyScalar(0.2 + day * 0.32 * (1 - gloom * 0.5) + overcast * 0.05 * day);
    u.uSkyAmbient.value.addScalar(flicker * 0.5);
    u.uGroundAmbient.value.lerpColors(PALETTE.groundAmbient.night, PALETTE.groundAmbient.day, day).multiplyScalar(0.6);
    u.uFogColor.value.copy(horizon);
    // A clear day is clear all the way to the hills: haze only comes with mist, rain and heavy cloud.
    u.uFogDensity.value = mist * 0.0068 + rain * 0.003;
    u.uHazeAmount.value = THREE.MathUtils.clamp(0.2 + mist + rain * 0.6 + overcast * 0.3, 0, 1);
    u.uHallGlow.value.copy(PALETTE.lamp).multiplyScalar(this.lamps * (0.08 + night * 0.3));
    u.uWind.value = reducedMotion ? 0 : wind;
    u.uRain.value = rain;

    // Inside: daylight through the glass, and the hall's haze takes on the outdoor light.
    const daylight = day * (0.35 + 0.65 * sunScale) * (1 - gloom * 0.6) * (1 - mist * 0.3);
    this.sunlight.color.copy(sunColour);
    // The sun only reaches in through the glass (the roof shadows the rest), so it can be strong.
    this.sunlight.intensity = sunUp * day * sunScale * 2.6 + flicker * 0.6;
    this.skylight.color.copy(zenith).lerp(PALETTE.white, 0.55);
    this.skylight.intensity = daylight * 0.2 + flicker * 0.8;
    this.daylight = daylight + flicker * 0.5;
    this.daylightColour.copy(horizon).lerp(PALETTE.white, 0.45);
    // Lamps: on below ~55% daylight, off above ~62% (the gap stops them flickering at the threshold).
    const wantLamps = this.lampsOn === null ? daylight < 0.58 : this.lampsOn ? daylight < 0.62 : daylight < 0.55;
    if (this.lampsOn === null) this.lamps = wantLamps ? 1 : 0;
    this.lampsOn = wantLamps;
    this.lamps = damp(this.lamps, wantLamps ? 1 : 0, 3.5, dt);
    this.fitShadow(camera);
    if (scene.fog instanceof THREE.FogExp2) {
      // The hall's haze thins right out on a clear day; mist, rain and night bring it back.
      this.hallFogDensity ??= scene.fog.density;
      scene.fog.density = this.hallFogDensity * THREE.MathUtils.clamp(mist * 0.9 + rain * 0.5 + night * 0.6, 0, 1.2);
      scene.fog.color.lerpColors(PALETTE.hall, horizon, 0.55);
    }
    if (scene.background instanceof THREE.Color) scene.background.copy(horizon);

    this.sky.position.copy(camera.position);

    const rainMaterial = this.rain.material;
    rainMaterial.uniforms.uOpacity.value = THREE.MathUtils.smoothstep(rain, 0.05, 0.6) * (0.35 + day * 0.25);
    this.rain.visible = !reducedMotion && rainMaterial.uniforms.uOpacity.value > 0.01;
    if (this.rain.visible) {
      rainMaterial.uniforms.uTime.value = u.uTime.value;
      rainMaterial.uniforms.uCenter.value.copy(camera.position);
      (rainMaterial.uniforms.uColor.value as THREE.Color).copy(horizon).multiplyScalar(1.1).addScalar(0.08);
    }

    const isNight = this.isNight;
    if (isNight !== this.wasNight) {
      this.wasNight = isNight;
      this.onChange?.(this.state);
    }
  }
}
