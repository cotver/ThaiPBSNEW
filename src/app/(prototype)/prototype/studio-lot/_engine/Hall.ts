import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";
import { concreteTexture, plasterTexture, vinylTexture } from "./signage";

const NAVE_HALF_WIDTH = 8;
const CEILING = 7;
const FRONT = 28;
const ENTRANCE_Z = 13;

/** The building around the rooms: polished floor, nave walls, lightbox ceiling, entrance portal. */
export class Hall {
  readonly group = new THREE.Group();
  private reflector?: Reflector;

  /** `back` is the end wall z — the hall grows with the number of rooms. */
  constructor(options: { font: string; reflections: boolean; benches: [number, number][]; back: number }) {
    const BACK = options.back;
    const length = FRONT - BACK;
    const centreZ = (FRONT + BACK) / 2;

    // Polished concrete: a reflector beneath a slightly translucent concrete skin reads as a sealed floor.
    if (options.reflections) {
      this.reflector = new Reflector(new THREE.PlaneGeometry(NAVE_HALF_WIDTH * 2, length), {
        clipBias: 0.003,
        color: new THREE.Color("#8d8a85"),
        textureWidth: Math.round(window.innerWidth * 0.5),
        textureHeight: Math.round(window.innerHeight * 0.5),
      });
      this.reflector.rotation.x = -Math.PI / 2;
      this.reflector.position.set(0, -0.01, centreZ);
      this.group.add(this.reflector);
    }
    const floorMap = concreteTexture();
    // Keep the pours roughly 5m square however long the hall grows.
    floorMap.repeat.set(3, length / 5.3);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(NAVE_HALF_WIDTH * 2, length),
      new THREE.MeshStandardMaterial({
        map: floorMap,
        color: "#9a958d",
        transparent: options.reflections,
        opacity: options.reflections ? 0.84 : 1,
        roughness: options.reflections ? 0.7 : 0.32,
        metalness: options.reflections ? 0 : 0.2,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, centreZ);
    this.group.add(floor);

    // Nave walls in warm grey so the plaster feature walls step forward.
    const navePlaster = plasterTexture(5);
    navePlaster.repeat.set(length / 5, CEILING / 5);
    const naveMaterial = new THREE.MeshStandardMaterial({ color: "#8f897f", map: navePlaster, roughness: 0.95 });
    for (const side of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.4, CEILING, length), naveMaterial);
      wall.position.set(side * (NAVE_HALF_WIDTH + 0.2), CEILING / 2, centreZ);
      this.group.add(wall);
    }
    const endWall = new THREE.Mesh(new THREE.BoxGeometry(NAVE_HALF_WIDTH * 2, CEILING, 0.4), naveMaterial);
    endWall.position.set(0, CEILING / 2, BACK);
    this.group.add(endWall);

    // Ceiling: dark soffit, coffer beams, and two lightbox strips running the length of the gallery.
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(NAVE_HALF_WIDTH * 2, length), new THREE.MeshStandardMaterial({ color: "#1c1b19", roughness: 1 }));
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, CEILING, centreZ);
    this.group.add(ceiling);
    const stripLength = ENTRANCE_Z - BACK - 2;
    const stripMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color("#fff3df").multiplyScalar(1.15), toneMapped: false });
    for (const x of [-2.6, 2.6]) {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.55, stripLength), stripMaterial);
      strip.rotation.x = Math.PI / 2;
      strip.position.set(x, CEILING - 0.02, (ENTRANCE_Z + BACK) / 2 - 1);
      this.group.add(strip);
    }
    const beamMaterial = new THREE.MeshStandardMaterial({ color: "#151412", roughness: 0.9 });
    const beams = new THREE.InstancedMesh(new THREE.BoxGeometry(NAVE_HALF_WIDTH * 2, 0.35, 0.3), beamMaterial, Math.max(1, Math.floor((ENTRANCE_Z - BACK) / 6)));
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < beams.count; i += 1) {
      matrix.makeTranslation(0, CEILING - 0.18, ENTRANCE_Z - 2 - i * 6);
      beams.setMatrixAt(i, matrix);
    }
    this.group.add(beams);

    // Benches facing the rooms — gallery furniture gives the scale.
    const benchTop = new THREE.MeshStandardMaterial({ color: "#3a2a1e", roughness: 0.55 });
    const benchLeg = new THREE.MeshStandardMaterial({ color: "#151412", roughness: 0.4, metalness: 0.6 });
    for (const [x, z] of options.benches) {
      const bench = new THREE.Group();
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 2.2), benchTop);
      top.position.y = 0.44;
      bench.add(top);
      for (const end of [-0.95, 0.95]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.06), benchLeg);
        leg.position.set(0, 0.2, end);
        bench.add(leg);
      }
      bench.position.set(x, 0, z);
      this.group.add(bench);
    }

    this.buildEntrance(options.font);
  }

  /** The portal: a dark wall with a doorway, lettering on the left — the first composition the camera sees. */
  private buildEntrance(font: string) {
    const portal = new THREE.Group();
    portal.position.set(0, 0, ENTRANCE_Z);
    const material = new THREE.MeshStandardMaterial({ color: "#2a2724", roughness: 0.85 });
    const doorHalf = 2.4;
    const slabWidth = NAVE_HALF_WIDTH - doorHalf;
    for (const side of [-1, 1]) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(slabWidth, CEILING, 0.6), material);
      slab.position.set(side * (doorHalf + slabWidth / 2), CEILING / 2, 0);
      portal.add(slab);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorHalf * 2, CEILING - 4.6, 0.6), material);
    lintel.position.set(0, 4.6 + (CEILING - 4.6) / 2, 0);
    portal.add(lintel);

    const lettering = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 1.65),
      new THREE.MeshStandardMaterial({ map: vinylTexture({ kicker: "Thai PBS · Programme Collection", title: "Studio Lot", sub: "นิทรรศการรายการ Thai PBS", font, ink: "#efe9de" }), transparent: true, depthWrite: false, roughness: 0.6 }),
    );
    lettering.position.set(-doorHalf - slabWidth / 2 + 0.1, 3.4, 0.31);
    portal.add(lettering);

    // A single warm spot on the lettering, and the bright gallery beyond the doorway.
    const spot = new THREE.SpotLight("#ffe0b8", 40, 12, 0.5, 0.8, 1.4);
    spot.position.set(-doorHalf - slabWidth / 2, 6.6, 3.6);
    spot.target.position.set(-doorHalf - slabWidth / 2, 3.2, 0);
    portal.add(spot, spot.target);
    this.group.add(portal);
  }

  resize(width: number, height: number) {
    this.reflector?.getRenderTarget().setSize(Math.round(width * 0.5), Math.round(height * 0.5));
  }

  dispose() {
    this.reflector?.dispose();
  }
}
