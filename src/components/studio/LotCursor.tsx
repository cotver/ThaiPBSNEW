"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/components/studio/studio-lot.module.css";
import { sampleUnder } from "./cursor-tone";

export const cursorEvent = "studio-lot:cursor";

/** Ask the cursor to show a label (or clear it) from anywhere, e.g. the 3D scene. */
export function setCursorLabel(label: string | null) {
  window.dispatchEvent(new CustomEvent(cursorEvent, { detail: label }));
}

/**
 * Viewfinder cursor: frame lines that open up around anything interactive and carry a label.
 * Its colours follow what it is over (see cursor-tone.ts): ink on light backgrounds and paper on dark ones,
 * amber over links and buttons, a contrasting tint of the picture over images, and a cyan caret over text.
 * Only on fine pointers; touch devices keep native behaviour.
 */
export function LotCursor() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [pressed, setPressed] = useState(false);
  const sceneLabel = useRef<string | null>(null);
  const domLabel = useRef<string | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(pointer: fine)");
    const update = () => setEnabled(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.dataset.lotCursor = "on";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const current = { ...target };
    let visible = false;
    let frame = 0;
    let last = performance.now();
    let sampled: Element | null = null;
    let sampleFrame = 0;

    // Read what is under the pointer and recolour the cursor; at most once a frame.
    const resample = (force = false) => {
      if (sampleFrame) return;
      sampleFrame = requestAnimationFrame(() => {
        sampleFrame = 0;
        const cursor = frameRef.current;
        const under = document.elementFromPoint(target.x, target.y);
        if (!cursor || !under || (under === sampled && !force)) return;
        sampled = under;
        const { kind, tint, tone } = sampleUnder(under);
        cursor.dataset.kind = kind;
        cursor.dataset.tone = tone;
        if (tint) cursor.style.setProperty("--cursor-tint", tint);
        else cursor.style.removeProperty("--cursor-tint");
      });
    };
    // Scrolling moves new content under a still pointer.
    const scrolled = () => resample(true);

    const sync = () => setLabel(domLabel.current ?? sceneLabel.current);

    const move = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      if (!visible) {
        visible = true;
        current.x = target.x;
        current.y = target.y;
        frameRef.current?.setAttribute("data-visible", "");
      }
      const element = (event.target as Element | null)?.closest?.("[data-cursor], a, button, [role='button'], input, select, textarea");
      const next = element ? element.getAttribute("data-cursor") ?? element.getAttribute("aria-label") ?? "" : null;
      if (next !== domLabel.current) {
        domLabel.current = next;
        sync();
      }
      resample();
    };
    const leave = () => {
      visible = false;
      frameRef.current?.removeAttribute("data-visible");
    };
    const down = () => setPressed(true);
    const up = () => setPressed(false);
    const scene = (event: Event) => {
      sceneLabel.current = (event as CustomEvent<string | null>).detail;
      sync();
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const k = reduced ? 1 : 1 - Math.exp(-22 * dt);
      current.x += (target.x - current.x) * k;
      current.y += (target.y - current.y) * k;
      if (frameRef.current) frameRef.current.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener(cursorEvent, scene);
    window.addEventListener("scroll", scrolled, { capture: true, passive: true });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(sampleFrame);
      window.removeEventListener("scroll", scrolled, { capture: true });
      delete root.dataset.lotCursor;
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener(cursorEvent, scene);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className={styles.cursor} data-active={label !== null || undefined} data-pressed={pressed || undefined} ref={frameRef}>
      <span className={styles.cursorFrame}>
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className={styles.cursorDot} />
      {label ? <span className={styles.cursorLabel}>{label}</span> : null}
    </div>
  );
}
