import * as THREE from "three";
import { THAI_PBS_LOGO, THAI_PBS_LOGO_ASPECT } from "./thaipbsLogo";

/** Logo colours sampled from public/LOGO/thaipbs-logo.png; sides are a shade darker so depth reads. */
const COLOURS = {
  orange: { face: "#f05423", side: "#b83a14" },
  grey: { face: "#737473", side: "#4f504f" },
} as const;

/** Depth in logo units (logo height = 1): the bird stands proud, the wordmark is raised lettering. */
const DEPTH = { orange: 0.05, grey: 0.028 } as const;

function toPoints(flat: number[]) {
  const points: THREE.Vector2[] = [];
  for (let i = 0; i < flat.length; i += 2) points.push(new THREE.Vector2(flat[i], flat[i + 1]));
  return points;
}

/**
 * The Thai PBS logo rebuilt as solid geometry from its traced outlines (see scripts/trace-thaipbs-logo.cjs):
 * every swoosh, the head and each letter is an extruded, bevelled shape — not a picture on a plane.
 * Returned group: `height` metres tall, base at y = 0, centred on x, front face toward +z.
 */
export function buildThaiPbsLogo(height: number) {
  const group = new THREE.Group();
  group.name = "thai-pbs-logo";
  const materials = {
    orange: [
      new THREE.MeshStandardMaterial({ color: COLOURS.orange.face, roughness: 0.38, metalness: 0.05, emissive: COLOURS.orange.face, emissiveIntensity: 0.08 }),
      new THREE.MeshStandardMaterial({ color: COLOURS.orange.side, roughness: 0.5, metalness: 0.05 }),
    ],
    grey: [
      new THREE.MeshStandardMaterial({ color: COLOURS.grey.face, roughness: 0.45, metalness: 0.15 }),
      new THREE.MeshStandardMaterial({ color: COLOURS.grey.side, roughness: 0.55, metalness: 0.15 }),
    ],
  };

  for (const part of THAI_PBS_LOGO) {
    const shape = new THREE.Shape(toPoints(part.outer));
    for (const hole of part.holes) shape.holes.push(new THREE.Path(toPoints(hole)));
    const depth = DEPTH[part.colour];
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: depth * 0.18,
      bevelSize: 0.0035,
      bevelSegments: 2,
      curveSegments: 1,
    });
    // ExtrudeGeometry: group 0 = front/back caps, group 1 = sides.
    const mesh = new THREE.Mesh(geometry, materials[part.colour]);
    mesh.raycast = () => {};
    group.add(mesh);
  }

  group.scale.setScalar(height);
  group.userData.width = THAI_PBS_LOGO_ASPECT * height;
  return group;
}
