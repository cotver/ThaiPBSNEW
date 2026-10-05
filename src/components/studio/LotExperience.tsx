"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { LotEngine, LotQuality } from "@/lib/studio/engine/LotEngine";
import type { LotData, LotSectionId } from "@/lib/studio/data";
import { cue } from "@/lib/studio/sound";
import styles from "@/components/studio/experience.module.css";
import { ListWalk } from "./ListWalk";
import { setCursorLabel } from "./LotCursor";
import { walkSlotId } from "./LotHeader";
import { LotLoader, RouteLeader } from "./LotLoader";
import { LotPanel } from "./LotPanel";
import { WalkNav } from "./WalkNav";

type Mode = "detecting" | "lot" | "sheet";
type Phase = "loading" | "reveal" | "live";
type Capabilities = { webgl: boolean; quality: LotQuality; reducedMotion: boolean; compact: boolean };


function detectCapabilities(): Capabilities {
  let webgl = false;
  try {
    const probe = document.createElement("canvas").getContext("webgl2");
    webgl = Boolean(probe);
    // Browsers cap live contexts; hand the probe's back immediately.
    probe?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webgl = false;
  }
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const compact = window.innerWidth < 768;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  const quality: LotQuality = !coarse && !compact && memory >= 4 && cores >= 6 ? "high" : "low";
  return { webgl, quality, compact: compact && coarse, reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches };
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialStage = searchParams.get("stage") as LotSectionId | null;
  const wantsList = searchParams.get("view") === "list";

  const capabilities = useSyncExternalStore(noSubscription, readCapabilities, noCapabilities);
  // The header (from the layout) owns the slot; the gallery fills it with the walk controls.
  const walkSlot = useSyncExternalStore(noSubscription, readWalkSlot, noWalkSlot);
  const [override, setOverride] = useState<"lot" | "sheet" | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [loadProgress, setLoadProgress] = useState(0);
  const [hovered, setHovered] = useState<LotSectionId | null>(null);
  const [selected, setSelected] = useState<LotSectionId | null>(null);
  const [panel, setPanel] = useState<LotSectionId | null>(null);
  const [nearest, setNearest] = useState<LotSectionId>(data.rooms[0]?.id ?? "");
  const [atRoom, setAtRoom] = useState(false);
  /** Which slide each room's hall screen is showing (Featured, ThaiPBS Journal); its panel follows and steers it. */
  const [screenSlides, setScreenSlides] = useState<Record<LotSectionId, number>>({});
  const [failed, setFailed] = useState(false);
  const mode: Mode = !capabilities ? "detecting" : failed ? "sheet" : override ?? (!capabilities.webgl || capabilities.compact || wantsList ? "sheet" : "lot");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<LotEngine | null>(null);
  const reelFillRef = useRef<HTMLSpanElement>(null);
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
    setLoadProgress(0.04);

    (async () => {
      try {
        const [{ LotEngine: Engine }] = await Promise.all([
          import("@/lib/studio/engine/LotEngine"),
          document.fonts.load(`700 64px ${fontFamily}`).catch(() => undefined),
        ]);
        if (cancelled) return;
        setLoadProgress(0.22);
        const building = new Engine({
          canvas,
          data,
          font: fontFamily,
          quality: capabilities.quality,
          reducedMotion: capabilities.reducedMotion,
          // Countdown: code + fonts 0–22%, building the scene 22–50%, artwork 50–100%.
          onBuildProgress: (ratio) => setLoadProgress((value) => Math.max(value, 0.22 + ratio * 0.28)),
          onLoadProgress: (ratio) => setLoadProgress((value) => Math.max(value, 0.5 + ratio * 0.5)),
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
    window.history.replaceState(null, "", `${pathname}?view=list`);
  };

  const enterLot = () => {
    cue("open");
    setFailed(false);
    setOverride("lot");
    window.history.replaceState(null, "", `${pathname}?view=studio`);
  };

  if (mode === "sheet" || mode === "detecting") {
    return (
      <>
        {/* Until the device is known, keep the same leader the server showed instead of flashing the sheet. */}
        {mode === "detecting" ? <RouteLeader /> : null}
        <div className={styles.homeList} ref={listRef}>
          {listView}
        </div>
        {walkSlot && mode === "sheet" ? createPortal(<ListWalk rooms={data.rooms} rootRef={listRef} />, walkSlot) : null}
        {failed ? <p className={styles.listNotice}>The 3D gallery could not start on this device, so here is the home page.</p> : null}
        {capabilities?.webgl && !failed ? (
          <button className={styles.walkButton} data-cursor="Walk the gallery in 3D" onClick={enterLot} type="button">
            Walk the gallery in 3D
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
          <span>Click a room to step in</span>
          <span>1–{Math.min(9, data.rooms.length)} · Esc</span>
        </div>

        <button className={styles.listToggle} data-cursor="Switch to list view" onClick={switchToSheet} type="button">
          List view
        </button>
      </div>

      {/* Shown once the gallery is open — not over the loading countdown. */}
      {walkSlot && phase !== "loading" ? createPortal(walk, walkSlot) : null}
      {panel ? <LotPanel data={data} onClose={close} onSelect={select} screen={{ active: screenSlides[panel] ?? 0, onActiveChange: (index) => showSlide(panel, index), onHold: (held) => engineRef.current?.holdScreen(panel, held), onVideo: (video) => engineRef.current?.shareVideo(panel, video) }} section={panel} /> : null}
      {selected && !panel ? <div aria-live="polite" className={styles.srOnly}>Moving to {data.rooms.find((room) => room.id === selected)?.title}</div> : null}

      <LotLoader phase={phase} progress={loadProgress} reducedMotion={Boolean(capabilities?.reducedMotion)} />
    </section>
  );
}
