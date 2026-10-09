"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { EnvironmentState, LotEngine, LotQuality, TimeOfDay, Weather } from "@/lib/studio/engine/LotEngine";
import { lotGalleryHref, lotListHref, type LotData, type LotSectionId } from "@/lib/studio/data";
import { cue } from "@/lib/studio/sound";
import styles from "@/components/studio/experience.module.css";
import { ListWalk } from "./ListWalk";
import { setCursorLabel } from "./LotCursor";
import { walkSlotId } from "./LotHeader";
import { LotPanel } from "./LotPanel";
import { WalkNav } from "./WalkNav";
import { SoundControl } from "./SoundControl";
import { TimeButton } from "./TimeButton";
import { WeatherButton } from "./WeatherButton";
import { QualityButton } from "./QualityButton";
import { QUALITY_PICKER_ENABLED, readQualityChoice, type DeviceInfo, type QualityChoice } from "@/lib/studio/quality";
import SiteLoading from "@/app/(site)/loading";

type Mode = "detecting" | "lot" | "sheet";
type Phase = "loading" | "reveal" | "live";
/** `quality` is what the engine builds: the visitor's choice, or `detectedQuality` on Auto (QualityButton). */
type Capabilities = { webgl: boolean; quality: LotQuality; detectedQuality: LotQuality; qualityChoice: QualityChoice; device: DeviceInfo; reducedMotion: boolean; compact: boolean };


/**
 * Graphics drawn in software (no GPU, or a blocklisted driver): the 3D walk would crawl, so these get the
 * list view instead. Names as browsers report them (WEBGL_debug_renderer_info, or ANGLE's wrapper of it).
 */
const SOFTWARE_GPU = /swiftshader|llvmpipe|softpipe|lavapipe|microsoft basic render|software/i;
/**
 * Integrated graphics — the usual weak link on a low-spec PC, which often still has plenty of cores and
 * memory: Intel HD/UHD/Iris (not Arc), AMD's "Radeon Graphics"/Vega APUs, and phone/tablet GPUs.
 */
const INTEGRATED_GPU = /intel(?!.*\barc\b)|radeon\(tm\) graphics|radeon graphics|vega \d+ graphics|mali|adreno|powervr/i;

function detectCapabilities(): Capabilities {
  let webgl = false;
  let gpu = "";
  try {
    const probe = document.createElement("canvas").getContext("webgl2");
    if (probe) {
      const info = probe.getExtension("WEBGL_debug_renderer_info");
      gpu = String(probe.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : probe.RENDERER) ?? "");
    }
    webgl = Boolean(probe) && !SOFTWARE_GPU.test(gpu);
    // Browsers cap live contexts; hand the probe's back immediately.
    probe?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webgl = false;
  }
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const compact = window.innerWidth < 768;
  // Not every browser reports these (Firefox and Safari have no deviceMemory); unknown counts as capable.
  const reportedMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null;
  const reportedCores = navigator.hardwareConcurrency || null;
  const memory = reportedMemory ?? 8;
  const cores = reportedCores ?? 8;
  // High only on a capable desktop with a dedicated (or Apple) GPU; LotEngine also steps down on its own
  // if the frame rate drops, so a machine that slips through still ends up smooth.
  const detectedQuality: LotQuality =
    // A 2-core or 2 GB machine (deviceMemory is rounded down: 2 means under 4 GB): the very low tier.
    cores <= 2 || memory <= 2 ? "verylow" : !coarse && !compact && memory >= 4 && cores >= 6 && !INTEGRATED_GPU.test(gpu) ? "high" : "low";
  const qualityChoice = readQualityChoice();
  return {
    webgl,
    quality: qualityChoice === "auto" ? detectedQuality : qualityChoice,
    detectedQuality,
    qualityChoice,
    device: { cores: reportedCores, memory: reportedMemory, gpu: gpu.replace(/^ANGLE \((.*)\)$/, "$1") },
    compact: compact && coarse,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
}

// Device capabilities never change during a visit; detect once and serve a stable snapshot.
let cachedCapabilities: Capabilities | null = null;
const readCapabilities = () => (cachedCapabilities ??= detectCapabilities());
const noCapabilities = () => null;
const noSubscription = () => () => {};

const noWalkSlot = () => null;
const readWalkSlot = () => document.getElementById(walkSlotId);

