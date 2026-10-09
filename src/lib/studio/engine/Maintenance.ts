import * as THREE from "three";
import { hazardStripeTexture, maintenanceSignTexture, plasterTexture } from "./signage";

/**
 * A closed room: fills a slot on the side of the hall that has run out of rooms, so the hall stays
 * symmetrical — the Studios sections hang on the right and the rest on the left, and the shorter side
 * ends in walls like this. A plaster wall like a room's, its red curtain drawn shut, and a row of
 * construction barriers in front carrying a "closed for maintenance" plate. Not a room: nothing on it
 * can be pointed at, walked to or opened.
 */
export function maintenanceWall(options: { x: number; z: number; facing: number; width: number; height: number; font: string; seed: number }) {
  const { width, height } = options;
  const group = new THREE.Group();
  group.name = "maintenance-wall";
  group.position.set(options.x, 0, options.z);
  group.rotation.y = options.facing;

  // The wall itself, as a room's (Room): plaster, same footprint, so the hall's rhythm doesn't break.
  const plaster = plasterTexture(options.seed);
  plaster.repeat.set(width / 4, height / 4);
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.4), new THREE.MeshStandardMaterial({ color: "#ddd6ca", map: plaster, roughness: 0.94 }));
  body.position.y = height / 2;
  group.add(body);

  // Wall-local space on the wall's face, as Room.wall: origin at floor level, wall centre, +z toward the hall.
  const face = new THREE.Group();
  face.position.z = 0.21;
  group.add(face);

  const skirting = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, 0.03), new THREE.MeshStandardMaterial({ color: "#2b2926", roughness: 0.6 }));
  skirting.position.set(0, 0.06, 0.01);
  face.add(skirting);

  // The curtain, drawn shut: deep red velvet hanging in soft folds from a rod under a pelmet.
  const velvet = new THREE.MeshStandardMaterial({ color: "#8a0f18", roughness: 0.82, side: THREE.DoubleSide });
  const curtainWidth = width - 0.3;
  const curtainHeight = height - 0.45;
  const curtain = new THREE.PlaneGeometry(curtainWidth, curtainHeight, Math.round(curtainWidth * 14), 8);
  const position = curtain.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    // About two folds a metre, a little irregular; the cloth bells out slightly toward the floor.
    const fold = Math.sin(x * 12.6) * 0.07 + Math.sin(x * 4.1 + 1.3) * 0.03;
    const flare = 1 + (0.5 - y / curtainHeight) * 0.35;
    position.setZ(i, fold * flare);
  }
  curtain.computeVertexNormals();
  const cloth = new THREE.Mesh(curtain, velvet);
  cloth.position.set(0, 0.06 + curtainHeight / 2, 0.28);
  face.add(cloth);
  // The seam where the two halves meet, just off centre.
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.03, curtainHeight, 0.02), new THREE.MeshStandardMaterial({ color: "#4e070c", roughness: 0.9 }));
  seam.position.set(0.18, 0.06 + curtainHeight / 2, 0.36);
  face.add(seam);
  const pelmet = new THREE.Mesh(new THREE.BoxGeometry(width - 0.1, 0.42, 0.16), new THREE.MeshStandardMaterial({ color: "#6d0b13", roughness: 0.75 }));
  pelmet.position.set(0, height - 0.24, 0.32);
  face.add(pelmet);
  const fringe = new THREE.Mesh(new THREE.BoxGeometry(width - 0.1, 0.05, 0.17), new THREE.MeshStandardMaterial({ color: "#c79a3c", roughness: 0.4, metalness: 0.6 }));
  fringe.position.set(0, height - 0.47, 0.32);
  face.add(fringe);

  // Construction barriers across the front: striped boards on white A-frame legs, with the sign on the middle one.
  const stripes = hazardStripeTexture();
  const legMaterial = new THREE.MeshStandardMaterial({ color: "#eeeae2", roughness: 0.6 });
  const footMaterial = new THREE.MeshStandardMaterial({ color: "#2a2a2a", roughness: 0.8 });
  const barrierWidth = 2.4;
  const gap = 0.35;
  const count = Math.max(1, Math.floor((width - 1.2 + gap) / (barrierWidth + gap)));
  const rowWidth = count * barrierWidth + (count - 1) * gap;
  const fenceZ = 1.5;
  const boardGeometry = new THREE.BoxGeometry(barrierWidth, 0.2, 0.035);
  const legGeometry = new THREE.BoxGeometry(0.06, 1.12, 0.06);
  const footGeometry = new THREE.BoxGeometry(0.1, 0.06, 0.62);
  for (let i = 0; i < count; i += 1) {
    const x = -rowWidth / 2 + barrierWidth / 2 + i * (barrierWidth + gap);
    const barrier = new THREE.Group();
    barrier.position.set(x, 0, fenceZ + (i % 2) * 0.12);
    for (const y of [0.98, 0.62]) {
      const material = new THREE.MeshStandardMaterial({ map: stripes.clone(), roughness: 0.55 });
      material.map!.repeat.set(barrierWidth / 0.8, 1);
      material.map!.needsUpdate = true;
      const board = new THREE.Mesh(boardGeometry, material);
      board.position.set(0, y, 0);
      barrier.add(board);
    }
    for (const side of [-1, 1]) {
      // Each end stands on a splayed pair of legs (an A-frame seen side-on) and a rubber foot.
      for (const lean of [-1, 1]) {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(side * (barrierWidth / 2 - 0.12), 0.55, lean * 0.12);
        leg.rotation.x = lean * 0.22;
        barrier.add(leg);
      }
      const foot = new THREE.Mesh(footGeometry, footMaterial);
      foot.position.set(side * (barrierWidth / 2 - 0.12), 0.03, 0);
      barrier.add(foot);
    }
    if (i === Math.floor(count / 2)) {
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.625), new THREE.MeshStandardMaterial({ map: maintenanceSignTexture(options.font), roughness: 0.5 }));
      sign.position.set(0, 1.42, 0.03);
      barrier.add(sign);
      const hanger = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3, 0.03), legMaterial);
      for (const side of [-0.55, 0.55]) {
        const strap = hanger.clone();
        strap.position.set(side, 1.1, 0.02);
        barrier.add(strap);
      }
    }
    face.add(barrier);
  }

  // Nothing here is a room: keep it out of pointer picking (the engine only raycasts room hit targets anyway).
  group.traverse((object) => {
    object.raycast = () => {};
  });
  return group;
}
