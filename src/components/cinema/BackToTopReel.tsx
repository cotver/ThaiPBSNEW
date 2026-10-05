"use client";

import { useEffect, useRef, useState } from "react";

const showAfterViewports = 1.5;
const ringLength = 2 * Math.PI * 22;

/**
 * A film reel that appears once the page is scrolled well down: its ring fills with scroll progress and the
 * reel turns as you scroll. Clicking it rewinds to the top.
 */
export function BackToTopReel() {
  const [visible, setVisible] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
      buttonRef.current?.style.setProperty("--reel-progress", progress.toFixed(4));
      setVisible(window.scrollY > window.innerHeight * showAfterViewports);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <button
      aria-hidden={!visible}
      aria-label="Back to top"
      className="cine-reel"
      data-visible={visible || undefined}
      onClick={() => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ behavior: reduced ? "auto" : "smooth", top: 0 });
      }}
      ref={buttonRef}
      tabIndex={visible ? 0 : -1}
      type="button"
    >
      <svg aria-hidden="true" viewBox="0 0 52 52">
        <circle className="cine-reel__track" cx="26" cy="26" r="22" />
        <circle className="cine-reel__ring" cx="26" cy="26" r="22" style={{ strokeDasharray: ringLength }} />
        <g className="cine-reel__spool">
          <circle cx="26" cy="26" r="11" />
          <circle cx="26" cy="19.5" r="2.6" />
          <circle cx="26" cy="32.5" r="2.6" />
          <circle cx="19.5" cy="26" r="2.6" />
          <circle cx="32.5" cy="26" r="2.6" />
          <circle cx="26" cy="26" r="1.4" />
        </g>
      </svg>
    </button>
  );
}