/** `listView` is the real /home page (server-rendered), shown in list view and as the fallback. */
export function LotExperience({ data, fontFamily, listView }: { data: LotData; fontFamily: string; listView: ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initialStage = searchParams.get("stage") as LotSectionId | null;
  // The view comes from the URL only while it is the gallery's own: a page opened over it as a modal
  // (/title/…, /article/…) has no ?view=list, and reading that would swap the list for the 3D walk.
  const urlWantsList = searchParams.get("view") === "list";
  const [wantsList, setWantsList] = useState(urlWantsList);
  if (pathname === lotGalleryHref && urlWantsList !== wantsList) setWantsList(urlWantsList);

  const capabilities = useSyncExternalStore(noSubscription, readCapabilities, noCapabilities);
  // The header (from the layout) owns the slot; the gallery fills it with the walk controls.
  const walkSlot = useSyncExternalStore(noSubscription, readWalkSlot, noWalkSlot);
  const [override, setOverride] = useState<"lot" | "sheet" | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [hovered, setHovered] = useState<LotSectionId | null>(null);
  const [selected, setSelected] = useState<LotSectionId | null>(null);
  const [panel, setPanel] = useState<LotSectionId | null>(null);
  const [nearest, setNearest] = useState<LotSectionId>(data.rooms[0]?.id ?? "");
  const [atRoom, setAtRoom] = useState(false);
  /** Which slide each room's hall screen is showing (Featured, ThaiPBS Journal); its panel follows and steers it. */
  const [screenSlides, setScreenSlides] = useState<Record<LotSectionId, number>>({});
  const [failed, setFailed] = useState(false);
  /** The weather and light outside the glass, for the weather button. */
  const [outdoors, setOutdoors] = useState<EnvironmentState | null>(null);
  const mode: Mode = !capabilities ? "detecting" : failed ? "sheet" : override ?? (!capabilities.webgl || capabilities.compact || wantsList ? "sheet" : "lot");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<LotEngine | null>(null);
  const reelFillRef = useRef<HTMLSpanElement>(null);
  const fpsRef = useRef<HTMLSpanElement>(null);
  const markerRefs = useRef(new Map<LotSectionId, HTMLButtonElement>());
  const selectedRef = useRef<LotSectionId | null>(null);
  const pendingStage = useRef<LotSectionId | null>(initialStage && data.rooms.some((room) => room.id === initialStage) ? initialStage : null);

  const select = useCallback((section: LotSectionId) => {
    const engine = engineRef.current;
    if (!engine) return;
    cue("select");
    selectedRef.current = section;
    setSelected(section);
    setPanel(null);
    setCursorLabel(null);
    engine.focus(section);
  }, []);

  const showSlide = useCallback((section: LotSectionId, index: number) => {
    setScreenSlides((slides) => ({ ...slides, [section]: index }));
    engineRef.current?.showSlide(section, index);
  }, []);

  const close = useCallback(() => {
    const engine = engineRef.current;
    const previous = selectedRef.current;
    if (!engine || !previous) return;
    cue("back");
    selectedRef.current = null;
    setSelected(null);
    setPanel(null);
    engine.focus(null);
    markerRefs.current.get(previous)?.focus({ preventScroll: true });
  }, []);

  // Build the engine only when the lot is actually shown; three.js is code-split.
  useEffect(() => {
    if (mode !== "lot" || !capabilities || !canvasRef.current) return;
    let cancelled = false;
    let engine: LotEngine | null = null;
    const canvas = canvasRef.current;
    setPhase("loading");

    (async () => {
      try {
        const [{ LotEngine: Engine }] = await Promise.all([
          import("@/lib/studio/engine/LotEngine"),
          document.fonts.load(`700 64px ${fontFamily}`).catch(() => undefined),
          // The portal sign's "Studio" is set in the regular weight.
          document.fonts.load(`400 64px ${fontFamily}`).catch(() => undefined),
        ]);
        if (cancelled) return;
        const building = new Engine({
          canvas,
          data,
          font: fontFamily,
          quality: capabilities.quality,
          reducedMotion: capabilities.reducedMotion,
          onLoadProgress: () => {},
          onReady: () => setPhase((value) => (value === "loading" ? "reveal" : value)),
          onHover: (section) => {
            setHovered(section);
            if (section) {
              cue("hover");
              const room = data.rooms.find((item) => item.id === section);
              setCursorLabel(room ? `Step into ${room.title}` : null);
            } else {
              setCursorLabel(null);
            }
          },
          onSelect: (section) => select(section),
          onFocusSettled: (section) => {
            if (section && section === selectedRef.current) {
              cue("open");
              setPanel(section);
            }
          },
          onScreenChange: (section, index) => setScreenSlides((slides) => ({ ...slides, [section]: index })),
          onEnvironmentChange: setOutdoors,
          onFps: (fps) => {
            if (fpsRef.current) fpsRef.current.textContent = `${fps} FPS`;
          },
          onTravel: (progress, near, atRoom) => {
            setNearest(near);
            setAtRoom(atRoom);
            if (reelFillRef.current) reelFillRef.current.style.transform = `scaleX(${progress})`;
          },
        });
        // Keep the handles before awaiting: leaving mid-build can still dispose it, and "ready" (which can
        // arrive right as init finishes) always finds the engine. Nothing interacts with it until the reveal.
        engine = building;
        engineRef.current = building;
        await building.init();
        setOutdoors(building.environmentState);
      } catch (error) {
        if (cancelled) return; // disposed on purpose while building
        engineRef.current = null;
        console.warn("Studio Lot: falling back to the call sheet", error);
        setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      engine?.dispose();
      engineRef.current = null;
      setCursorLabel(null);
    };
  }, [mode, capabilities, data, fontFamily, select]);

  // A page opened over the gallery (@lotModal: a programme, an article, search…) changes the URL away from the
  // one the gallery was loaded on and covers the whole window, so stop drawing the 3D walk until it closes.
  const [galleryPath] = useState(pathname);
  const covered = pathname !== galleryPath;
  useEffect(() => {
    if (phase === "loading") return;
    engineRef.current?.setPaused(covered);
  }, [covered, phase]);

  // Curtain: start rendering under the gate, then hand over to the viewer.
  useEffect(() => {
    if (phase !== "reveal") return;
    const engine = engineRef.current;
    // The walk rests at the very start of the track, so there's nothing behind it to scroll back to.
    engine?.start();
    const timer = window.setTimeout(() => {
      setPhase("live");
      const stage = pendingStage.current;
      pendingStage.current = null;
      if (stage) select(stage);
    }, capabilities?.reducedMotion ? 200 : 1500);
    return () => window.clearTimeout(timer);
  }, [phase, capabilities, select]);

  useEffect(() => {
    if (mode !== "lot" || phase !== "live") return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      // A Studio Lot page is open over the gallery; its keys are its own.
      if (document.querySelector("[aria-modal='true']")) return;
      const engine = engineRef.current;
      if (!engine) return;
      if (event.key === "Escape") {
        if (document.fullscreenElement) return;
        close();
        return;
      }
      if (selectedRef.current) return;
      if (["ArrowDown", "PageDown", "s", "S"].includes(event.key)) {
        event.preventDefault();
        engine.nudge(0.06);
        cue("tick");
      } else if (["ArrowUp", "PageUp", "w", "W"].includes(event.key)) {
        event.preventDefault();
        engine.nudge(-0.06);
        cue("tick");
      } else if (/^[1-9]$/.test(event.key)) {
        const room = data.rooms[Number(event.key) - 1];
        if (room) select(room.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, phase, close, select, data.rooms]);

  // List view: the header floats over the home page's hero (see .header in studio-lot.module.css).
  useEffect(() => {
    if (mode !== "sheet") return;
    const root = document.documentElement;
    root.dataset.lotList = "";
    return () => {
      delete root.dataset.lotList;
    };
  }, [mode]);

  // The lot owns the viewport; stop the document behind it from scrolling.
  useEffect(() => {
    if (mode !== "lot") return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [mode]);

  const switchToSheet = () => {
    cue("back");
    setOverride("sheet");
    // History API, not router.replace: no server round trip, so no blank frame.
    window.history.replaceState(null, "", lotListHref);
  };

  const enterLot = () => {
    cue("open");
    setFailed(false);
    setOverride("lot");
    window.history.replaceState(null, "", lotGalleryHref);
  };

  if (mode === "sheet" || mode === "detecting") {
    return (
      <>
        {/* Until the device is known, show the site's loading screen rather than flashing the list. */}
        {mode === "detecting" ? <div className={styles.siteLoader}><SiteLoading /></div> : null}
        {/*
          Mounted only once it shows: the home page's motion (CinematicMotion) measures each row when it mounts
          to decide which ones reveal on scroll, and a hidden list measures as all on screen, so none would.
        */}
        {mode === "sheet" ? (
          <div className={styles.homeList} ref={listRef}>
            {listView}
          </div>
        ) : null}
        {walkSlot && mode === "sheet" ? createPortal(<ListWalk rooms={data.listRooms} rootRef={listRef} />, walkSlot) : null}
        {failed ? <p className={styles.listNotice}>The 3D gallery could not start on this device, so here is the home page.</p> : null}
        {capabilities?.webgl && !failed ? (
          <button aria-label="Walk the gallery in 3D" className={`${styles.roundButton} ${styles.walkButton}`} data-cursor="Walk the gallery in 3D" onClick={enterLot} title="Walk the gallery in 3D" type="button">
            3D
          </button>
        ) : null}
      </>
    );
  }

  const hoveredIndex = data.rooms.findIndex((room) => room.id === (hovered ?? nearest));
  const hoveredRoom = data.rooms[hoveredIndex];
  const highlight = selected ?? hovered;

  const walk = (
    <WalkNav
      active={highlight}
      current={selected}
      cursorVerb="Step into"
      fillRef={reelFillRef}
      markerRef={(id, element) => {
        if (element) markerRefs.current.set(id, element);
        else markerRefs.current.delete(id);
      }}
      near={nearest}
      onBlurRoom={() => engineRef.current?.setForcedHover(null)}
      onFocusRoom={(id) => {
        engineRef.current?.setForcedHover(id);
        if (!selectedRef.current) engineRef.current?.travelTo(id);
      }}
      onHoverRoom={(id) => engineRef.current?.setForcedHover(id)}
      onSelect={select}
      rooms={data.rooms}
    />
  );

  return (
    <section aria-label="Thai PBS Studio Lot" className={styles.stage} data-phase={phase} data-focused={selected ? "" : undefined}>
      <h1 className={styles.srOnly}>Thai PBS gallery — every section of the home page, hung room by room</h1>
      <canvas aria-hidden="true" className={styles.canvas} ref={canvasRef} />
      <div aria-hidden="true" className={styles.vignette} />
      <div aria-hidden="true" className={styles.vignetteFocus} />
      <div aria-hidden="true" className={styles.grain} />

      {/* Only while you are at a room (or pointing at one) — not in the foyer or between rooms. */}
      <div aria-hidden={selected || !(hovered || atRoom) ? true : undefined} className={styles.caption} data-hidden={hovered || atRoom ? undefined : ""}>
        <p className={styles.captionKicker}>
          <span className={styles.rec} /> Now viewing
        </p>
        <p className={styles.captionTitle}>{hoveredRoom?.title}</p>
        <p className={styles.captionThai}>{hoveredRoom?.thai}</p>
        <p className={styles.captionBlurb}>{hoveredRoom?.blurb}</p>
      </div>

      <div className={styles.hud}>
        <div className={styles.hint} aria-hidden={selected ? true : undefined}>
          <span>Scroll to walk</span>
          <span>Move the mouse to look around</span>
          <span>Click a room to step in</span>
          {/* Frames per second this device is drawing, written straight in by onFps (no re-render). */}
          <span ref={fpsRef}>— FPS</span>
        </div>

        <SoundControl />
        {outdoors ? <TimeButton onChange={(time: TimeOfDay | "auto") => engineRef.current?.setTime(time)} state={outdoors} /> : null}
        {outdoors ? <WeatherButton onChange={(weather: Weather | "auto") => engineRef.current?.setWeather(weather)} state={outdoors} /> : null}

        {QUALITY_PICKER_ENABLED && capabilities ? (
          <QualityButton choice={capabilities.qualityChoice} current={capabilities.quality} detected={capabilities.detectedQuality} device={capabilities.device} />
        ) : null}

        <button aria-label="Switch to the list view" className={`${styles.roundButton} ${styles.listToggle}`} data-cursor="Switch to 2D" onClick={switchToSheet} title="Switch to the list view" type="button">
          2D
        </button>
      </div>

      {/* Shown once the gallery is open — not over the loading countdown. */}
      {walkSlot && phase !== "loading" ? createPortal(walk, walkSlot) : null}
      {panel ? <LotPanel data={data} onClose={close} onSelect={select} screen={{ active: screenSlides[panel] ?? 0, onActiveChange: (index) => showSlide(panel, index), onHold: (held) => engineRef.current?.holdScreen(panel, held), onVideo: (video) => engineRef.current?.shareVideo(panel, video) }} section={panel} /> : null}
      {selected && !panel ? <div aria-live="polite" className={styles.srOnly}>Moving to {data.rooms.find((room) => room.id === selected)?.title}</div> : null}
      {/* Lifts during the reveal, so the gallery fades up from under it. */}
      {phase !== "live" ? (
        <div className={styles.siteLoader} data-phase={phase} data-reduced={capabilities?.reducedMotion || undefined}>
          <SiteLoading />
        </div>
      ) : null}
    </section>
  );
}
