"use client";

import { useEffect, useRef, type ReactNode } from "react";

const DRIFT_SPEED = 26; // px per second
const IDLE_BEFORE_DRIFT = 3000; // ms after the last interaction
const DRAG_THRESHOLD = 6; // px before a press becomes a drag

/**
 * A horizontal strip that shows everything even when it overflows: it drifts back and forth on
 * its own, can be dragged with the mouse, scrolled with a wheel or swiped on touch, and glides the
 * element matching `followSelector` into view whenever `followKey` changes.
 * Drags never count as clicks; drift pauses while the pointer is over it and for a while after input.
 */
export function DragScroller({ ariaLabel, children, className, followKey, followSelector }: { ariaLabel: string; children: ReactNode; className?: string; followKey?: string | null; followSelector?: string }) {
  const ref = useRef<HTMLElement>(null);
  const lastInteraction = useRef(0);
  const hovering = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let last = performance.now();
    let direction = 1;
    let position = element.scrollLeft; // fractional, since scrollLeft rounds
    let drag: { pointerId: number; startX: number; startScroll: number; moved: boolean } | null = null;
    let suppressClick = false;

    const markInteraction = () => {
      lastInteraction.current = performance.now();
      position = element.scrollLeft;
    };

    const updateOverflow = () => {
      const max = element.scrollWidth - element.clientWidth;
      const overflow = max > 2 ? (element.scrollLeft <= 1 ? "end" : element.scrollLeft >= max - 1 ? "start" : "both") : "";
      if (element.dataset.overflow !== overflow) element.dataset.overflow = overflow;
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const max = element.scrollWidth - element.clientWidth;
      if (!reducedMotion && max > 2 && !drag && !hovering.current && now - lastInteraction.current > IDLE_BEFORE_DRIFT) {
        position += direction * DRIFT_SPEED * dt;
        if (position >= max || position <= 0) {
          position = Math.min(max, Math.max(0, position));
          direction = -direction;
          // Rest at each end for a moment before drifting back.
          lastInteraction.current = now - IDLE_BEFORE_DRIFT + 1600;
        }
        element.scrollLeft = position;
      }
      updateOverflow();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const onPointerEnter = (event: PointerEvent) => {
      if (event.pointerType === "mouse") hovering.current = true;
    };
    const onPointerLeave = () => {
      hovering.current = false;
      markInteraction();
    };
    const onPointerDown = (event: PointerEvent) => {
      // Touch and pen scroll natively; the mouse gets drag-to-scroll.
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      drag = { pointerId: event.pointerId, startX: event.clientX, startScroll: element.scrollLeft, moved: false };
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const dx = event.clientX - drag.startX;
      if (!drag.moved && Math.abs(dx) > DRAG_THRESHOLD) {
        drag.moved = true;
        element.setPointerCapture(drag.pointerId);
        element.dataset.dragging = "";
      }
      if (drag.moved) {
        element.scrollLeft = drag.startScroll - dx;
        markInteraction();
      }
    };
    const endDrag = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      if (drag.moved) {
        suppressClick = true;
        if (element.hasPointerCapture(drag.pointerId)) element.releasePointerCapture(drag.pointerId);
      }
      delete element.dataset.dragging;
      drag = null;
      markInteraction();
    };
    // A drag must not also activate the room button it started on.
    const onClickCapture = (event: MouseEvent) => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    };
    const onWheel = (event: WheelEvent) => {
      const max = element.scrollWidth - element.clientWidth;
      if (max <= 2) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      event.preventDefault();
      element.scrollLeft += delta;
      markInteraction();
    };
    const onTouchOrKey = () => markInteraction();

    element.addEventListener("pointerenter", onPointerEnter);
    element.addEventListener("pointerleave", onPointerLeave);
    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", endDrag);
    element.addEventListener("pointercancel", endDrag);
    element.addEventListener("click", onClickCapture, true);
    element.addEventListener("wheel", onWheel, { passive: false });
    element.addEventListener("touchmove", onTouchOrKey, { passive: true });
    element.addEventListener("focusin", onTouchOrKey);
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("pointerenter", onPointerEnter);
      element.removeEventListener("pointerleave", onPointerLeave);
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", endDrag);
      element.removeEventListener("pointercancel", endDrag);
      element.removeEventListener("click", onClickCapture, true);
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("touchmove", onTouchOrKey);
      element.removeEventListener("focusin", onTouchOrKey);
    };
  }, []);

  // Keep the room you are at (or about to enter) in view.
  useEffect(() => {
    const element = ref.current;
    if (!element || !followKey || !followSelector || hovering.current) return;
    const target = element.querySelector<HTMLElement>(followSelector);
    if (!target) return;
    const left = target.offsetLeft - (element.clientWidth - target.offsetWidth) / 2;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollTo({ left, behavior: reducedMotion ? "auto" : "smooth" });
    lastInteraction.current = performance.now();
  }, [followKey, followSelector]);

  return (
    <nav aria-label={ariaLabel} className={className} ref={ref}>
      {children}
    </nav>
  );
}
