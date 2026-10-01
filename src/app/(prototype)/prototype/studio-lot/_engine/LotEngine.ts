import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import type { LotData, LotSectionId } from "../_lib/data";
import { Atmosphere } from "./Atmosphere";
import { Exhibits } from "./Exhibits";
import { CameraRig } from "./CameraRig";
import { Hall } from "./Hall";
import { LedWall } from "./LedWall";
import { disposeTree } from "./math";
import { Room, type RoomConfig } from "./Room";
import { captionTexture, partnerLogoTexture, posterFallback, printTexture, testCardTexture } from "./signage";

export type LotQuality = "high" | "low";

export type LotEngineEvents = {
  /** Building the scene (0..1), before artwork starts loading. */
  onBuildProgress?: (ratio: number) => void;
  onLoadProgress: (ratio: number) => void;
  onReady: () => void;
  onHover: (section: LotSectionId | null) => void;
  onSelect: (section: LotSectionId) => void;
  onFocusSettled: (section: LotSectionId | null) => void;
  onTravel: (progress: number, nearest: LotSectionId) => void;
};

export type LotEngineOptions = LotEngineEvents & {
  canvas: HTMLCanvasElement;
  data: LotData;
  font: string;
  quality: LotQuality;
  reducedMotion: boolean;
};

/** Let the browser paint (and run compositor work) before continuing a long task. */
function yieldToBrowser() {
  const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  return scheduler?.yield ? scheduler.yield() : new Promise<void>((resolve) => setTimeout(resolve, 0));
}

const ROOM_SPACING = 13;
const ACCENTS = ["#c9a24a", "#2f6f86", "#b5462f", "#5d7a3a", "#7a4a8c", "#b07a3a"];

/** Rooms alternate left and right down the nave, one per /home section, in the same order. */
function roomLayout(index: number) {
  const side = index % 2 === 0 ? -1 : 1;
  return { side, x: side * 7.5, z: -1 - index * ROOM_SPACING, facing: side < 0 ? Math.PI / 2 : -Math.PI / 2 };
}

function hallEnd(roomCount: number) {
  return roomLayout(Math.max(0, roomCount - 1)).z - 12;
}

/**
 * Wall geometry per /home layout, in metres. Proportions follow the site:
 * 16:9 cards and tiles, 2:3 posters, square event covers, press cards with a square image.
 */
const HANG = {
  screen: { w: 7.6, h: 4.275, x: 0.8, y: 2.95 },
  thumb: { w: 1.2, h: 0.675, x: 5.55, gap: 0.82 },
} as const;

type GridSpec = { perRow: number; rows: number; w: number; h: number; gapX: number; gapY: number };

const GRIDS: Record<"poster" | "vertical" | "wide" | "tile" | "landscape" | "logo" | "press" | "square", GridSpec> = {
  poster: { perRow: 5, rows: 2, w: 1.36, h: 0.765, gapX: 1.5, gapY: 0.95 },
  vertical: { perRow: 7, rows: 1, w: 1.0, h: 1.5, gapX: 1.15, gapY: 0 },
  wide: { perRow: 4, rows: 1, w: 1.75, h: 0.984, gapX: 1.95, gapY: 0 },
  tile: { perRow: 6, rows: 2, w: 1.15, h: 0.647, gapX: 1.28, gapY: 0.85 },
  landscape: { perRow: 3, rows: 2, w: 2.2, h: 1.24, gapX: 2.45, gapY: 1.62 },
  press: { perRow: 2, rows: 2, w: 3.3, h: 1.3, gapX: 3.6, gapY: 1.6 },
  square: { perRow: 3, rows: 2, w: 1.4, h: 1.4, gapX: 2.1, gapY: 2.0 },
  logo: { perRow: 3, rows: 2, w: 2.2, h: 1.24, gapX: 2.45, gapY: 1.62 },
};

/** Centre positions for `count` pieces laid out like a /home grid, centred on (cx, cy). */
function gridPositions(count: number, spec: GridSpec, cx: number, cy: number) {
  const shown = Math.min(count, spec.perRow * spec.rows);
  const rows = Math.ceil(shown / spec.perRow);
  return Array.from({ length: shown }, (_, index) => {
    const row = Math.floor(index / spec.perRow);
    const inRow = Math.min(spec.perRow, shown - row * spec.perRow);
    const column = index % spec.perRow;
    return { x: cx + (column - (inRow - 1) / 2) * spec.gapX, y: cy + ((rows - 1) / 2 - row) * spec.gapY };
  });
}

