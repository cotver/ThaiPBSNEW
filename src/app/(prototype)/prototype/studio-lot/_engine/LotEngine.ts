import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { trailerKind } from "@/lib/trailer-playback";
import type { LotData, LotSectionId } from "../_lib/data";
import { Atmosphere } from "./Atmosphere";
import { Exhibits } from "./Exhibits";
import { CameraRig, FOCUS_FOV } from "./CameraRig";
import { Hall } from "./Hall";
import { LedWall } from "./LedWall";
import { disposeTree } from "./math";
import { Room, type FocusView, type RoomConfig } from "./Room";
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
  /**
   * A room's screen (Featured, ThaiPBS Journal) moved to another slide — an index into that room's
   * programs (featured) or items (journal).
   */
  onScreenChange?: (section: LotSectionId, index: number) => void;
  /** `atRoom`: you are within AT_ROOM_RANGE of the nearest room's approach point (not in the foyer or between rooms). */
  onTravel: (progress: number, nearest: LotSectionId, atRoom: boolean) => void;
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
/**
 * How far before a room (along the walk) it becomes the current room. At ~10m the room is clearly in
 * the forward view; the switch to it then happens about midway from the previous room's anchor.
 */
const APPROACH_LEAD = 10;
/** How close (metres along the walk) to a room's approach point counts as "at" that room. */
const AT_ROOM_RANGE = 4.5;
/**
 * How far the walking camera turns toward an approaching room's work (fraction of the way).
 * 0.12 ≈ a 9–10° glance at the peak — close to the path's own gentle weave (3–6°), just well-timed.
 */
