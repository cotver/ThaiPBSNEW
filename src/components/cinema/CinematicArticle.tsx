"use client";

import { useEffect } from "react";

/** Blocks of an article that fade in as the reader reaches them. */
const blockSelector = [
  "[data-cine-article] aside > *",
  "[data-cine-article] article :is(p, h2, h3, h4, figure, ul, ol, table, blockquote, iframe, video)",
  "[data-cine-article] [aria-label='Story recommendations'] a",
].join(",");

const cineEase = "cubic-bezier(.16, 1, .3, 1)";

/**
 * Builds the paused reveal for one block. It uses the Web Animations API rather than attributes or classes:
 * related stories stream in and get picked up before React hydrates them, and any attribute added then would
 * not match the server HTML.
 */
function createReveal(block: HTMLElement) {
  const slow = block.matches("figure, a");
  const from = block.matches("blockquote") ? "-60px 0" : "0 36px";
  const animations = [
    block.animate(
      [
        { filter: "blur(6px)", opacity: 0 },
        { filter: "blur(0)", opacity: 1 },
      ],
      { duration: slow ? 1000 : 900, easing: "ease" },
    ),
    block.animate([{ translate: from }, { translate: "0 0" }], { duration: slow ? 1300 : 1100, easing: cineEase }),
  ];
  // Paused at the first frame, the block stays hidden until it is played.
  animations.forEach((animation) => animation.pause());
  return animations;
}

/**
 * Reading motion for article pages: paragraphs, images and related stories fade up as they come into view,
 * and pull quotes slide in from the side. Only what starts below the fold waits, so nothing on screen at
 * load ever disappears.
 */
export function CinematicArticle() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const seen = new WeakSet<Element>();
    const pending = new Map<Element, Animation[]>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          pending.get(entry.target)?.forEach((animation) => animation.play());
          pending.delete(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );

    const prepare = () => {
      document.querySelectorAll<HTMLElement>(blockSelector).forEach((block) => {
        // Skip blocks inside another block (e.g. a paragraph in a quote) and ones already handled.
        if (seen.has(block) || block.parentElement?.closest(blockSelector)) return;
        seen.add(block);
        if (block.getBoundingClientRect().top < window.innerHeight) return;
        pending.set(block, createReveal(block));
        observer.observe(block);
      });
    };
    prepare();

    // The related stories stream in after the article, so pick up blocks that arrive later.
    const root = document.querySelector("[data-cine-article]");
    const mutations = new MutationObserver(prepare);
    if (root) mutations.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
      // Un-hide anything still waiting, so a re-run of this effect starts clean instead of leaving it hidden.
      pending.forEach((animations) => animations.forEach((animation) => animation.cancel()));
      pending.clear();
    };
  }, []);

  return null;
}