function gridSpan(spec: GridSpec) {
  return (spec.perRow - 1) * spec.gapX + spec.w;
}

function roomShape(room: LotData["rooms"][number]): keyof typeof GRIDS | "screen" {
  if (room.kind === "featured" || room.itemShape === "hero") return "screen";
  if (room.kind === "row") return room.layout ?? "vertical";
  return room.itemShape ?? "landscape";
}

function roomConfigs(data: LotData): RoomConfig[] {
  return data.rooms.map((room, index) => {
    const { x, z, facing } = roomLayout(index);
    const base = { id: room.id, position: [x, z] as [number, number], facing, height: 5.6, kicker: "", title: room.title, sub: room.thai, accent: ACCENTS[index % ACCENTS.length] };
    const shape = roomShape(room);
    if (shape === "screen") {
      const lead = room.kind === "featured" ? room.programs[0] : undefined;
      const item = room.items[0];
      return {
        ...base,
        width: 14,
        art: [1.3, HANG.screen.y] as [number, number],
        artWidth: 9,
        label: lead
          ? { title: lead.title, meta: `${lead.type} · ${lead.year} · Featured`, note: lead.description }
          : item
            ? { title: item.title, meta: item.meta ?? room.title, note: room.blurb }
            : { title: "Stand by", meta: room.title, note: room.blurb },
      };
    }
    const spec = GRIDS[shape];
    const count = room.kind === "row" ? room.programs.length : room.items.length;
    return {
      ...base,
      width: 13,
      art: [1.0, shape === "vertical" ? 2.6 : 2.75] as [number, number],
      artWidth: gridSpan(spec),
      label: { title: room.title, meta: room.kind === "row" ? room.blurb : `${count} ${count === 1 ? "item" : "items"}`, note: room.blurb },
    };
  });
}

/**
 * Owns renderer, scene, camera rig and interaction. React talks to it only through the
 * public methods and the event callbacks, so the 3D layer can be swapped or removed freely.
 */
export class LotEngine {
  private readonly options: LotEngineOptions;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly rig: CameraRig;
  private composer?: EffectComposer;
  private bloom?: UnrealBloomPass;
  private healthClock = 0;
  private readonly probe = new Uint8Array(4);
  private hall!: Hall;
  private atmosphere!: Atmosphere;
  private exhibits!: Exhibits;
  private built = false;
  private readonly rooms = new Map<LotSectionId, Room>();
  private readonly hitTargets: THREE.Object3D[] = [];
  private ledWall!: LedWall;
  /** Id of the room holding the screen (the HeroCarousel section), if there is one. */
  private featuredId?: LotSectionId;
  /** Frames of the hero thumbnail rail; the one matching the screen lights up, like the /home rail. */
  private readonly thumbFrames: THREE.MeshStandardMaterial[] = [];
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2(9, 9);
  private readonly clock = new THREE.Timer();
  private resizeObserver?: ResizeObserver;
  private loadingManager!: THREE.LoadingManager;
  private readonly videoState: { element: HTMLVideoElement | null; texture: THREE.VideoTexture | null; timer: number } = { element: null, texture: null, timer: 0 };
  private hovered: LotSectionId | null = null;
  private forcedHover: LotSectionId | null = null;
  private focused: LotSectionId | null = null;
  private pendingFocus: LotSectionId | null = null;
  private pointerDirty = false;
  private frame = 0;
  private running = false;
  private disposed = false;
  private ready = false;
  private lastNearest: LotSectionId | null = null;
  private lastProgressReport = -1;
  private hoverClock = 0;
  private touchY: number | null = null;
  private time = 0;

