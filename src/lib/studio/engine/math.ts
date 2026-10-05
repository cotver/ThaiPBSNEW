import * as THREE from "three";

/** Frame-rate independent exponential smoothing. Higher lambda = snappier. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
}

export function dampVector(current: THREE.Vector3, target: THREE.Vector3, lambda: number, dt: number) {
  return current.lerp(target, 1 - Math.exp(-lambda * dt));
}

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const easeOutQuart = (t: number) => 1 - (1 - t) ** 4;

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Deterministic pseudo-random so the lot looks identical on every visit. */
export function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Releases every GPU resource reachable from an object tree. */
export function disposeTree(root: THREE.Object3D) {
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const materials = mesh.material ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : [];
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) textures.add(value);
      }
      const uniforms = (material as THREE.ShaderMaterial).uniforms;
      if (uniforms) {
        for (const uniform of Object.values(uniforms)) {
          if (uniform.value instanceof THREE.Texture) textures.add(uniform.value);
        }
      }
      material.dispose();
    }
  });
  textures.forEach((texture) => texture.dispose());
}
