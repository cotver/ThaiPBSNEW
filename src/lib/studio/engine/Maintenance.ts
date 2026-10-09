import * as THREE from "three";
import { maintenanceSignTexture, plasterTexture } from "./signage";

/**
 * A closed room: fills a slot on the side of the hall that has run out of rooms, so the hall stays
 * symmetrical — the Studios sections hang on the right and the rest on the left, and the shorter side
 * ends in walls like this. A plaster wall like a room's, its red curtain drawn shut, and a cinema's
 * brass-and-velvet rope barrier in front with a framed "closed for maintenance" sign. Not a room: nothing on it
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

  // A cinema queue barrier across the front: polished brass posts with red velvet ropes sagging between them,
  // and a framed "closed" sign on its own stand in the middle, as at a closed screen.
  const brass = new THREE.MeshStandardMaterial({ color: "#c9a24a", roughness: 0.28, metalness: 0.85 });
  const rope = new THREE.MeshStandardMaterial({ color: "#8a0f18", roughness: 0.9 });
  const fenceZ = 1.5;
  const ropeY = 0.93;
  const span = width - 1.4;
  const posts = Math.max(2, Math.round(span / 2.6) + 1);
  const baseGeometry = new THREE.CylinderGeometry(0.17, 0.19, 0.04, 24);
  const poleGeometry = new THREE.CylinderGeometry(0.024, 0.024, 0.95, 12);
  const knobGeometry = new THREE.SphereGeometry(0.05, 16, 12);
  const collarGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12);
  const postXs = Array.from({ length: posts }, (_, i) => -span / 2 + (i * span) / (posts - 1));
  for (const x of postXs) {
    const base = new THREE.Mesh(baseGeometry, brass);
    base.position.set(x, 0.02, fenceZ);
    const pole = new THREE.Mesh(poleGeometry, brass);
    pole.position.set(x, 0.515, fenceZ);
    const collar = new THREE.Mesh(collarGeometry, brass);
    collar.position.set(x, ropeY, fenceZ);
    const knob = new THREE.Mesh(knobGeometry, brass);
    knob.position.set(x, 1.02, fenceZ);
    face.add(base, pole, collar, knob);
  }
  // Each rope hangs in a gentle curve between neighbouring posts (about 18cm of sag), with a brass end on each post.
  const hookGeometry = new THREE.SphereGeometry(0.03, 10, 8);
  for (let i = 0; i < postXs.length - 1; i += 1) {
    const from = new THREE.Vector3(postXs[i] + 0.045, ropeY, fenceZ);
    const to = new THREE.Vector3(postXs[i + 1] - 0.045, ropeY, fenceZ);
    const sag = new THREE.Vector3((from.x + to.x) / 2, ropeY - 0.36, fenceZ);
    const curve = new THREE.QuadraticBezierCurve3(from, sag, to);
    face.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.022, 8, false), rope));
    for (const end of [from, to]) {
      const hook = new THREE.Mesh(hookGeometry, brass);
      hook.position.copy(end);
      face.add(hook);
    }
  }
  // The sign: a brass-framed board on a stand just in front of the ropes, tilted back to be read from the hall.
  const stand = new THREE.Group();
  stand.position.set(0, 0, fenceZ + 0.55);
  const standBase = new THREE.Mesh(baseGeometry, brass);
  standBase.position.y = 0.02;
  const standPole = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 1.1, 12), brass);
  standPole.position.y = 0.57;
  const board = new THREE.Group();
  board.position.y = 1.32;
  board.rotation.x = -0.26;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.6, 0.03), brass);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.5), new THREE.MeshStandardMaterial({ map: maintenanceSignTexture(options.font), roughness: 0.55 }));
  sign.position.z = 0.017;
  board.add(frame, sign);
  stand.add(standBase, standPole, board);
  face.add(stand);

  // Nothing here is a room: keep it out of pointer picking (the engine only raycasts room hit targets anyway).
  group.traverse((object) => {
    object.raycast = () => {};
  });
  return group;
}