  constructor(options: LotEngineOptions) {
    this.options = options;
    const { canvas, quality } = options;
    const high = quality === "high";

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !high, powerPreference: "high-performance", stencil: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, high ? 1.75 : 1.25));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.5;

    const { width, height } = this.size();
    this.renderer.setSize(width, height, false);
    this.rig = new CameraRig(width / height, hallEnd(options.data.rooms.length));
    this.rig.resize(width / height);
    this.rig.onFocusSettled = (focused) => this.handleFocusSettled(focused);

    // After-hours gallery: warm dark air, the work lit by its own spots.
    // A lit gallery, warm and open — the haze only softens the far end of the hall.
    this.scene.background = new THREE.Color("#2b2620");
    this.scene.fog = new THREE.FogExp2("#2e2822", 0.011);
    this.scene.add(new THREE.HemisphereLight("#fff3e4", "#5a5048", 1.5));
    // Ceiling fill every 18m down the whole hall, however many rooms it holds.
    for (let z = 6; z > hallEnd(options.data.rooms.length); z -= 18) {
      const fill = new THREE.PointLight("#ffe9cf", 40, 30, 1.2);
      fill.position.set(0, 6.3, z);
      this.scene.add(fill);
    }

  }

  /**
   * Builds the scene without freezing the page: assembled in steps, yielding to the browser between
   * them so the loading countdown keeps animating. Call once after constructing; rejects if the
   * engine is disposed meanwhile (the caller keeps the handle, so it can dispose mid-build).
   */
  async init() {
    const { options } = this;
    const high = options.quality === "high";
    const { width, height } = this.size();
    const configs = roomConfigs(options.data);
    const steps = configs.length + 3;
    let step = 0;
    const advance = async () => {
      step += 1;
      options.onBuildProgress?.(step / steps);
      await yieldToBrowser();
      if (this.disposed) throw new Error("Gallery disposed while building");
    };

    this.featuredId = options.data.rooms.find((room) => room.kind === "featured")?.id;
    const benches = options.data.rooms.map((_, index): [number, number] => [roomLayout(index).side * 3.4, roomLayout(index).z]);
    this.hall = new Hall({ reflections: high, benches, back: hallEnd(options.data.rooms.length) });
    this.scene.add(this.hall.group);
    this.atmosphere = new Atmosphere({ particles: high ? 600 : 220 });
    this.scene.add(this.atmosphere.group);
    this.exhibits = new Exhibits(options.font);
    this.scene.add(this.exhibits.group);
    await advance();

    // One room (and its furnishings) per step.
    for (const [index, config] of configs.entries()) {
      const room = new Room(config, options.font);
      this.rooms.set(config.id, room);
      this.scene.add(room.group);
      this.exhibits.addRoom(room, index);
      await advance();
    }

    this.loadingManager = new THREE.LoadingManager();
    this.ledWall = new LedWall(8.6, 4.84);
    await advance();
    // From here on everything is synchronous, so the image loaders' callbacks always find a finished scene.
    this.hangWork();

    this.scene.updateMatrixWorld(true);
    this.computeTrackPositions();
    for (const room of this.rooms.values()) this.hitTargets.push(...room.hitTargets);

    if (high) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.setPixelRatio(this.renderer.getPixelRatio());
      this.composer.setSize(width, height);
      this.composer.addPass(new RenderPass(this.scene, this.rig.camera));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(width / 2, height / 2), 0.4, 0.5, 1.0);
      this.composer.addPass(this.bloom);
      this.composer.addPass(new OutputPass());
    }

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(options.canvas.parentElement ?? options.canvas);
    this.bind();
    this.built = true;
    options.onBuildProgress?.(1);
  }

  // ————————————————————————————————————————— public API

  start() {
    if (this.running || this.disposed) return;
    this.running = true;
    this.clock.reset();
    const tick = (timestamp: number) => {
      if (!this.running) return;
      this.frame = requestAnimationFrame(tick);
      this.clock.update(timestamp);
      // rAF timestamps can precede the reset, giving a negative delta; never step time backwards.
      this.render(THREE.MathUtils.clamp(this.clock.getDelta(), 0, 1 / 20));
    };
    this.frame = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  nudge(delta: number) {
    this.rig.nudge(delta);
  }

  travelTo(section: LotSectionId) {
    const room = this.rooms.get(section);
    if (room) this.rig.setProgress(room.trackT);
  }

  /** Keyboard/HUD hover — highlights a room without a pointer. */
  setForcedHover(section: LotSectionId | null) {
    this.forcedHover = section;
  }

  focus(section: LotSectionId | null) {
    if (section === this.focused) return;
    if (section && this.focused) {
      // Step back into the nave first, then walk up to the next wall.
      this.pendingFocus = section;
      this.focused = null;
      this.rig.focus(null, null, this.options.reducedMotion);
      return;
    }
    this.focused = section;
    if (!section) {
      this.rig.focus(null, null, this.options.reducedMotion);
      return;
    }
    const room = this.rooms.get(section);
    if (!room) return;
    const pose = room.focusPose({ position: new THREE.Vector3(), target: new THREE.Vector3() });
    this.rig.focus(pose, room.trackT, this.options.reducedMotion);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    if (this.built) this.unbind();
    this.resizeObserver?.disconnect();
    if (this.ledWall) this.stopVideo();
    this.hall?.dispose();
    disposeTree(this.scene);
    this.composer?.dispose();
    this.bloom?.dispose();
    this.renderer.dispose();
  }

  // ————————————————————————————————————————— hanging the work

  private hangWork() {
    const { data, font } = this.options;
    const loader = new THREE.TextureLoader(this.loadingManager);
    loader.setCrossOrigin("anonymous");
    let pending = 0;

    /**
     * Images go through Next's optimizer, exactly like next/image on /home: it converts formats a
     * browser cannot draw (the CMS has .tif uploads), serves same-origin (no CORS failures for
     * remote hosts), and sends a size suited to the frame. Falls back to the raw URL, then a placeholder.
     */
    const loadImage = (url: string | undefined, fallbackTitle: string, index: number, onLoad: (texture: THREE.Texture, aspect: number) => void, width = 640) => {
      const fallback = () => onLoad(posterFallback(fallbackTitle, font, index), 2 / 3);
      if (!url) return fallback();
      const loaded = (texture: THREE.Texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        const image = texture.image as HTMLImageElement;
        onLoad(texture, image.width / Math.max(1, image.height));
      };
      const optimized = /^(data|blob):/.test(url) ? url : `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=75`;
      pending += 1;
      loader.load(optimized, loaded, undefined, () => {
        if (optimized === url) return fallback();
        // The manager already counted this item; the raw retry loads without it.
        new THREE.TextureLoader().setCrossOrigin("anonymous").load(url, loaded, undefined, fallback);
      });
    };

    const frameMaterial = new THREE.MeshStandardMaterial({ color: "#1d1915", roughness: 0.45, metalness: 0.2 });
    const matMaterial = new THREE.MeshStandardMaterial({ color: "#f7f4ee", roughness: 0.9 });

    /** A framed piece: moulding, optional mat, and the work itself (lit, but never muddy). */
    const hang = (room: Room, x: number, y: number, w: number, h: number, mat = 0) => {
      const depth = 0.06;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(w + mat * 2 + 0.1, h + mat * 2 + 0.1, depth), frameMaterial);
      frame.position.set(x, y, depth / 2);
      room.wall.add(frame);
      if (mat) {
        const passe = new THREE.Mesh(new THREE.PlaneGeometry(w + mat * 2, h + mat * 2), matMaterial);
        passe.position.set(x, y, depth + 0.002);
        room.wall.add(passe);
      }
      // Unlit and outside tone mapping: the work shows its true colours whatever the room light does.
      const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.93, 0.93, 0.93), toneMapped: false });
      material.userData.aspect = w / h;
      const work = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
      work.position.set(x, y, depth + 0.004);
      room.wall.add(work);
      room.addHitTarget(work);
      room.addHitTarget(frame);
      return material;
    };
    const apply = (material: THREE.MeshBasicMaterial, texture: THREE.Texture) => {
      const frameAspect = material.userData.aspect as number | undefined;
      const image = texture.image as { width?: number; height?: number } | undefined;
      if (frameAspect && !(texture as THREE.CanvasTexture).isCanvasTexture && image?.width && image.height) {
        // object-fit: cover — crop the long side, centred, instead of stretching.
        const imageAspect = image.width / image.height;
        if (imageAspect > frameAspect) {
          texture.repeat.set(frameAspect / imageAspect, 1);
          texture.offset.set((1 - frameAspect / imageAspect) / 2, 0);
        } else {
          texture.repeat.set(1, imageAspect / frameAspect);
          texture.offset.set(0, (1 - imageAspect / frameAspect) / 2);
        }
      }
      material.map = texture;
      material.needsUpdate = true;
    };

    /** The HeroCarousel / StudiosHero composition: a 16:9 screen with a rail of 16:9 thumbnails. */
    const hangThumbs = (room: Room, images: { image?: string; title: string }[], accent: string) => {
      const thumbs = images.slice(0, 4);
      thumbs.forEach((thumb, index) => {
        const y = HANG.screen.y + ((thumbs.length - 1) / 2 - index) * HANG.thumb.gap;
        const frame = new THREE.MeshStandardMaterial({ color: "#1d1915", roughness: 0.45, emissive: accent, emissiveIntensity: 0 });
        const border = new THREE.Mesh(new THREE.BoxGeometry(HANG.thumb.w + 0.08, HANG.thumb.h + 0.08, 0.05), frame);
        border.position.set(HANG.thumb.x, y, 0.025);
        room.wall.add(border);
        room.addHitTarget(border);
        const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.93, 0.93, 0.93), toneMapped: false });
        material.userData.aspect = HANG.thumb.w / HANG.thumb.h;
        const work = new THREE.Mesh(new THREE.PlaneGeometry(HANG.thumb.w, HANG.thumb.h), material);
        work.position.set(HANG.thumb.x, y, 0.054);
        room.wall.add(work);
        loadImage(thumb.image, thumb.title, index, (texture) => apply(material, texture));
        if (room.config.id === this.featuredId) this.thumbFrames.push(frame);
      });
    };

    for (const section of data.rooms) {
      const room = this.rooms.get(section.id)!;
      const [ax, ay] = room.config.art;
      const shape = roomShape(section);
      const { screen } = HANG;

      if (section.kind === "featured") {
        // HeroCarousel — the 16:9 hero on a screen that cycles the heroes, with its thumbnail rail.
        const screenFrame = new THREE.Mesh(new THREE.BoxGeometry(screen.w + 0.3, screen.h + 0.3, 0.14), frameMaterial);
        screenFrame.position.set(screen.x, screen.y, 0.07);
        room.wall.add(screenFrame);
        this.ledWall.mesh.position.set(screen.x, screen.y, 0.145);
        room.wall.add(this.ledWall.mesh);
        room.addHitTarget(this.ledWall.mesh);
        const featured = section.programs.slice(0, 6);
        const slides: { texture: THREE.Texture; aspect: number }[] = [];
        if (!featured.length) this.ledWall.setSlides([{ texture: testCardTexture(font), aspect: 16 / 9 }]);
        featured.forEach((program, index) => {
          loadImage(program.hero, program.title, index, (texture, aspect) => {
            slides[index] = { texture, aspect };
            const ready = slides.filter(Boolean);
            if (ready.length === featured.length || ready.length === 1) this.ledWall.setSlides(ready);
          }, 1920);
        });
        hangThumbs(room, featured.map((program) => ({ image: program.hero, title: program.title })), room.config.accent);
        continue;
      }

      if (shape === "screen") {
        // StudiosHero — the lead story large at 16:9, the rest on the thumbnail rail.
        const [lead, ...rest] = section.items;
        const material = hang(room, screen.x, screen.y, screen.w, screen.h);
        loadImage(lead?.image, lead?.title ?? section.title, 0, (texture) => apply(material, texture), 1920);
        hangThumbs(room, rest, room.config.accent);
        continue;
      }

      if (section.kind === "row") {
        // ContentRow — poster: 16:9 cards (hero art first), vertical: 2:3 posters, wide: 16:9 stills.
        const spec = GRIDS[shape as "poster" | "vertical" | "wide"];
        const portrait = shape === "vertical";
        gridPositions(section.programs.length, spec, ax, ay).forEach(({ x, y }, index) => {
          const program = section.programs[index];
          const material = hang(room, x, y, spec.w, spec.h);
          const image = portrait ? program.poster || program.hero : program.hero || program.poster;
          loadImage(image, program.title, index, (texture) => apply(material, texture), portrait ? 640 : 828);
        });
        continue;
      }

      if (shape === "press") {
        // Press Releases — a card with a square image on the left and printed copy on the right.
        const spec = GRIDS.press;
        gridPositions(section.items.length, spec, ax, ay).forEach(({ x, y }, index) => {
          const item = section.items[index];
          const imageSize = spec.h;
          const copyWidth = spec.w - imageSize;
          const image = hang(room, x - spec.w / 2 + imageSize / 2, y, imageSize, imageSize);
          loadImage(item.image, item.title, index, (texture) => apply(image, texture));
          const copy = hang(room, x + spec.w / 2 - copyWidth / 2, y, copyWidth, imageSize);
          apply(copy, printTexture({ kicker: item.meta ?? "Press release", title: item.title, meta: "Thai PBS Studios", font }));
        });
        continue;
      }

      if (shape === "square") {
        // Market & Events — square covers with the group name centred beneath.
        const spec = GRIDS.square;
        gridPositions(section.items.length, spec, ax, ay).forEach(({ x, y }, index) => {
          const item = section.items[index];
          const material = hang(room, x, y + 0.15, spec.w, spec.h);
          if (item.image) loadImage(item.image, item.title, index, (texture) => apply(material, texture));
          else apply(material, printTexture({ kicker: section.title, title: item.title, meta: "", font }));
          const caption = new THREE.Mesh(
            new THREE.PlaneGeometry(1.9, 0.3),
            new THREE.MeshStandardMaterial({ map: captionTexture(item.title, font), transparent: true, depthWrite: false, roughness: 0.8 }),
          );
          caption.position.set(x, y + 0.15 - spec.h / 2 - 0.28, 0.01);
          room.wall.add(caption);
        });
        continue;
      }

      // BrandTiles (tile), Studios catalog (landscape) and Content Distribution (logo) — 16:9 grids.
      const spec = GRIDS[shape as "tile" | "landscape" | "logo"];
      gridPositions(section.items.length, spec, ax, ay).forEach(({ x, y }, index) => {
        const item = section.items[index];
        const material = hang(room, x, y, spec.w, spec.h);
        if (shape === "logo") apply(material, item.logo ? partnerLogoTexture(item.logo, font) : printTexture({ kicker: section.title, title: item.title, meta: item.meta ?? "", font }));
        else if (item.image) loadImage(item.image, item.title, index, (texture) => apply(material, texture), shape === "tile" ? 640 : 1080);
        else apply(material, printTexture({ kicker: section.title, title: item.title, meta: item.meta ?? "", font }));
      });
    }

    this.loadingManager.onProgress = (_url, loaded, total) => this.options.onLoadProgress(total ? loaded / total : 1);
    this.loadingManager.onLoad = () => this.markReady();
    if (pending === 0) queueMicrotask(() => this.markReady());
    // Never hold the curtain for a slow image.
    window.setTimeout(() => this.markReady(), 9000);
  }

  private async markReady() {
    if (this.ready || this.disposed) return;
    this.ready = true;
    this.options.onLoadProgress(1);
    // Compile every shader before the curtain lifts, without blocking the page (parallel compile
    // where the GPU driver supports it), so the countdown keeps moving and the first frames don't stutter.
    try {
      await this.renderer.compileAsync(this.scene, this.rig.camera);
    } catch {
      this.renderer.compile(this.scene, this.rig.camera);
    }
    if (this.disposed) return;
    await yieldToBrowser();
    if (this.disposed) return;
    // Prime post-processing targets and shaders under the curtain, so the first visible frame is not empty.
    this.rig.update(1 / 60, this.options.reducedMotion);
    this.draw();
    this.checkFrameHealth();
    this.options.onReady();
  }

  private computeTrackPositions() {
    const point = new THREE.Vector3();
    for (const room of this.rooms.values()) {
      const wall = room.wall.getWorldPosition(new THREE.Vector3());
      let best = 0;
      let bestDistance = Infinity;
      for (let i = 0; i <= 200; i += 1) {
        this.rig.track.getPointAt(i / 200, point);
        const distance = point.distanceToSquared(wall);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i / 200;
        }
      }
      room.trackT = best;
    }
  }

  // ————————————————————————————————————————— frame

  private render(dt: number) {
    const { reducedMotion } = this.options;
    this.time += dt;
    const time = this.time;

    if (this.pointerDirty) this.pick();
    this.rig.update(dt, reducedMotion);

    const progress = this.rig.trackProgress;
    let nearest: LotSectionId = this.options.data.rooms[0]?.id ?? "";
    let nearestDistance = Infinity;
    for (const room of this.rooms.values()) {
      const distance = Math.abs(room.trackT - progress);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = room.config.id;
      }
    }

    const highlight = this.focused ?? this.forcedHover ?? this.hovered;
    for (const room of this.rooms.values()) {
      room.setHovered(room.config.id === highlight);
      room.setActive(room.config.id === nearest ? 1 : 0);
      room.update(dt);
    }

    const featuredHover = this.featuredId ? this.rooms.get(this.featuredId)!.hoverAmount : 0;
    // Stay at true colour; hover only nudges it, so the picture never washes out.
    this.ledWall.setBoost(0.95 + featuredHover * 0.08);
    this.ledWall.update(dt, time, reducedMotion);
    this.thumbFrames.forEach((frame, index) => (frame.emissiveIntensity = index === this.ledWall.currentIndex ? 0.9 : 0));
    this.updateTrailer(dt, Boolean(this.featuredId) && highlight === this.featuredId);

    this.atmosphere.update(dt, time, this.rig.velocity, reducedMotion);
    this.exhibits.update(dt, time, this.rig.velocity, reducedMotion);

    if (nearest !== this.lastNearest || Math.abs(progress - this.lastProgressReport) > 0.002) {
      this.lastNearest = nearest;
      this.lastProgressReport = progress;
      this.options.onTravel(progress, nearest);
    }

    this.draw();
    // A one-pixel readback every few seconds is cheap insurance against a black screen.
    this.healthClock += dt;
    if (this.healthClock > 3) {
      this.healthClock = 0;
      this.checkFrameHealth();
    }
  }

  /** Lingering on the featured screen rolls its trailer, muted. */
  private updateTrailer(dt: number, engaged: boolean) {
    const { quality, reducedMotion, data } = this.options;
    if (quality !== "high" || reducedMotion) return;
    this.hoverClock = engaged ? this.hoverClock + dt : 0;
    if (engaged && this.hoverClock > 1.1 && !this.videoState.element) {
      const featured = data.rooms.find((room) => room.id === this.featuredId)?.programs ?? [];
      const program = featured[this.ledWall.currentIndex] ?? featured[0];
      const playable = program?.trailerUrl && (!program.trailerMimeType || /mp4|webm|ogg/.test(program.trailerMimeType));
      if (!playable) return;
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "auto";
      video.src = program.trailerUrl!;
      this.videoState.element = video;
      video.addEventListener(
        "playing",
        () => {
          if (this.videoState.element !== video) return;
          const texture = new THREE.VideoTexture(video);
          texture.colorSpace = THREE.SRGBColorSpace;
          this.videoState.texture = texture;
          this.ledWall.setOverride({ texture, aspect: (video.videoWidth || 16) / (video.videoHeight || 9) });
        },
        { once: true },
      );
      video.play().catch(() => this.stopVideo());
    }
    if (!engaged && this.videoState.element) {
      this.videoState.timer += dt;
      if (this.videoState.timer > 0.6) this.stopVideo();
    } else {
      this.videoState.timer = 0;
    }
  }

  private stopVideo() {
    const { element, texture } = this.videoState;
    if (texture) this.ledWall.setOverride(null);
    if (element) {
      element.pause();
      element.removeAttribute("src");
      element.load();
    }
    // Let the wipe finish before freeing the frame it is wiping away from.
    if (texture) window.setTimeout(() => texture.dispose(), 1400);
    this.videoState.element = null;
    this.videoState.texture = null;
    this.videoState.timer = 0;
  }

  private pick() {
    this.pointerDirty = false;
    let next: LotSectionId | null = null;
    if (!this.rig.isFocused) {
      this.raycaster.setFromCamera(this.pointer, this.rig.camera);
      const hit = this.raycaster.intersectObjects(this.hitTargets, false)[0];
      if (hit && hit.distance < 70) next = hit.object.userData.section as LotSectionId;
    }
    if (next !== this.hovered) {
      this.hovered = next;
      this.options.onHover(next);
    }
  }

  private handleFocusSettled(focused: boolean) {
    if (focused) {
      this.options.onFocusSettled(this.focused);
      return;
    }
    this.options.onFocusSettled(null);
    if (this.pendingFocus) {
      const next = this.pendingFocus;
      this.pendingFocus = null;
      this.focus(next);
    }
  }

  // ————————————————————————————————————————— input

  private size() {
    const parent = this.options.canvas.parentElement;
    return { width: Math.max(1, parent?.clientWidth ?? window.innerWidth), height: Math.max(1, parent?.clientHeight ?? window.innerHeight) };
  }

  private resize() {
    const { width, height } = this.size();
    this.renderer.setSize(width, height, false);
    this.composer?.setSize(width, height);
    this.bloom?.resolution.set(width / 2, height / 2);
    this.hall?.resize(width, height);
    this.rig.resize(width / height);
    // setSize clears the drawing buffer; repaint now instead of showing a black frame.
    if (this.ready) this.draw();
  }

  private draw() {
    if (this.composer) this.composer.render(0);
    else this.renderer.render(this.scene, this.rig.camera);
  }

  /**
   * Safety net: the scene background is opaque, so a pixel with alpha 0 means post-processing
   * produced NaN (which bloom smears across the whole frame). Drop bloom and render directly.
   */
  private checkFrameHealth() {
    if (!this.composer) return;
    const gl = this.renderer.getContext();
    gl.readPixels(gl.drawingBufferWidth >> 1, gl.drawingBufferHeight >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.probe);
    if (this.probe[3] !== 0) return;
    console.warn("Gallery: post-processing produced an empty frame; continuing without bloom.");
    this.composer.dispose();
    this.bloom?.dispose();
    this.composer = undefined;
    this.bloom = undefined;
    this.renderer.setRenderTarget(null);
    this.draw();
  }

  private readonly handlePointerMove = (event: PointerEvent) => {
    const rect = this.options.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.pointer.set(x, y);
    this.pointerDirty = true;
    if (event.pointerType === "mouse") this.rig.setLook(x, y);
  };

  private readonly handlePointerLeave = () => {
    this.pointer.set(9, 9);
    this.pointerDirty = true;
    this.rig.setLook(0, 0);
  };

  private readonly handleClick = () => {
    if (this.hovered && !this.rig.isFocused) this.options.onSelect(this.hovered);
  };

  private readonly handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    this.rig.nudge((event.deltaY * unit) / 2600);
  };

  private readonly handleTouchStart = (event: TouchEvent) => {
    this.touchY = event.touches[0]?.clientY ?? null;
  };

  private readonly handleTouchMove = (event: TouchEvent) => {
    const y = event.touches[0]?.clientY;
    if (y === undefined || this.touchY === null) return;
    event.preventDefault();
    this.rig.nudge((this.touchY - y) / 1400);
    this.touchY = y;
  };

  private readonly handleVisibility = () => {
    if (document.hidden) this.stop();
    else if (this.ready) this.start();
  };

  private bind() {
    const { canvas } = this.options;
    canvas.addEventListener("pointermove", this.handlePointerMove);
    canvas.addEventListener("pointerleave", this.handlePointerLeave);
    canvas.addEventListener("click", this.handleClick);
    canvas.addEventListener("wheel", this.handleWheel, { passive: false });
    canvas.addEventListener("touchstart", this.handleTouchStart, { passive: true });
    canvas.addEventListener("touchmove", this.handleTouchMove, { passive: false });
    document.addEventListener("visibilitychange", this.handleVisibility);
  }

  private unbind() {
    const { canvas } = this.options;
    canvas.removeEventListener("pointermove", this.handlePointerMove);
    canvas.removeEventListener("pointerleave", this.handlePointerLeave);
    canvas.removeEventListener("click", this.handleClick);
    canvas.removeEventListener("wheel", this.handleWheel);
    canvas.removeEventListener("touchstart", this.handleTouchStart);
    canvas.removeEventListener("touchmove", this.handleTouchMove);
    document.removeEventListener("visibilitychange", this.handleVisibility);
  }
}