const GAZE_STRENGTH = 0.12;
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
  /**
   * HeroCarousel and StudiosHero: one 16:9 LED screen cycling every slide, as big as the standard
   * 14 × 5.6m wall allows — no rail, no label. Its frame runs from just right of the cut-vinyl title to
   * near the right edge, skirting to just under the top; the ON AIR box moves under the title (RoomConfig.onAir).
   */
  screen: { w: 8.8, h: 4.95, x: 1.9, y: 2.825 },
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
      const { screen } = HANG;
      return { ...base, width: 14, art: [screen.x, screen.y] as [number, number], artWidth: screen.w, onAir: "underTitle" as const };
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
  /** One LED screen per screen room (Featured, ThaiPBS Journal), and the slide each last reported. */
  private readonly screens = new Map<LotSectionId, { wall: LedWall; reported: number }>();
  private readonly raycaster = new THREE.Raycaster();
  private readonly gazePoint = new THREE.Vector3();
  private trackLength = 1;
  private readonly pointer = new THREE.Vector2(9, 9);
  private readonly clock = new THREE.Timer();
  private resizeObserver?: ResizeObserver;
  private loadingManager!: THREE.LoadingManager;
  /** The trailer rolling on a screen room's LED wall (muted; the panel plays it with sound). */
  private readonly videoState: { element: HTMLVideoElement | null; texture: THREE.VideoTexture | null; timer: number; section: LotSectionId | null } = { element: null, texture: null, timer: 0, section: null };
  /**
   * The room panel's own trailer video, mirrored on that room's wall: one element, so the wall and the
   * panel show the same frame at the same time (the panel carries the sound).
   */
  private sharedVideo: { section: LotSectionId; element: HTMLVideoElement; texture: THREE.VideoTexture } | null = null;
  /** Trailers that would not play on the wall (no CORS, bad file): don't retry them every frame. */
  private readonly failedTrailers = new Set<string>();
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
  private lastAtRoom = false;
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
    // Thin enough that the end wall still reads from the foyer (~78% clear), however long the hall is.
    const walkLength = 25 - hallEnd(options.data.rooms.length);
    this.scene.fog = new THREE.FogExp2("#2e2822", Math.min(0.011, 0.5 / walkLength));
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
    await advance();
    // From here on everything is synchronous, so the image loaders' callbacks always find a finished scene.
    this.hangWork();

    this.scene.updateMatrixWorld(true);
    this.computeTrackPositions();
    this.trackLength = this.rig.track.getLength();
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

  /** Put slide `index` on a room's screen (picked in the room panel). */
  showSlide(section: LotSectionId, index: number) {
    const screen = this.screens.get(section);
    if (!screen) return;
    screen.wall.show(index);
    if (section === this.videoState.section) this.stopVideo();
  }

  /** Hold a room's screen on its current slide while that slide's trailer plays in the panel. */
  /**
   * Mirror the panel's playing trailer on a room's wall, in place of the wall's own muted copy — or, with
   * null, hand the wall back to its slides.
   */
  shareVideo(section: LotSectionId, video: HTMLVideoElement | null) {
    const shared = this.sharedVideo;
    if (shared?.element === video && shared?.section === section) return;
    if (shared && (video || shared.section === section)) {
      this.sharedVideo = null;
      this.screens.get(shared.section)?.wall.setOverride(null);
      // Let the wipe back to the art finish before freeing the frame it wipes away from.
      window.setTimeout(() => shared.texture.dispose(), 1400);
    }
    const wall = this.screens.get(section)?.wall;
    if (!video || !wall) return;
    this.stopVideo();
    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.sharedVideo = { section, element: video, texture };
    wall.setOverride({ texture, aspect: (video.videoWidth || 16) / (video.videoHeight || 9) });
  }

  holdScreen(section: LotSectionId, held: boolean) {
    this.screens.get(section)?.wall.setHeld(held);
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
    const pose = room.focusPose({ position: new THREE.Vector3(), target: new THREE.Vector3() }, this.focusView());
    this.rig.focus(pose, room.trackT, this.options.reducedMotion);
  }

  /**
   * The screen area the room panel leaves free, so a focused room can be framed inside it.
   * Mirrors the panel and header sizes in experience.module.css / studio-lot.module.css.
   */
  private focusView(): FocusView {
    const { width: W, height: H } = this.size();
    const gutter = THREE.MathUtils.clamp(W * 0.03, 16, 40);
    const headerHeight = W <= 860 ? 104 : 64;
    let x0: number;
    let x1: number;
    let y0: number;
    let y1: number;
    if (W > 760) {
      // Desktop: the panel is a column on the right.
      const panelWidth = Math.min(620, W - 2 * gutter);
      x0 = gutter;
      x1 = W - gutter - panelWidth - gutter;
      y0 = headerHeight + 12;
      y1 = H - THREE.MathUtils.clamp(H * 0.03, 16, 32);
    } else {
      // Phones: the panel is a sheet along the bottom; frame the room above it.
      const panelHeight = Math.min(H * 0.78, 680);
      x0 = 12;
      x1 = W - 12;
      y0 = headerHeight + 8;
      y1 = H - THREE.MathUtils.clamp(H * 0.03, 16, 32) - panelHeight - 12;
      if ((y1 - y0) / H < 0.18) y1 = H - 16; // too little room above the sheet: frame the full screen
    }
    return {
      fov: FOCUS_FOV,
      aspect: W / H,
      zoom: this.rig.camera.zoom,
      usableX: Math.max(0.2, (x1 - x0) / W),
      usableY: Math.max(0.2, (y1 - y0) / H),
      centerX: (x0 + x1) / W - 1, // midpoint in NDC
      centerY: 1 - (y0 + y1) / H,
    };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    if (this.built) this.unbind();
    this.resizeObserver?.disconnect();
    this.stopVideo();
    this.sharedVideo?.texture.dispose();
    this.sharedVideo = null;
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

    /** HeroCarousel / StudiosHero: one framed LED screen on the wall, cycling `slides` in /home order. */
    const hangScreen = (room: Room, slides: { image?: string; title: string }[]) => {
      const { screen } = HANG;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(screen.w + 0.3, screen.h + 0.3, 0.14), frameMaterial);
      frame.position.set(screen.x, screen.y, 0.07);
      room.wall.add(frame);
      const wall = new LedWall(screen.w, screen.h);
      wall.mesh.position.set(screen.x, screen.y, 0.145);
      room.wall.add(wall.mesh);
      room.addHitTarget(wall.mesh);
      this.screens.set(room.config.id, { wall, reported: -1 });
      if (!slides.length) return wall.setSlides([{ texture: testCardTexture(font), aspect: 16 / 9 }]);
      wall.setSlides(new Array(slides.length));
      slides.forEach((slide, index) => loadImage(slide.image, slide.title, index, (texture, aspect) => wall.setSlide(index, { texture, aspect }), 1920));
    };

    for (const section of data.rooms) {
      const room = this.rooms.get(section.id)!;
      const [ax, ay] = room.config.art;
      const shape = roomShape(section);

      if (section.kind === "featured") {
        // HeroCarousel — every featured programme's hero, in /home order.
        hangScreen(room, section.programs.map((program) => ({ image: program.hero, title: program.title })));
        continue;
      }

      if (shape === "screen") {
        // StudiosHero (ThaiPBS Journal) — every story's cover, in /home order.
        hangScreen(room, section.items);
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

  /**
   * Each room's place on the walk. The camera looks ahead down the hall, so a room is "in view" well
   * before you are level with it: anchor it APPROACH_LEAD metres earlier on the path (toward the
   * entrance, +z). The current room, the top-bar highlight and "walk to" all use this anchor.
   */
  /**
   * Turn the walking camera toward the room you are approaching. The pull peaks at the room's anchor
   * (APPROACH_LEAD metres before it, while it is ahead of you) and falls to zero halfway to the next
   * anchor — so the look leads into each room early and hands over to the next one without a jump.
   */
  private updateGaze() {
    const progress = this.rig.trackProgress;
    let closest: Room | undefined;
    let closestDistance = Infinity;
    for (const room of this.rooms.values()) {
      const distance = Math.abs(room.trackT - progress);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = room;
      }
    }
    if (!closest) return this.rig.setGaze(null, 0);
    const halfSpacing = (ROOM_SPACING / 2) / Math.max(1, this.trackLength);
    const t = THREE.MathUtils.clamp(1 - closestDistance / halfSpacing, 0, 1);
    const weight = t * t * (3 - 2 * t) * GAZE_STRENGTH; // smoothstep
    const [artX, artY] = closest.config.art;
    this.rig.setGaze(closest.wall.localToWorld(this.gazePoint.set(artX, artY, 0)), weight);
  }

  private computeTrackPositions() {
    const point = new THREE.Vector3();
    for (const room of this.rooms.values()) {
      const wall = room.wall.getWorldPosition(new THREE.Vector3());
      const anchor = new THREE.Vector3(0, wall.y, wall.z + APPROACH_LEAD);
      let best = 0;
      let bestDistance = Infinity;
      for (let i = 0; i <= 400; i += 1) {
        this.rig.track.getPointAt(i / 400, point);
        const distance = (point.x - anchor.x) ** 2 + (point.z - anchor.z) ** 2;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i / 400;
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
    this.updateGaze();
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

    for (const [section, screen] of this.screens) {
      // Stay at true colour; hover only nudges it, so the picture never washes out.
      screen.wall.setBoost(0.95 + (this.rooms.get(section)?.hoverAmount ?? 0) * 0.08);
      screen.wall.update(dt, time, reducedMotion);
      if (screen.wall.currentIndex !== screen.reported) {
        screen.reported = screen.wall.currentIndex;
        this.options.onScreenChange?.(section, screen.reported);
      }
    }
    this.updateTrailer(dt, highlight && this.screens.has(highlight) ? highlight : null);

    this.atmosphere.update(dt, time, this.rig.velocity, reducedMotion);
    this.exhibits.update(dt, time, this.rig.velocity, reducedMotion);

    const atRoom = nearestDistance * this.trackLength <= AT_ROOM_RANGE;
    if (nearest !== this.lastNearest || atRoom !== this.lastAtRoom || Math.abs(progress - this.lastProgressReport) > 0.002) {
      this.lastNearest = nearest;
      this.lastAtRoom = atRoom;
      this.lastProgressReport = progress;
      this.options.onTravel(progress, nearest, atRoom);
    }

    this.draw();
    // A one-pixel readback every few seconds is cheap insurance against a black screen.
    this.healthClock += dt;
    if (this.healthClock > 3) {
      this.healthClock = 0;
      this.checkFrameHealth();
    }
  }

  /**
   * The trailer on a screen room's current slide, if the LED wall can show it: video files only, as
   * /home's HeroCarousel plays them. A YouTube embed or a GIF can't be drawn into the 3D scene, so those
   * play in the room panel and the wall keeps the slide's art.
   */
  private screenTrailer(section: LotSectionId, index: number) {
    const room = this.options.data.rooms.find((item) => item.id === section);
    if (!room) return null;
    if (room.kind === "featured") {
      const program = room.programs[index];
      return program?.trailerUrl && trailerKind(program.trailerUrl, program.trailerMimeType) === "video" ? program.trailerUrl : null;
    }
    // StudiosHero plays a story's video as a direct video, whatever its URL.
    const video = room.items[index]?.video;
    return video && trailerKind(video.url, video.mimeType, true) === "video" ? video.url : null;
  }

  /** Lingering on a screen room (Featured, ThaiPBS Journal) rolls its slide's trailer on the wall, muted. */
  private updateTrailer(dt: number, engaged: LotSectionId | null) {
    const { quality, reducedMotion } = this.options;
    // The panel's trailer is already on the wall; don't start a second copy.
    if (quality !== "high" || reducedMotion || this.sharedVideo) return;
    // Looking at another screen: let the old one go first.
    if (engaged && this.videoState.section && engaged !== this.videoState.section) this.stopVideo();
    this.hoverClock = engaged ? this.hoverClock + dt : 0;
    const wall = engaged ? this.screens.get(engaged)?.wall : undefined;
    if (engaged && wall && this.hoverClock > 1.1 && !this.videoState.element) {
      const url = this.screenTrailer(engaged, wall.currentIndex);
      if (!url || this.failedTrailers.has(url)) return;
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "auto";
      video.src = url;
      this.videoState.element = video;
      this.videoState.section = engaged;
      video.addEventListener("error", () => {
        this.failedTrailers.add(url);
        if (this.videoState.element === video) this.stopVideo();
      });
      video.addEventListener(
        "playing",
        () => {
          if (this.videoState.element !== video) return;
          const texture = new THREE.VideoTexture(video);
          texture.colorSpace = THREE.SRGBColorSpace;
          this.videoState.texture = texture;
          wall.setOverride({ texture, aspect: (video.videoWidth || 16) / (video.videoHeight || 9) });
        },
        { once: true },
      );
      video.play().catch(() => {
        this.failedTrailers.add(url);
        if (this.videoState.element === video) this.stopVideo();
      });
    }
    if (!engaged && this.videoState.element) {
      this.videoState.timer += dt;
      if (this.videoState.timer > 0.6) this.stopVideo();
    } else {
      this.videoState.timer = 0;
    }
  }

  private stopVideo() {
    const { element, texture, section } = this.videoState;
    if (texture && section) this.screens.get(section)?.wall.setOverride(null);
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
    this.videoState.section = null;
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
    // Keep a focused room framed inside the panel's free area at the new size.
    const room = this.focused ? this.rooms.get(this.focused) : undefined;
    if (room) this.rig.retarget(room.focusPose({ position: new THREE.Vector3(), target: new THREE.Vector3() }, this.focusView()));
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
