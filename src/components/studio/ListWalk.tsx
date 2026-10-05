"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { LotRoom, LotSectionId } from "@/lib/studio/data";
import { cue } from "@/lib/studio/sound";
import { WalkNav } from "./WalkNav";

/** Where each room's section lives on the real /home page (list view). */
function findSection(root: HTMLElement, room: LotRoom): HTMLElement | null {
  const byHeading = (scope: Element | null) =>
    scope ? ([...scope.querySelectorAll("h2, h3")].find((heading) => heading.textContent?.trim() === room.title) as HTMLElement | undefined) ?? null : null;
  switch (room.id) {
    case "featured":
      return root.querySelector<HTMLElement>("[data-responsive-hero]") ?? root.querySelector<HTMLElement>(".app-shell-content > *");
    case "studios-journal":
      return root.querySelector<HTMLElement>("[data-studios-showcase]");
    case "studios-catalog":
      return root.querySelector<HTMLElement>("#catalog");
    case "studios-more":
      return root.querySelector<HTMLElement>('[aria-label="More Studios categories"]');
    case "market-events":
      return root.querySelector<HTMLElement>("#market-events");
    case "press-releases":
    case "content-distribution":
      return byHeading(root.querySelector("[data-studios-showcase]"));
    case "categories":
      return root.querySelector<HTMLElement>("[data-brand-rail]");
    default:
      // Content rows: the row whose heading is the room title.
      return byHeading(root.querySelector("[data-home-content]"));
  }
}

/**
 * A section's top in the document, from layout rather than its painted box: sections waiting to rise in as
 * they scroll into view (the home page's motion) are drawn lower than where they will settle.
 */
function documentTop(element: HTMLElement) {
  let top = 0;
  for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) top += node.offsetTop;
  return top;
}

function headerHeight() {
  return document.querySelector<HTMLElement>("[data-lot-header]")?.offsetHeight ?? 64;
}

/**
 * The top-bar room strip for the list view: clicking a room scrolls to its section of the home page,
 * the highlight follows the section you are reading, and the line shows how far down the page you are.
 */
export function ListWalk({ rooms, rootRef }: { rooms: LotRoom[]; rootRef: RefObject<HTMLElement | null> }) {
  const fillRef = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState<LotSectionId | null>(rooms[0]?.id ?? null);
  const [hovered, setHovered] = useState<LotSectionId | null>(null);
  // While a click-scroll glides to its section, keep that room highlighted instead of every room it passes.
  const gliding = useRef<{ id: LotSectionId; until: number } | null>(null);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const root = rootRef.current;
      if (!root) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
      const glide = gliding.current;
      if (glide && performance.now() < glide.until) return setCurrent(glide.id);
      gliding.current = null;
      // The section you are reading: the last one whose top has passed a line just under the header.
      const line = headerHeight() + window.innerHeight * 0.25;
      let next: LotSectionId | null = rooms[0]?.id ?? null;
      for (const room of rooms) {
        const element = findSection(root, room);
        if (element && documentTop(element) - window.scrollY <= line) next = room.id;
      }
      // At the very bottom, the last section is current even if it is short.
      if (max > 0 && window.scrollY >= max - 2) next = rooms[rooms.length - 1]?.id ?? next;
      setCurrent(next);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Sections stream in (e.g. the Studios showcase); re-measure when the page grows.
    const observer = new ResizeObserver(schedule);
    if (rootRef.current) observer.observe(rootRef.current);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, [rooms, rootRef]);

  const select = useCallback(
    (id: LotSectionId) => {
      const root = rootRef.current;
      const room = rooms.find((item) => item.id === id);
      const element = root && room ? findSection(root, room) : null;
      if (!element) return;
      cue("select");
      const top = documentTop(element) - headerHeight() - 12;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? "auto" : "smooth" });
      gliding.current = { id, until: performance.now() + (reducedMotion ? 0 : 900) };
      setCurrent(id);
    },
    [rooms, rootRef],
  );

  return (
    <WalkNav
      active={hovered ?? current}
      current={current}
      cursorVerb="Go to"
      fillRef={fillRef}
      near={current}
      onHoverRoom={setHovered}
      onSelect={select}
      rooms={rooms}
    />
  );
}
