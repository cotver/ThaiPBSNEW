"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { BackToTopReel } from "./BackToTopReel";
import { setMorphImage } from "./morph-store";

/** Controls that answer a press with a small push and a ring of light. */
const pressSelector = [
  "[data-responsive-hero] a",
  "[data-responsive-hero] button",
  "[data-home-content] section > div:first-child > a",
  "[data-studios-reveal-item] > a",
  'button[aria-label^="Scroll "]',
].join(",");

/** Links into an article page; their image morphs into the article's hero. */
const morphLinkSelector = 'a[href^="/article/"]';
/** How long the morph stays named after the destination has rendered (past its loading screen). */
const morphClearMs = 1600;
const morphFallbackMs = 30000;

/**
 * What opens a modal, which then grows out of it and back: posters and their hover previews (title modal),
 * Market & Events cards (event modal) and "Contact Information" links (contact modal).
 */
const modalOriginSelector = [
  "[data-poster-rail] > button",
  "[data-hover-preview-panel]",
  "[data-content-rail] button",
  "#market-events a[data-studios-reveal-item]",
  'a[href^="/studios/events/"]',
  'a[href^="/studios/contact/"]',
].join(",");
const modalSelector = '[role="dialog"][aria-modal="true"]';
/** The event modal arrives through a navigation, which can take a few seconds while a route compiles. */
const modalOriginMaxAgeMs = 10000;
const curtainEase = "cubic-bezier(.16, 1, .3, 1)";

/** Horizontal rows whose cards lean into the direction they're scrolled. */
const leanRailSelector = '[data-content-rail], #catalog [role="region"]';
const maxLean = 7;

/**
 * Sitewide motion that isn't tied to one page:
 * - Image morph: clicking an article link names the clicked image (or the hero's active image) and, via
 *   html[data-cine-morph], the destination article's hero, so the page transition morphs one into the other.
 *   If the article shows the loading screen first, the image waits in the loading frame and morphs twice.
 * - Press: buttons and "View All" links push in and ring with light when pressed.
 * - Title and Market & Events modals: grow out of the card that opened them and shrink back into it on close.
 * - Rows: cards lean into the scroll direction while a row is moving, then settle.
 * - Back to top: a film reel that rewinds the page.
 */
export function CinematicGlobal() {
  const pathname = usePathname();

  // Clear the morph shortly after the destination page has rendered, which may be after its loading screen.
  useEffect(() => {
    if (!document.documentElement.hasAttribute("data-cine-morph")) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const settleWhenLoaded = () => {
      if (document.querySelector(".cine-loading")) return;
      observer.disconnect();
      timer = setTimeout(clearMorph, morphClearMs);
    };
    const observer = new MutationObserver(settleWhenLoaded);
    observer.observe(document.body, { childList: true, subtree: true });
    settleWhenLoaded();
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [pathname]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let fallback: ReturnType<typeof setTimeout> | undefined;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(morphLinkSelector);
      if (!link || link.target === "_blank" || new URL(link.href).pathname === window.location.pathname) return;
      const source = morphSource(link);
      if (!source) return;

      clearMorph();
      // The current page's own article hero must not share the name with the clicked image.
      document.querySelectorAll<HTMLElement>("[data-cine-morph-target]").forEach((target) => {
        target.dataset.cineMorphOld = "";
      });
      source.dataset.cineMorphSource = "";
      const image = source.querySelector("img");
      setMorphImage(image?.currentSrc || image?.src || null);
      document.documentElement.setAttribute("data-cine-morph", "");
      clearTimeout(fallback);
      fallback = setTimeout(clearMorph, morphFallbackMs);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const control = (event.target as Element | null)?.closest<HTMLElement>(pressSelector);
      if (!control) return;
      delete control.dataset.cinePress;
      void control.offsetWidth; // restart the animation on rapid presses
      control.dataset.cinePress = "";
      setTimeout(() => delete control.dataset.cinePress, 650);
    };

    // Title modal: remember where it was opened from, then animate it in and out of that spot.
    let origin: { element: Element; rect: DOMRect; time: number } | null = null;
    let closingByLink = false;
    const onOriginDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const modal = target?.closest(modalSelector);
      if (modal) {
        closingByLink = Boolean(target?.closest("a[href]"));
        return;
      }
      const element = target?.closest(modalOriginSelector);
      if (element) origin = { element, rect: element.getBoundingClientRect(), time: Date.now() };
    };
    const modalObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (isModalBackdrop(node)) {
            closingByLink = false;
            openModal(node, origin && Date.now() - origin.time < modalOriginMaxAgeMs ? origin.rect : null);
          }
        });
        mutation.removedNodes.forEach((node) => {
          if (isModalBackdrop(node) && !closingByLink) {
            const target = origin?.element.isConnected ? origin.element.getBoundingClientRect() : null;
            closeModal(node, target);
          }
        });
      });
    });
    modalObserver.observe(document.body, { childList: true });

    // Rows: lean cards by scroll velocity; spring back once the row stops.
    const leans = new Map<HTMLElement, { left: number; time: number; idle?: ReturnType<typeof setTimeout> }>();
    const onRailScroll = (event: Event) => {
      const rail = event.target;
      if (!(rail instanceof HTMLElement) || !rail.matches(leanRailSelector)) return;
      const now = performance.now();
      const last = leans.get(rail) ?? { left: rail.scrollLeft, time: now };
      const elapsed = Math.max(now - last.time, 16);
      const velocity = (rail.scrollLeft - last.left) / elapsed; // px per ms
      const lean = Math.max(-maxLean, Math.min(maxLean, -velocity * 4));
      rail.dataset.cineLeaning = "";
      rail.style.setProperty("--cine-lean", `${lean.toFixed(2)}deg`);
      clearTimeout(last.idle);
      const idle = setTimeout(() => {
        rail.style.setProperty("--cine-lean", "0deg");
        setTimeout(() => {
          if (rail.style.getPropertyValue("--cine-lean") === "0deg") delete rail.dataset.cineLeaning;
        }, 450);
      }, 110);
      leans.set(rail, { idle, left: rail.scrollLeft, time: now });
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("pointerdown", onOriginDown, { capture: true, passive: true });
    document.addEventListener("scroll", onRailScroll, { capture: true, passive: true });
    return () => {
      clearTimeout(fallback);
      modalObserver.disconnect();
      leans.forEach(({ idle }) => clearTimeout(idle));
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerdown", onOriginDown, { capture: true });
      document.removeEventListener("scroll", onRailScroll, { capture: true });
    };
  }, []);

  return <BackToTopReel />;
}

