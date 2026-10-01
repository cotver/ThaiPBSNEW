"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cue } from "../_lib/sound";
import pages from "../pages.module.css";

type State = "idle" | "rolling" | "error";

/**
 * The screen at the front of the room. Artwork first; the trailer only loads when asked,
 * plays with sound (the click is the gesture), and the house lights dim while it runs.
 */
export function ScreeningRoom({ title, poster, trailerUrl, trailerMimeType }: { title: string; poster?: string; trailerUrl?: string; trailerMimeType?: string }) {
  const [state, setState] = useState<State>("idle");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (state !== "rolling") return;
    document.documentElement.dataset.houseLights = "down";
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      cue("back");
      videoRef.current?.pause();
      setState("idle");
    };
    window.addEventListener("keydown", onKey);
    return () => {
      delete document.documentElement.dataset.houseLights;
      window.removeEventListener("keydown", onKey);
    };
  }, [state]);

  const roll = () => {
    cue("open");
    setState("rolling");
  };

  const stop = () => {
    cue("back");
    videoRef.current?.pause();
    setState("idle");
  };

  return (
    <div className={pages.screenWrap} data-state={state}>
      <div aria-hidden="true" className={pages.screenSpill} />
      <div className={pages.screen}>
        {poster ? <Image alt={`Key art for ${title}`} className={pages.screenArt} fill priority sizes="(max-width: 1200px) 100vw, 1200px" src={poster} /> : <span className={pages.screenBlank} />}

        {state === "rolling" && trailerUrl ? (
          <video autoPlay className={pages.screenVideo} controls onEnded={stop} onError={() => setState("error")} playsInline poster={poster} ref={videoRef}>
            <source src={trailerUrl} type={trailerMimeType} />
          </video>
        ) : null}

        {state !== "rolling" ? (
          <div className={pages.screenOverlay}>
            {trailerUrl && state !== "error" ? (
              <button className={pages.playButton} data-cursor="Roll trailer" onClick={roll} type="button">
                <span aria-hidden="true" className={pages.playIcon}>
                  <svg viewBox="0 0 24 24">
                    <path d="m8 5 11 7-11 7V5Z" />
                  </svg>
                </span>
                <span>
                  <strong>Roll the trailer</strong>
                  <small>Sound on · Esc to stop</small>
                </span>
              </button>
            ) : (
              <p className={pages.screenNote}>{state === "error" ? "This trailer can’t play in your browser — request a screener below." : "Trailer available on request for buyers."}</p>
            )}
          </div>
        ) : (
          <button className={pages.stopButton} data-cursor="Stop" onClick={stop} type="button">
            Lights up
          </button>
        )}
      </div>
      <div aria-hidden="true" className={pages.seats} />
    </div>
  );
}
