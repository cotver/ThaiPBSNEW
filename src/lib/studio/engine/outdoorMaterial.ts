import * as THREE from "three";

/**
 * The light outside the glass, shared by every outdoor material and driven by Environment each frame.
 * Outdoor things never use the gallery's own lights (its spots and fills would light the forest at
 * night), so they are shaded by this alone: one key light (sun or moon), a sky/ground ambient and haze.
 */
export type OutdoorUniforms = {
  uTime: THREE.IUniform<number>;
  uWind: THREE.IUniform<number>;
  uKeyDir: THREE.IUniform<THREE.Vector3>;
  uKeyColor: THREE.IUniform<THREE.Color>;
  uSkyAmbient: THREE.IUniform<THREE.Color>;
  uGroundAmbient: THREE.IUniform<THREE.Color>;
  uFogColor: THREE.IUniform<THREE.Color>;
  uFogDensity: THREE.IUniform<number>;
  uNight: THREE.IUniform<number>;
  uRain: THREE.IUniform<number>;
  /** The hall's footprint (half width, front z, back z) and the lamplight spilling from its glass. */
  uHallBounds: THREE.IUniform<THREE.Vector3>;
  uHallGlow: THREE.IUniform<THREE.Color>;
  /** How much of each far range's own haze shows (0..1): a hint when clear, all of it in mist or rain. */
  uHazeAmount: THREE.IUniform<number>;
};

export function createOutdoorUniforms(): OutdoorUniforms {
  return {
    uTime: { value: 0 },
    uWind: { value: 0.3 },
    uKeyDir: { value: new THREE.Vector3(0, 1, 0) },
    uKeyColor: { value: new THREE.Color(1, 1, 1) },
    uSkyAmbient: { value: new THREE.Color(0.5, 0.6, 0.7) },
    uGroundAmbient: { value: new THREE.Color(0.2, 0.2, 0.15) },
    uFogColor: { value: new THREE.Color(0.7, 0.8, 0.9) },
    uFogDensity: { value: 0.0016 },
    uNight: { value: 0 },
    uRain: { value: 0 },
    uHallBounds: { value: new THREE.Vector3(8, 28, -100) },
    uHallGlow: { value: new THREE.Color(0, 0, 0) },
    uHazeAmount: { value: 0.2 },
  };
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uWind;
  uniform float uSway;
  uniform vec3 uColor;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying vec3 vColor;

  void main() {
    vec3 colour = uColor;
    #ifdef USE_COLOR
      colour *= color;
    #endif
    #ifdef USE_INSTANCING_COLOR
      colour *= instanceColor;
    #endif
    mat4 model = modelMatrix;
    #ifdef USE_INSTANCING
      model = modelMatrix * instanceMatrix;
    #endif
    vec4 world = model * vec4(position, 1.0);
    // Wind: the higher above its own base, the further a thing bends; each one on its own phase.
    float bend = max(position.y, 0.0) * uSway * uWind;
    float phase = model[3].x * 0.31 + model[3].z * 0.17;
    world.x += (sin(uTime * 1.4 + phase) * 0.7 + sin(uTime * 2.3 + phase * 1.7) * 0.3) * bend;
    world.z += cos(uTime * 1.1 + phase * 1.3) * bend * 0.5;
    vWorldPos = world.xyz;
    vNormal = normalize(mat3(model) * normal);
    vColor = colour;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uKeyDir;
  uniform vec3 uKeyColor;
  uniform vec3 uSkyAmbient;
  uniform vec3 uGroundAmbient;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform float uHaze;
  uniform float uHazeAmount;
  uniform vec3 uEmissive;
  uniform vec3 uHallBounds;
  uniform vec3 uHallGlow;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying vec3 vColor;

  void main() {
    #ifdef FLAT_SHADED
      vec3 normal = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
      // Face the viewer, whichever side of a double-sided facet this is.
      if (dot(normal, cameraPosition - vWorldPos) < 0.0) normal = -normal;
    #else
      vec3 normal = normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0);
    #endif
    float key = max(dot(normal, uKeyDir), 0.0);
    vec3 ambient = mix(uGroundAmbient, uSkyAmbient, normal.y * 0.5 + 0.5);
    // Lamplight through the glass falls off over the first ~15m outside.
    vec2 outside = vec2(max(abs(vWorldPos.x) - uHallBounds.x, 0.0), max(max(vWorldPos.z - uHallBounds.y, uHallBounds.z - vWorldPos.z), 0.0));
    vec3 spill = uHallGlow * exp(-length(outside) * 0.14) * (0.4 + 0.6 * max(normal.y, 0.0));
    vec3 colour = vColor * (ambient + uKeyColor * key + spill) + uEmissive;
    float distance = length(vWorldPos - cameraPosition);
    float fog = 1.0 - exp(-pow(distance * uFogDensity, 2.0));
    colour = mix(colour, uFogColor, max(fog, uHaze * uHazeAmount));
    gl_FragColor = vec4(colour, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export type OutdoorMaterialOptions = {
  color?: THREE.ColorRepresentation;
  /** How much the top of the thing bends in the wind (per metre of height). */
  sway?: number;
  /** Faceted low-poly shading. */
  flat?: boolean;
  vertexColors?: boolean;
  /** Fixed atmospheric haze (0..1), for far mountain ranges. */
  haze?: number;
  side?: THREE.Side;
};

/** A material lit only by the outdoor light (see OutdoorUniforms). */
export function outdoorMaterial(shared: OutdoorUniforms, options: OutdoorMaterialOptions = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...shared,
      uColor: { value: new THREE.Color(options.color ?? "#ffffff") },
      uSway: { value: options.sway ?? 0 },
      uHaze: { value: options.haze ?? 0 },
      uEmissive: { value: new THREE.Color(0, 0, 0) },
    },
    vertexShader,
    fragmentShader,
    vertexColors: options.vertexColors ?? false,
    side: options.side ?? THREE.FrontSide,
    defines: options.flat ? { FLAT_SHADED: "" } : {},
  });
}
