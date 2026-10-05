"use client";

import { useEffect } from "react";
import { averageImageColor, rgba } from "./image-color";

/** Cards that tilt toward the pointer and catch a moving highlight. */
const tiltSelector = [
  "[data-brand-rail] > a",
  "[data-market-logo-card]",
  "#news a[data-studios-reveal-item]:not([data-market-logo-card])",
  "#catalog section > a",
  "#market-events a[data-studios-reveal-item]",
  "#catalog article > a:first-child",
].join(",");

const maxTilt = 7;
const maxStagger = 10;
/** How far (in % of its size) a card's image drifts against the tilt, for depth. */
const maxDrift = 1.5;
const fallbackGlow = "rgb(255 101 15 / 55%)";

/** The poster's average colour, as a translucent glow; falls back to the accent if the image can't be read. */
function posterGlow(image: HTMLImageElement | null) {
  const color = averageImageColor(image);
  return color ? rgba(color, 0.6) : fallbackGlow;
}

/**
 * Motion layer for the home page. It only adds data attributes and CSS variables after hydration, which
 * cinematic.css turns into motion, so the markup and look of each section stay unchanged.
 * - Heroes: parallax, fade and darkening as each scrolls away (the Studios hero and, when enabled, the
 *   catalogue carousel).
 * - Rows: rise out of a blur as they enter the viewport, headings wipe in, cards follow in a stagger. This
 *   covers every catalogue row, including the ones behind SHOW_HIDDEN_CATALOG_SECTIONS, and a hero lower
 *   on the page, whose title then rises in too.
 * - Hero slide changes: a light sweep crosses the slide and the new title lines rise in, like a cut.
 * - Cards: 3D tilt with a highlight that tracks the pointer; doorway and event images drift for depth.
 * - Posters: a glow in the poster's own colour around the card and its hover preview.
 * - Accordion: a light sweep and a typed-in name each time a panel opens.
 * - A progress line along the top that fills as the page scrolls.
 * - Ambient colour: the space around the top of the page takes on the featured hero image's colour.
 */
