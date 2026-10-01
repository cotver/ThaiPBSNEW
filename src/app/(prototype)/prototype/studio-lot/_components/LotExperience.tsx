"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { LotEngine, LotQuality } from "../_engine/LotEngine";
import { roomNumber, type LotData, type LotSectionId } from "../_lib/data";
import { cue } from "../_lib/sound";
import styles from "../experience.module.css";
import { CallSheet } from "./CallSheet";
import { setCursorLabel } from "./LotCursor";
import { LotLoader, RouteLeader } from "./LotLoader";
import { LotPanel } from "./LotPanel";

type Mode = "detecting" | "lot" | "sheet";
type Phase = "loading" | "reveal" | "live";
type Capabilities = { webgl: boolean; quality: LotQuality; reducedMotion: boolean; compact: boolean };

const REEL_SECONDS = 180;

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

function timecode(progress: number) {
  const total = progress * REEL_SECONDS;
  const pad = (value: number) => String(Math.floor(value)).padStart(2, "0");
  return `00:${pad(total / 60)}:${pad(total % 60)}:${pad((total % 1) * 25)}`;
}

export function LotExperience({ data, fontFamily }: { data: LotData; fontFamily: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialStage = searchParams.get("stage") as LotSectionId | null;
  const wantsList = searchParams.get("view") === "list";

  const capabilities = useSyncExternalStore(noSubscription, readCapabilities, noCapabilities);
  const [override, setOverride] = useState<"lot" | "sheet" | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [loadProgress, setLoadProgress] = useState(0);
  const [hovered, setHovered] = useState<LotSectionId | null>(null);
  const [selected, setSelected] = useState<LotSectionId | null>(null);
  const [panel, setPanel] = useState<LotSectionId | null>(null);
  const [nearest, setNearest] = useState<LotSectionId>(data.rooms[0]?.id ?? "");
  const [failed, setFailed] = useState(false);
  const mode: Mode = !capabilities ? "detecting" : failed ? "sheet" : override ?? (!capabilities.webgl || capabilities.compact || wantsList ? "sheet" : "lot");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<LotEngine | null>(null);
  const reelFillRef = useRef<HTMLSpanElement>(null);
  const timecodeRef = useRef<HTMLSpanElement>(null);
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
          import("../_engine/LotEngine"),
          document.fonts.load(`700 64px ${fontFamily}`).catch(() => undefined),
        ]);
        if (cancelled) return;
        setLoadProgress(0.22);
        engine = new Engine({
          canvas,
          data,
          font: fontFamily,
          quality: capabilities.quality,
          reducedMotion: capabilities.reducedMotion,
          onLoadProgress: (ratio) => setLoadProgress((value) => Math.max(value, 0.22 + ratio * 0.78)),
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
          onTravel: (progress, near) => {
            setNearest(near);
            if (reelFillRef.current) reelFillRef.current.style.transform = `scaleX(${progress})`;
            if (timecodeRef.current) timecodeRef.current.textContent = timecode(progress);
          },
        });
        engineRef.current = engine;
      } catch (error) {
        console.warn("Studio Lot: falling back to the call sheet", error);
        if (!cancelled) {
          setFailed(true);
        }
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
    engine?.start();
    if (!capabilities?.reducedMotion) engine?.nudge(0.055);
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
    window.history.replaceState(null, "", pathname);
  };

  if (mode === "sheet" || mode === "detecting") {
    return (
      <>
        {/* Until the device is known, keep the same leader the server showed instead of flashing the sheet. */}
        {mode === "detecting" ? <RouteLeader /> : null}
        <CallSheet
        data={data}
        notice={failed ? "The 3D gallery could not start on this device, so here is the exhibition guide." : undefined}
        onEnterLot={capabilities?.webgl && !failed ? enterLot : undefined}
        />
      </>
    );
  }

  const hoveredIndex = data.rooms.findIndex((room) => room.id === (hovered ?? nearest));
  const hoveredRoom = data.rooms[hoveredIndex];
  const highlight = selected ?? hovered;

  return (
    <section aria-label="Thai PBS Studio Lot" className={styles.stage} data-phase={phase} data-focused={selected ? "" : undefined}>
      <h1 className={styles.srOnly}>Thai PBS gallery — every section of the home page, hung room by room</h1>
      <canvas aria-hidden="true" className={styles.canvas} ref={canvasRef} />
      <div aria-hidden="true" className={styles.vignette} />
      <div aria-hidden="true" className={styles.vignetteFocus} />
      <div aria-hidden="true" className={styles.grain} />

      <div aria-hidden={selected ? true : undefined} className={styles.caption}>
        <p className={styles.captionKicker}>
          <span className={styles.rec} /> Now viewing · {hoveredIndex >= 0 ? roomNumber(hoveredIndex) : ""}
        </p>
        <p className={styles.captionTitle}>{hoveredRoom?.title}</p>
        <p className={styles.captionThai}>{hoveredRoom?.thai}</p>
        <p className={styles.captionBlurb}>{hoveredRoom?.blurb}</p>
      </div>

      <div className={styles.hud}>
        <div className={styles.reel}>
          <div className={styles.reelMeta}>
            <span>Reel 01</span>
            <span ref={timecodeRef}>00:00:00:00</span>
          </div>
          <div className={styles.reelTrack}>
            <span className={styles.reelFill} ref={reelFillRef} />
          </div>
          <nav aria-label="Rooms in the gallery" className={styles.markers}>
            {data.rooms.map((section, index) => (
              <button
                aria-current={selected === section.id ? "true" : undefined}
                className={styles.marker}
                data-active={highlight === section.id || undefined}
                data-cursor={`Step into ${section.title}`}
                data-near={nearest === section.id || undefined}
                key={section.id}
                onBlur={() => engineRef.current?.setForcedHover(null)}
                onClick={() => select(section.id)}
                onFocus={() => {
                  engineRef.current?.setForcedHover(section.id);
                  if (!selectedRef.current) engineRef.current?.travelTo(section.id);
                }}
                onMouseEnter={() => engineRef.current?.setForcedHover(section.id)}
                onMouseLeave={() => engineRef.current?.setForcedHover(null)}
                ref={(element) => {
                  if (element) markerRefs.current.set(section.id, element);
                  else markerRefs.current.delete(section.id);
                }}
                type="button"
              >
                <span className={styles.markerIndex}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.markerName}>{section.title}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className={styles.hint} aria-hidden={selected ? true : undefined}>
          <span>Scroll to walk</span>
          <span>Click a room to step in</span>
          <span>1–{Math.min(9, data.rooms.length)} · Esc</span>
        </div>

        <button className={styles.listToggle} data-cursor="Switch to list view" onClick={switchToSheet} type="button">
          List view
        </button>
      </div>

      {panel ? <LotPanel data={data} onClose={close} onSelect={select} section={panel} /> : null}
      {selected && !panel ? <div aria-live="polite" className={styles.srOnly}>Moving to {data.rooms.find((room) => room.id === selected)?.title}</div> : null}

      <LotLoader phase={phase} progress={loadProgress} reducedMotion={Boolean(capabilities?.reducedMotion)} />
    </section>
  );
}
