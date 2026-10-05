"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { IntroLogo3D } from "./IntroLogo3D";
import { cinematicIntroCookieName } from "./intro-cookie";

const holdMs = 2300;
const openMs = 1000;
/** How long the 3D logo may take to appear before the intro falls back to the lettered title. */
const logoTimeoutMs = 1600;

function hasSeenIntro() {
  return document.cookie.split("; ").some((cookie) => cookie.startsWith(`${cinematicIntroCookieName}=`));
}

/**
 * Letterboxed title card that plays once per browser session on /home, then splits open onto the page.
 * The page only renders it while the session cookie is absent; if a cached render brings it back anyway,
 * html[data-intro-seen] hides it before paint. Skipped with any click, key or scroll, and never shown
 * with reduced motion. The title is the logo as a 3D tile, or the lettered title without WebGL.
 */
export function CinematicIntro({ subtitle = "Parvilions", title = "Thai PBS" }: { subtitle?: string; title?: string }) {
  const [phase, setPhase] = useState<"hold" | "open" | "done">("hold");
  const [logoMode, setLogoMode] = useState<"pending" | "3d" | "text">("pending");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Decided once per mount, so effect re-runs (Strict Mode, Fast Refresh) don't see their own cookie.
  const skipIntro = useRef<boolean | null>(null);

  const finish = useCallback(() => {
    const root = document.documentElement;
    root.removeAttribute("data-intro-playing");
    root.removeAttribute("data-intro-phase");
    setPhase("done");
    window.dispatchEvent(new Event("cine:intro-done"));
  }, []);

  const open = useCallback(() => {
    if (skipIntro.current) return;
    timers.current.forEach(clearTimeout);
    document.documentElement.setAttribute("data-intro-phase", "open");
    setPhase("open");
    timers.current = [setTimeout(finish, openMs)];
  }, [finish]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (skipIntro.current === null) {
      skipIntro.current = hasSeenIntro() || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.cookie = `${cinematicIntroCookieName}=1; path=/; samesite=lax`;
    }
    if (skipIntro.current) {
      root.setAttribute("data-intro-seen", "");
      return;
    }

    root.setAttribute("data-intro-playing", "");
    root.setAttribute("data-intro-phase", "hold");
    timers.current = [
      setTimeout(open, holdMs),
      setTimeout(() => setLogoMode((mode) => (mode === "pending" ? "text" : mode)), logoTimeoutMs),
    ];
    return () => {
      timers.current.forEach(clearTimeout);
      root.removeAttribute("data-intro-playing");
      root.removeAttribute("data-intro-phase");
    };
  }, [open]);

  useEffect(() => {
    if (phase !== "hold" || skipIntro.current) return;
    const skip = () => open();
    const options = { once: true, passive: true } as const;
    window.addEventListener("keydown", skip, options);
    window.addEventListener("wheel", skip, options);
    window.addEventListener("touchmove", skip, options);
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchmove", skip);
    };
  }, [open, phase]);

  if (phase === "done") return null;

  return (
    <div className="cine-intro" data-cinematic-intro data-phase={phase} onClick={open}>
      <span className="cine-intro__bar cine-intro__bar--top" />
      <span className="cine-intro__bar cine-intro__bar--bottom" />
      <div aria-hidden="true" className="cine-intro__stage">
        <span className="cine-intro__line" />
        {logoMode !== "text" ? (
          <div className="cine-intro__logo" data-ready={logoMode === "3d" || undefined}>
            <IntroLogo3D
              onFail={() => setLogoMode("text")}
              onReady={() => setLogoMode((mode) => (mode === "pending" ? "3d" : mode))}
            />
          </div>
        ) : (
          <div className="cine-intro__title">
            {Array.from(title).map((letter, index) => (
              <span key={index} style={{ "--i": index } as React.CSSProperties}>
                {letter === " " ? " " : letter}
              </span>
            ))}
          </div>
        )}
        <p className="cine-intro__subtitle">{logoMode === "text" ? subtitle : `${title} ${subtitle}`}</p>
        <span className="cine-intro__flare" />
      </div>
      <button className="cine-intro__skip" onClick={open} type="button">
        Skip intro
      </button>
    </div>
  );
}