export function CinematicMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-cinematic-home]");
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cleanups: (() => void)[] = [];

    // Heroes: the first one's title waits for the intro; every hero gets its own scroll-linked parallax.
    const heroes = Array.from(root.querySelectorAll<HTMLElement>('[data-responsive-hero="home"]'));
    const [topHero] = heroes;
    if (topHero && document.documentElement.hasAttribute("data-intro-playing")) {
      topHero.dataset.cineHero = "pending";
      const reveal = () => {
        topHero.dataset.cineHero = "in";
        setTimeout(() => delete topHero.dataset.cineHero, 2400);
      };
      window.addEventListener("cine:intro-done", reveal, { once: true });
      cleanups.push(() => window.removeEventListener("cine:intro-done", reveal));
    }
    const progressLine = document.querySelector<HTMLElement>("[data-cine-progress]");
    {
      let frame = 0;
      const update = () => {
        frame = 0;
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        progressLine?.style.setProperty("--cine-progress", (scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0).toFixed(4));
        heroes.forEach((hero) => {
          const bounds = hero.getBoundingClientRect();
          const progress = Math.min(Math.max(-bounds.top / Math.max(bounds.height, 1), 0), 1);
          hero.style.setProperty("--cine-hero", progress.toFixed(4));
        });
      };
      const onScroll = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };
      update();
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanups.push(() => {
        cancelAnimationFrame(frame);
        window.removeEventListener("scroll", onScroll);
        heroes.forEach((hero) => hero.style.removeProperty("--cine-hero"));
        progressLine?.style.removeProperty("--cine-progress");
      });
    }

    // Ambient colour from the top hero's visible artwork; retries while the image is still loading or decoding.
    let ambientRetry: ReturnType<typeof setTimeout> | undefined;
    const updateAmbient = (attempt = 0) => {
      clearTimeout(ambientRetry);
      const image = topHero?.querySelector<HTMLImageElement>('[aria-hidden="false"] [data-hero-art]');
      const color = averageImageColor(image);
      if (color) root.style.setProperty("--cine-ambient", rgba(color, 0.5));
      else if (image && attempt < 8) ambientRetry = setTimeout(() => updateAmbient(attempt + 1), 400);
    };
    updateAmbient();
    cleanups.push(() => {
      clearTimeout(ambientRetry);
      root.style.removeProperty("--cine-ambient");
    });

    // Hero slide changes: when the copy swaps to the next slide's, replay the cut.
    heroes.forEach((hero) => {
      const copy = hero.querySelector("[data-hero-copy]");
      if (!copy) return;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let lastText = copy.textContent;
      // A slide change arrives as one batch of mutations, so each callback is at most one cut.
      const cut = () => {
        if (copy.textContent === lastText) return;
        lastText = copy.textContent;
        delete hero.dataset.cineCut;
        void hero.offsetWidth; // restart the animations
        hero.dataset.cineCut = "";
        if (hero === topHero) updateAmbient();
        clearTimeout(timer);
        timer = setTimeout(() => delete hero.dataset.cineCut, 1600);
      };
      const slideObserver = new MutationObserver(cut);
      slideObserver.observe(copy, { characterData: true, childList: true, subtree: true });
      cleanups.push(() => {
        slideObserver.disconnect();
        clearTimeout(timer);
      });
    });

    // Accordion: flash a panel each time it becomes the open one (it then carries a second class).
    const accordionPanels = Array.from(root.querySelectorAll<HTMLElement>('section[aria-label="More Studios categories"] a'));
    const isOpen = (panel: HTMLElement) => panel.classList.length > 1;
    const openState = new Map(accordionPanels.map((panel) => [panel, isOpen(panel)]));
    const accordionObserver = new MutationObserver((mutations) => {
      mutations.forEach(({ target }) => {
        const panel = target as HTMLElement;
        const open = isOpen(panel);
        if (open && !openState.get(panel)) {
          delete panel.dataset.cineFlash;
          void panel.offsetWidth;
          panel.dataset.cineFlash = "";
          setTimeout(() => delete panel.dataset.cineFlash, 1200);
        }
        openState.set(panel, open);
      });
    });
    accordionPanels.forEach((panel) => accordionObserver.observe(panel, { attributeFilter: ["class"] }));
    cleanups.push(() => accordionObserver.disconnect());

    // Rows: everything below the fold waits, then rises in with its cards staggered.
    const rows = Array.from(root.querySelectorAll<HTMLElement>(":scope > [data-responsive-hero], [data-home-content] > *"));
    const settle = (row: HTMLElement) => {
      row.dataset.cine = "in";
      if (row.dataset.cineHero) row.dataset.cineHero = "in";
      setTimeout(() => {
        delete row.dataset.cine;
        delete row.dataset.cineHero;
        row.querySelectorAll<HTMLElement>("[data-cine-card]").forEach((card) => {
          delete card.dataset.cineCard;
          card.style.removeProperty("--cine-i");
        });
      }, 2200);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          settle(entry.target as HTMLElement);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    rows.forEach((row) => {
      if (row.getBoundingClientRect().top < window.innerHeight) return;
      row.dataset.cine = "pending";
      if (row.hasAttribute("data-responsive-hero")) row.dataset.cineHero = "pending";
      row.querySelectorAll<HTMLElement>("[data-content-rail] > *, [data-brand-rail] > *").forEach((card, index) => {
        card.dataset.cineCard = "";
        card.style.setProperty("--cine-i", String(Math.min(index, maxStagger)));
      });
      observer.observe(row);
    });
    cleanups.push(() => observer.disconnect());

    // Cards: pointer-tracked tilt and highlight.
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      let active: HTMLElement | null = null;
      const release = () => {
        if (!active) return;
        delete active.dataset.cineTilt;
        active.style.removeProperty("--cine-rx");
        active.style.removeProperty("--cine-ry");
        active.style.removeProperty("--cine-px");
        active.style.removeProperty("--cine-py");
        active = null;
      };
      const onMove = (event: PointerEvent) => {
        const card = (event.target as Element | null)?.closest<HTMLElement>(tiltSelector) ?? null;
        if (card !== active) release();
        if (!card) return;
        active = card;
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        card.dataset.cineTilt = "";
        card.style.setProperty("--cine-rx", `${((0.5 - y) * maxTilt).toFixed(2)}deg`);
        card.style.setProperty("--cine-ry", `${((x - 0.5) * maxTilt).toFixed(2)}deg`);
        card.style.setProperty("--cine-mx", `${(x * 100).toFixed(1)}%`);
        card.style.setProperty("--cine-my", `${(y * 100).toFixed(1)}%`);
        card.style.setProperty("--cine-px", `${((0.5 - x) * maxDrift * 2).toFixed(2)}%`);
        card.style.setProperty("--cine-py", `${((0.5 - y) * maxDrift * 2).toFixed(2)}%`);
      };

      // Posters: colour the row's glow from the hovered poster, for the card and its floating preview.
      const onOver = (event: PointerEvent) => {
        const poster = (event.target as Element | null)?.closest<HTMLElement>("[data-poster-rail] > button");
        const row = poster?.closest<HTMLElement>("section");
        if (!poster || !row) return;
        row.style.setProperty("--cine-glow", posterGlow(poster.querySelector("img")));
      };
      root.addEventListener("pointerover", onOver, { passive: true });
      cleanups.push(() => root.removeEventListener("pointerover", onOver));
      root.addEventListener("pointermove", onMove, { passive: true });
      root.addEventListener("pointerleave", release);
      cleanups.push(() => {
        root.removeEventListener("pointermove", onMove);
        root.removeEventListener("pointerleave", release);
        release();
      });
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return null;
}
