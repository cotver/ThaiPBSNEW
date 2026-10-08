import * as THREE from "three";
import { damp } from "./math";
import type { Room } from "./Room";
import { bannerTexture, brandPlateTexture, onAirTexture, radialTexture, testCardTexture } from "./signage";

const PLASTER = new THREE.MeshStandardMaterial({ color: "#f1ede6", roughness: 0.85 });
const GRAPHITE = new THREE.MeshStandardMaterial({ color: "#2b2d33", roughness: 0.45, metalness: 0.55 });
const STEEL = new THREE.MeshStandardMaterial({ color: "#8d9096", roughness: 0.3, metalness: 0.9 });

/** A light that answers to a room's hover: ON AIR boxes and camera tally lights. */
type Lamp = { color: THREE.Color; tint: THREE.Color; room: Room; base: number; boost: number };
type Banner = { mesh: THREE.Mesh; phase: number };

/**
 * Broadcast-house furnishings that make the gallery feel like Thai PBS rather than any museum:
 * a studio prop per room, an ON AIR box that lights when the room is looked at,
 * ceiling banners, and a reception desk in the foyer.
 */
export class Exhibits {
  readonly group = new THREE.Group();
  private readonly lamps: Lamp[] = [];
  private readonly banners: Banner[] = [];
  private readonly sway = new THREE.Vector2();
  private readonly testCard: THREE.Texture;
  private readonly glow = radialTexture();
  private readonly onAir: THREE.Texture;
  private readonly brand: THREE.Texture;
  private readonly font: string;

  /** Shared textures and the foyer desk; rooms are furnished one at a time with addRoom(). */
  constructor(font: string) {
    this.font = font;
    this.testCard = testCardTexture(font);
    this.onAir = onAirTexture();
    this.brand = brandPlateTexture("Thai PBS", font, "#1b1a18", "#f2ede4");
    this.buildReception(font, this.brand);
  }

