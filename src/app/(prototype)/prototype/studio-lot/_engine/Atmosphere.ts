import * as THREE from "three";
import { seeded } from "./math";
import { radialTexture } from "./signage";

/** The only ambient motion in the gallery: dust turning in the picture lights, stirred by the visitor. */
export class Atmosphere {
  readonly group = new THREE.Group();
  private readonly dust: THREE.Points;
  private readonly base: Float32Array;
  private readonly drift = new THREE.Vector3();

  constructor(options: { particles: number }) {
    const random = seeded(11);
    const count = options.particles;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      // Bias motes toward the walls, where the spots are.
      const side = random() > 0.5 ? 1 : -1;
      positions[i * 3] = side * (2 + random() * 5.5);
      positions[i * 3 + 1] = 0.4 + random() * 6;
      positions[i * 3 + 2] = 12 - random() * 78;
    }
    this.base = positions.slice();
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.dust = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ map: radialTexture(), size: 0.045, color: "#ffe6c4", transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.dust.raycast = () => {};
    this.group.add(this.dust);
  }

  update(dt: number, time: number, cameraVelocity: THREE.Vector3, reducedMotion: boolean) {
    if (reducedMotion) return;
    // Walking stirs the air: motes drift against the camera's motion, then settle.
    this.drift.addScaledVector(cameraVelocity, -0.1 * dt).multiplyScalar(Math.exp(-0.5 * dt));
    const attribute = this.dust.geometry.getAttribute("position") as THREE.BufferAttribute;
    const array = attribute.array as Float32Array;
    for (let i = 0; i < array.length; i += 3) {
      const phase = i * 0.37;
      array[i] = this.base[i] + Math.sin(time * 0.15 + phase) * 0.25 + this.drift.x * 5;
      array[i + 1] = this.base[i + 1] + Math.sin(time * 0.11 + phase * 1.3) * 0.3;
      array[i + 2] = this.base[i + 2] + Math.cos(time * 0.13 + phase) * 0.25 + this.drift.z * 5;
    }
    attribute.needsUpdate = true;
  }
}
