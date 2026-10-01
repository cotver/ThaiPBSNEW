import * as THREE from "three";
import { clamp01, easeInOutCubic } from "./math";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uA;
  uniform sampler2D uB;
  uniform vec4 uCoverA;
  uniform vec4 uCoverB;
  uniform float uMix;
  uniform float uBoost;
  uniform float uTime;
  uniform vec2 uGrid;
  varying vec2 vUv;

  void main() {
    vec3 a = texture2D(uA, vUv * uCoverA.xy + uCoverA.zw).rgb;
    vec3 b = texture2D(uB, vUv * uCoverB.xy + uCoverB.zw).rgb;
    // Diagonal wipe, like a vision mixer transition.
    float coord = vUv.x * 0.72 + (1.0 - vUv.y) * 0.28;
    float wipe = uMix * 1.2 - 0.1;
    float s = smoothstep(wipe - 0.035, wipe + 0.035, coord);
    vec3 colour = mix(b, a, s);
    float seam = 1.0 - clamp(abs(coord - wipe) / 0.02, 0.0, 1.0);
    colour += vec3(0.35, 0.85, 1.0) * seam * step(0.001, uMix) * step(uMix, 0.999) * 1.4;

    // LED sub-pixel grid and a slow refresh band.
    vec2 cell = fract(vUv * uGrid);
    float dot = smoothstep(0.0, 0.18, cell.x) * smoothstep(1.0, 0.82, cell.x) * smoothstep(0.0, 0.18, cell.y) * smoothstep(1.0, 0.82, cell.y);
    colour *= mix(0.45, 1.08, dot);
    colour *= 0.94 + 0.06 * sin((vUv.y + uTime * 0.08) * 40.0);
    gl_FragColor = vec4(colour * uBoost, 1.0);
    #include <colorspace_fragment>
  }
`;

type Slide = { texture: THREE.Texture; aspect: number };

/** Outdoor LED wall that cycles programme artwork with a vision-mixer wipe. */
export class LedWall {
  readonly mesh: THREE.Mesh;
  private readonly material: THREE.ShaderMaterial;
  private readonly aspect: number;
  private slides: Slide[] = [];
  private index = 0;
  private transition = -1;
  private hold = 0;
  private boost = 1;
  private override: Slide | null = null;

  constructor(width: number, height: number) {
    this.aspect = width / height;
    const blank = new THREE.DataTexture(new Uint8Array([8, 9, 12, 255]), 1, 1);
    blank.needsUpdate = true;
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      toneMapped: false,
      uniforms: {
        uA: { value: blank },
        uB: { value: blank },
        uCoverA: { value: new THREE.Vector4(1, 1, 0, 0) },
        uCoverB: { value: new THREE.Vector4(1, 1, 0, 0) },
        uMix: { value: 0 },
        uBoost: { value: 1 },
        uTime: { value: 0 },
        uGrid: { value: new THREE.Vector2(width * 26, height * 26) },
      },
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), this.material);
  }

  setSlides(slides: Slide[]) {
    this.slides = slides;
    if (!slides.length) return;
    this.index = 0;
    this.assign("A", slides[0]);
    this.hold = 0;
  }

  /** Temporarily put a live source (e.g. a trailer) on the wall. */
  setOverride(slide: Slide | null) {
    if (slide) {
      this.assign("B", slide);
      this.override = slide;
      this.transition = 0;
    } else if (this.override) {
      this.override = null;
      this.assign("B", this.slides[this.index] ?? this.override);
      this.transition = 0;
    }
  }

  get currentIndex() {
    return this.index;
  }

  setBoost(value: number) {
    this.boost = value;
  }

  private assign(slot: "A" | "B", slide: Slide) {
    const uniforms = this.material.uniforms;
    uniforms[`u${slot}`].value = slide.texture;
    const cover = uniforms[`uCover${slot}`].value as THREE.Vector4;
    if (slide.aspect > this.aspect) {
      const scale = this.aspect / slide.aspect;
      cover.set(scale, 1, (1 - scale) / 2, 0);
    } else {
      const scale = slide.aspect / this.aspect;
      cover.set(1, scale, 0, (1 - scale) / 2);
    }
  }

  update(dt: number, time: number, reducedMotion: boolean) {
    const uniforms = this.material.uniforms;
    uniforms.uTime.value = time;
    uniforms.uBoost.value = this.boost;

    if (this.transition >= 0) {
      this.transition += dt / (reducedMotion ? 0.01 : 1.1);
      uniforms.uMix.value = easeInOutCubic(clamp01(this.transition));
      if (this.transition >= 1) {
        // Promote B to A.
        uniforms.uA.value = uniforms.uB.value;
        (uniforms.uCoverA.value as THREE.Vector4).copy(uniforms.uCoverB.value);
        uniforms.uMix.value = 0;
        this.transition = -1;
        this.hold = 0;
      }
      return;
    }

    if (this.override || this.slides.length < 2) return;
    this.hold += dt;
    if (this.hold > 6.5) {
      this.index = (this.index + 1) % this.slides.length;
      this.assign("B", this.slides[this.index]);
      this.transition = 0;
    }
  }
}
