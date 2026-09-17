"use client";

import type { ReactNode } from "react";
import { useLayoutEffect, useRef } from "react";
import styles from "./StudiosShowcase.module.css";

export function StudiosContentReveal({ children }: { children: ReactNode }) {
  const revealRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const revealRoot = revealRef.current;
    if (!revealRoot) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const selector = "[data-studios-reveal-item]";
    const reveal = (item: HTMLElement) => {
      item.dataset.revealVisible = "true";
    };
    const observer = reducedMotion || !("IntersectionObserver" in window)
      ? null
      : new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target as HTMLElement);
          observer?.unobserve(entry.target);
        });
      },
      { threshold: 0.12 },
    );

    const prepare = (item: HTMLElement) => {
      if (item.dataset.revealReady === "true") return;
      item.dataset.revealReady = "true";

      const bounds = item.getBoundingClientRect();
      const isAlreadyVisible = bounds.bottom > 0 && bounds.top < window.innerHeight;
      if (!observer || isAlreadyVisible) {
        reveal(item);
        return;
      }

      observer.observe(item);
    };

    revealRoot.querySelectorAll<HTMLElement>(selector).forEach(prepare);

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(selector)) prepare(node);
          node.querySelectorAll<HTMLElement>(selector).forEach(prepare);
        });
      });
    });
    mutationObserver.observe(revealRoot, { childList: true, subtree: true });

    return () => {
      observer?.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return (
    <div className={styles.contentReveal} data-studios-content-reveal ref={revealRef}>
      {children}
    </div>
  );
}
