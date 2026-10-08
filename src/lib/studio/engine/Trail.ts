import * as THREE from "three";

const SPOTS = 28;
/** Seconds a footprint of light takes to fade away. */
const LIFE = 5;
/** Metres walked between footprints. */
const STRIDE = 0.9;

/**
 * Soft pools of coloured light left on the floor along the visitor's walk, in the accent of the room
 * they were passing, fading away behind them.
 */
export class Trail {
  readonly mesh: THREE.InstancedMesh;
  private readonly born = new Float32Array(SPOTS).fill(-100);
  private readonly colours = Array.from({ length: SPOTS }, () => new THREE.Color());
  private readonly last = new THREE.Vector3(Infinity, 0, Infinity);
  private readonly matrix = new THREE.Matrix4();
  private readonly scratch = new THREE.Color();
  private next = 0;

  constructor(texture: THREE.Texture) {
    this.mesh = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(1.1, 1.1).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
      SPOTS,
    );
    for (let i = 0; i < SPOTS; i += 1) {
      this.mesh.setMatrixAt(i, this.matrix.makeTranslation(0, -10, 0));
      this.mesh.setColorAt(i, this.scratch.setRGB(0, 0, 0));
    }
    this.mesh.frustumCulled = false;
    this.mesh.raycast = () => {};
  }

  /** Inside the hall only: `inside` is false in the foyer and beyond the glass. */
  update(time: number, camera: THREE.Vector3, accent: THREE.Color, inside: boolean, reducedMotion: boolean) {
    this.mesh.visible = !reducedMotion;
    if (reducedMotion) return;
    if (inside && Math.hypot(camera.x - this.last.x, camera.z - this.last.z) > STRIDE) {
      this.last.copy(camera);
      this.born[this.next] = time;
      this.colours[this.next].copy(accent);
      this.mesh.setMatrixAt(this.next, this.matrix.makeTranslation(camera.x, 0.012, camera.z));
      this.next = (this.next + 1) % SPOTS;
      this.mesh.instanceMatrix.needsUpdate = true;
    }
    for (let i = 0; i < SPOTS; i += 1) {
      const fade = Math.max(0, 1 - (time - this.born[i]) / LIFE);
      this.mesh.setColorAt(i, this.scratch.copy(this.colours[i]).multiplyScalar(fade * fade * 0.9));
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}
