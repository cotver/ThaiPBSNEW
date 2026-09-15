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
    const sections = Array.from(
      revealRoot.querySelectorAll<HTMLElement>("[data-studios-reveal-section]"),
    );

    sections.forEach((section) => {
      section.dataset.revealReady = "true";
    });

    if (reducedMotion || !("IntersectionObserver" in window)) {
      sections.forEach((section) => {
        section.dataset.revealVisible = "true";
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).dataset.revealVisible = "true";
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -6%", threshold: 0.01 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.contentReveal} data-studios-content-reveal ref={revealRef}>
      {children}
    </div>
  );
}
