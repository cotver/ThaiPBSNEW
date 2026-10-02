"use client";

import { useEffect, useRef, type ReactNode } from "react";

const DRAG_THRESHOLD = 6; // px before a press becomes a drag

/**
 * A horizontal strip that never moves on its own: it scrolls only to keep the element matching
 * `followSelector` in view when `followKey` changes (the room you are at or about to enter), or when
 * the visitor drags it with the mouse, scrolls it with a wheel, or swipes it on touch.
 * Drags never count as clicks; edge fades show which side has more.
 */
export function DragScroller({ ariaLabel, children, className, followKey, followSelector }: { ariaLabel: string; children: ReactNode; className?: string; followKey?: string | null; followSelector?: string }) {
  const ref = useRef<HTMLElement>(null);
  const hovering = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let drag: { pointerId: number; startX: number; startScroll: number; moved: boolean } | null = null;
    let suppressClick = false;

    const updateOverflow = () => {
      const max = element.scrollWidth - element.clientWidth;
      const overflow = max > 2 ? (element.scrollLeft <= 1 ? "end" : element.scrollLeft >= max - 1 ? "start" : "both") : "";
      if (element.dataset.overflow !== overflow) element.dataset.overflow = overflow;
    };
    updateOverflow();
    const resizeObserver = new ResizeObserver(updateOverflow);
    resizeObserver.observe(element);

    const onPointerEnter = (event: PointerEvent) => {
      if (event.pointerType === "mouse") hovering.current = true;
    };
    const onPointerLeave = () => {
      hovering.current = false;
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
      if (drag.moved) element.scrollLeft = drag.startScroll - dx;
    };
    const endDrag = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      if (drag.moved) {
        suppressClick = true;
        if (element.hasPointerCapture(drag.pointerId)) element.releasePointerCapture(drag.pointerId);
      }
      delete element.dataset.dragging;
      drag = null;
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
    };

    element.addEventListener("scroll", updateOverflow, { passive: true });
    element.addEventListener("pointerenter", onPointerEnter);
    element.addEventListener("pointerleave", onPointerLeave);
    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", endDrag);
    element.addEventListener("pointercancel", endDrag);
    element.addEventListener("click", onClickCapture, true);
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      resizeObserver.disconnect();
      element.removeEventListener("scroll", updateOverflow);
      element.removeEventListener("pointerenter", onPointerEnter);
      element.removeEventListener("pointerleave", onPointerLeave);
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", endDrag);
      element.removeEventListener("pointercancel", endDrag);
      element.removeEventListener("click", onClickCapture, true);
      element.removeEventListener("wheel", onWheel);
    };
  }, []);

  // Keep the room you are at (or about to enter) in view — the only time the strip moves by itself.
  // Not while the pointer is over the strip, so it never slides out from under the mouse.
  useEffect(() => {
    const element = ref.current;
    if (!element || !followKey || !followSelector || hovering.current) return;
    const target = element.querySelector<HTMLElement>(followSelector);
    if (!target) return;
    const left = target.offsetLeft - (element.clientWidth - target.offsetWidth) / 2;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollTo({ left, behavior: reducedMotion ? "auto" : "smooth" });
  }, [followKey, followSelector]);

  return (
    <nav aria-label={ariaLabel} className={className} ref={ref}>
      {children}
    </nav>
  );
}