/** Transform that places a box of `to`'s size over `from` (FLIP), as a starting/ending keyframe. */
function flipFrom(from: DOMRect, to: DOMRect) {
  const scaleX = from.width / Math.max(to.width, 1);
  const scaleY = from.height / Math.max(to.height, 1);
  return `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${scaleX}, ${scaleY})`;
}

/**
 * A modal as added to <body>: the backdrop, whose first child is the panel that moves. The title modal is
 * itself the dialog (panel = its article); the event modal is an overlay around its dialog (panel = dialog).
 */
function isModalBackdrop(node: Node): node is HTMLElement {
  return (
    node instanceof HTMLElement &&
    !node.hasAttribute("data-cine-modal-ghost") && // the closing copy is not a modal opening or closing
    (node.matches(modalSelector) || Boolean(node.firstElementChild?.matches(modalSelector)))
  );
}

function openModal(dialog: HTMLElement, from: DOMRect | null) {
  const panel = dialog.firstElementChild as HTMLElement | null;
  dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, easing: "ease-out" });
  if (!panel) return;
  const to = panel.getBoundingClientRect();
  const start = from
    ? { borderRadius: "6px", opacity: 0.35, transform: flipFrom(from, to) }
    : { filter: "blur(8px)", opacity: 0, transform: "translateY(48px) scale(.96)" };
  panel.animate([{ ...start, transformOrigin: "0 0" }, { borderRadius: "8px", filter: "none", opacity: 1, transform: "none", transformOrigin: "0 0" }], {
    duration: from ? 680 : 520,
    easing: curtainEase,
  });
}

/** The modal is already gone from React; animate a static copy of it back into the poster, then drop it. */
function closeModal(dialog: HTMLElement, to: DOMRect | null) {
  const ghost = dialog.cloneNode(true) as HTMLElement;
  ghost.querySelectorAll("iframe, video").forEach((media) => media.remove());
  ghost.setAttribute("aria-hidden", "true");
  ghost.setAttribute("data-cine-modal-ghost", "");
  [ghost, ...ghost.querySelectorAll("[role='dialog'], [aria-modal]")].forEach((element) => {
    element.removeAttribute("role");
    element.removeAttribute("aria-modal");
  });
  ghost.style.pointerEvents = "none";
  document.body.appendChild(ghost);
  ghost.scrollTop = dialog.scrollTop;
  // The page's own scrollbar is already back; the copy must not show a second one beside it.
  ghost.style.overflow = "hidden";
  if (ghost.firstElementChild instanceof HTMLElement) ghost.firstElementChild.style.overflow = "hidden";

  const panel = ghost.firstElementChild as HTMLElement | null;
  const from = panel?.getBoundingClientRect();
  const fade = ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: "ease-in", fill: "forwards" });
  if (panel && from) {
    const end = to
      ? { borderRadius: "6px", opacity: 0.2, transform: flipFrom(to, from) }
      : { filter: "blur(6px)", opacity: 0, transform: "translateY(36px) scale(.96)" };
    panel.animate([{ opacity: 1, transform: "none", transformOrigin: "0 0" }, { ...end, transformOrigin: "0 0" }], {
      duration: 420,
      easing: "cubic-bezier(.55, 0, .7, .2)",
      fill: "forwards",
    });
  }
  // Animations can stall in a hidden tab, so the copy is also removed on a timer.
  const removeGhost = () => ghost.remove();
  fade.finished.then(removeGhost, removeGhost);
  setTimeout(removeGhost, 900);
}

/** The image to carry into the article: the card's own image, or the active hero slide behind a "Read" link. */
function morphSource(link: HTMLAnchorElement): HTMLElement | null {
  const cardImage = link.querySelector("img")?.parentElement;
  if (cardImage) return cardImage;
  const hero = link.closest("[data-responsive-hero]");
  return hero?.querySelector<HTMLElement>('[aria-hidden="false"] div:has(> [data-hero-art])') ?? null;
}

function clearMorph() {
  setMorphImage(null);
  document.documentElement.removeAttribute("data-cine-morph");
  document.querySelectorAll<HTMLElement>("[data-cine-morph-source]").forEach((element) => delete element.dataset.cineMorphSource);
  document.querySelectorAll<HTMLElement>("[data-cine-morph-old]").forEach((element) => delete element.dataset.cineMorphOld);
}