  /** Furnish one room — kept per-room so the engine can yield between rooms while it builds. */
  addRoom(room: Room, index: number) {
    const { font, onAir, brand } = this;
    {
      const { position, width, height, accent, onAir: onAirPlace } = room.config;
      const [x, z] = position;
      const side = Math.sign(x) || -1;

      // ON AIR box, top-right of the feature wall (or under the title): dim until someone looks at the room.
      // Under the title it lines up with the title's left edge, below the accent rule (see Room).
      const titleWidth = Math.min(3.2, width * 0.25);
      const [signX, signY] = onAirPlace === "underTitle" ? [-width / 2 + 0.55 + 0.49, height - 0.95 - titleWidth * 0.375] : [width / 2 - 0.85, height - 0.42];
      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.34, 0.08), GRAPHITE);
      housing.position.set(signX, signY, 0.04);
      room.wall.add(housing);
      const face = new THREE.MeshBasicMaterial({ map: onAir, toneMapped: false });
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.28), face);
      sign.position.set(signX, signY, 0.082);
      room.wall.add(sign);
      this.lamps.push({ color: face.color, tint: new THREE.Color(1, 1, 1), room, base: 0.4, boost: 1.5 });

      // A studio prop on the floor, under the room title, out of the way of the hang.
      const propPosition = new THREE.Vector3(side * 5.6, 0, z - side * Math.max(4.8, width / 2 - 2.2));
      const artTarget = new THREE.Vector3(side * 7.3, 0, z + side * 1.0);
      const pathTarget = new THREE.Vector3(0, 0, propPosition.z + 2);
      const prop = this.buildProp(index % 4, accent, brand, room);
      prop.position.copy(propPosition);
      prop.lookAt(index % 4 === 0 ? artTarget : pathTarget);
      this.group.add(prop);

      // A cloth banner between this room and the next, hanging from the ceiling — past the wall's end, never in front of it.
      const bannerZ = z - Math.max(6.5, width / 2 + 0.6);
      const banner = new THREE.Mesh(
        new THREE.PlaneGeometry(1.1, 3.1),
        new THREE.MeshStandardMaterial({ map: bannerTexture(accent, font), side: THREE.DoubleSide, roughness: 0.95 }),
      );
      const bannerGeometry = banner.geometry as THREE.PlaneGeometry;
      bannerGeometry.translate(0, -1.55, 0); // pivot at the top, so it swings from the rod
      banner.position.set(side * 3.1, 6.85, bannerZ);
      banner.rotation.y = side * (Math.PI / 2);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 8), STEEL);
      rod.rotation.x = Math.PI / 2;
      rod.position.set(side * 3.1, 6.87, bannerZ);
      this.group.add(banner, rod);
      this.banners.push({ mesh: banner, phase: index * 1.7 });
    }
  }

  private buildProp(kind: number, accent: string, brand: THREE.Texture, room: Room) {
    if (kind === 0) return this.camera(brand, room);
    if (kind === 1) return this.monitor(brand);
    if (kind === 2) return this.microphone(accent, brand);
    return this.tapeCase(accent);
  }

  /** Studio camera on a tripod, aimed at the room's work, tally light tied to the room. */
  private camera(brand: THREE.Texture, room: Room) {
    const prop = new THREE.Group();
    const legGeometry = new THREE.CylinderGeometry(0.022, 0.03, 1.38, 8);
    for (let i = 0; i < 3; i += 1) {
      const angle = (i / 3) * Math.PI * 2;
      const leg = new THREE.Mesh(legGeometry, STEEL);
      leg.position.set(Math.cos(angle) * 0.22, 0.64, Math.sin(angle) * 0.22);
      leg.lookAt(Math.cos(angle) * 0.6, 0, Math.sin(angle) * 0.6);
      leg.rotateX(Math.PI / 2);
      prop.add(leg);
    }
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.66), GRAPHITE);
    head.position.set(0, 1.5, 0);
    prop.add(head);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.32, 20), new THREE.MeshStandardMaterial({ color: "#121316", roughness: 0.25, metalness: 0.6 }));
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 1.5, 0.48);
    prop.add(lens);
    const viewfinder = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.2), GRAPHITE);
    viewfinder.position.set(-0.2, 1.72, -0.12);
    prop.add(viewfinder);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), new THREE.MeshStandardMaterial({ map: brand, roughness: 0.6 }));
    plate.position.set(0.172, 1.5, 0);
    plate.rotation.y = Math.PI / 2;
    prop.add(plate);
    const tally = new THREE.SpriteMaterial({ map: this.glow, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const light = new THREE.Sprite(tally);
    light.scale.setScalar(0.16);
    light.position.set(0, 1.71, 0.3);
    prop.add(light);
    this.lamps.push({ color: tally.color, tint: new THREE.Color("#ff3b30"), room, base: 0.5, boost: 2.2 });
    return prop;
  }

  /** Broadcast monitor on a plinth, showing the test card. */
  private monitor(brand: THREE.Texture) {
    const prop = new THREE.Group();
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.0, 0.6), PLASTER);
    plinth.position.y = 0.5;
    prop.add(plinth);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.55), GRAPHITE);
    body.position.y = 1.31;
    prop.add(body);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.38), new THREE.MeshBasicMaterial({ map: this.testCard, toneMapped: false, color: new THREE.Color(0.9, 0.9, 0.9) }));
    screen.position.set(0, 1.33, 0.277);
    prop.add(screen);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), new THREE.MeshStandardMaterial({ map: brand, roughness: 0.6 }));
    plate.position.set(0, 0.78, 0.302);
    prop.add(plate);
    return prop;
  }

  /** Interview microphone on a stand with a Thai PBS mic flag. */
  private microphone(accent: string, brand: THREE.Texture) {
    const prop = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.03, 24), GRAPHITE);
    base.position.y = 0.015;
    prop.add(base);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.42, 8), STEEL);
    pole.position.y = 0.73;
    prop.add(pole);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.022, 0.24, 12), GRAPHITE);
    handle.position.set(0, 1.5, 0.06);
    handle.rotation.x = Math.PI / 3;
    prop.add(handle);
    const grille = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), STEEL);
    grille.position.set(0, 1.58, 0.14);
    prop.add(grille);
    const flagMaterials = new THREE.MeshStandardMaterial({ map: brand, roughness: 0.5, emissive: accent, emissiveIntensity: 0.05 });
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), flagMaterials);
    flag.position.set(0, 1.5, 0.08);
    flag.rotation.x = Math.PI / 3;
    prop.add(flag);
    return prop;
  }

  /** Glass vitrine of archive broadcast tapes — the collection's physical past. */
  private tapeCase(accent: string) {
    const prop = new THREE.Group();
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.86, 0.6), PLASTER);
    plinth.position.y = 0.43;
    prop.add(plinth);
    const tapeMaterial = new THREE.MeshStandardMaterial({ color: "#1d1d1f", roughness: 0.4 });
    const labelMaterial = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.6 });
    for (let i = 0; i < 7; i += 1) {
      const tape = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.19, 0.3), tapeMaterial);
      tape.position.set(-0.42 + i * 0.14, 0.955, 0);
      tape.rotation.z = i === 6 ? 0.25 : 0;
      prop.add(tape);
      const label = new THREE.Mesh(new THREE.BoxGeometry(0.112, 0.07, 0.12), labelMaterial);
      label.position.set(-0.42 + i * 0.14, 0.97, 0.1);
      prop.add(label);
    }
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.5, 0.6),
      new THREE.MeshStandardMaterial({ color: "#e6eef2", transparent: true, opacity: 0.14, roughness: 0.05, metalness: 0.1, depthWrite: false }),
    );
    glass.position.y = 1.11;
    prop.add(glass);
    return prop;
  }

  /** Foyer reception desk with the name on its front and a monitor on the counter. */
  private buildReception(font: string, brand: THREE.Texture) {
    const desk = new THREE.Group();
    desk.position.set(4.3, 0, 19.5);
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.05, 0.85), PLASTER);
    body.position.y = 0.525;
    desk.add(body);
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.06, 0.95), new THREE.MeshStandardMaterial({ color: "#3a2a1e", roughness: 0.5 }));
    top.position.y = 1.08;
    desk.add(top);
    const front = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 0.5),
      new THREE.MeshStandardMaterial({ map: brandPlateTexture("Thai PBS · ไทยพีบีเอส", font, "#f1ede6"), roughness: 0.8 }),
    );
    front.position.set(0, 0.58, 0.426);
    desk.add(front);
    const screen = this.monitor(brand);
    screen.scale.setScalar(0.55);
    screen.position.set(1.0, 0.56, 0);
    desk.add(screen);
    desk.rotation.y = -0.35;
    this.group.add(desk);
  }

  update(dt: number, time: number, cameraVelocity: THREE.Vector3, reducedMotion: boolean) {
    // ON AIR boxes and tally lights pulse once you are at their room, and blaze when you point at it.
    const pulse = reducedMotion ? 1 : 0.65 + 0.35 * Math.sin(time * 3.6);
    for (const lamp of this.lamps) {
      const engaged = Math.max(lamp.room.hoverAmount, lamp.room.activeAmount * 0.6 * pulse);
      lamp.color.copy(lamp.tint).multiplyScalar(lamp.base + engaged * lamp.boost);
    }
    if (reducedMotion) return;
    // Banners stir as the visitor walks past, then settle.
    this.sway.x = damp(this.sway.x, THREE.MathUtils.clamp(-cameraVelocity.z * 0.02, -0.25, 0.25), 2, dt);
    for (const banner of this.banners) {
      banner.mesh.rotation.z = this.sway.x + Math.sin(time * 0.6 + banner.phase) * 0.015;
    }
  }
}

