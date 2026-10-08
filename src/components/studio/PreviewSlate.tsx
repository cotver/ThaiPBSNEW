"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { lotProgramHref, slateNumber, type LotProgram } from "@/lib/studio/data";
import { cue } from "@/lib/studio/sound";
import styles from "@/components/studio/studio-lot.module.css";
import { Artwork } from "./LotSections";

const previewEvent = "studio-lot:preview";

function playable(program: LotProgram) {
  return Boolean(program.trailerUrl && (!program.trailerMimeType || /mp4|webm|ogg/.test(program.trailerMimeType)));
}

/**
 * Slate card that rolls a muted trailer after the pointer rests on it.
 * Only one preview decodes at a time; nothing loads until there is intent.
 */
export function PreviewSlate({ program, index = 0, sizes }: { program: LotProgram; index?: number; sizes?: string }) {
  const [rolling, setRolling] = useState(false);
  const timer = useRef<number>(0);
  const id = useRef(`${program.slug}-${index}`);

  useEffect(() => {
    const stopOthers = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== id.current) setRolling(false);
    };
    window.addEventListener(previewEvent, stopOthers);
    return () => {
      window.removeEventListener(previewEvent, stopOthers);
      window.clearTimeout(timer.current);
    };
  }, []);

  const intent = () => {
    cue("tick");
    if (!playable(program) || window.matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)").matches) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(previewEvent, { detail: id.current }));
      setRolling(true);
    }, 520);
  };

  const release = () => {
    window.clearTimeout(timer.current);
    setRolling(false);
  };

  return (
    <Link prefetch={false} className={styles.slateCard} data-cursor={playable(program) ? "Rolling · open" : "Screen it"} href={lotProgramHref(program.slug)} onBlur={release} onFocus={intent} onMouseEnter={intent} onMouseLeave={release}>
      <span className={styles.slatePoster}>
        <Artwork alt="" sizes={sizes ?? "(max-width: 700px) 45vw, (max-width: 1200px) 22vw, 220px"} src={program.poster} tone={index} />
        {rolling ? <video aria-hidden="true" autoPlay className={styles.slateVideo} loop muted playsInline poster={program.hero} preload="auto" src={program.trailerUrl} /> : null}
        {program.isNew ? <span className={styles.newTag}>New</span> : null}
        {playable(program) ? <span className={styles.trailerTag} data-rolling={rolling || undefined}>{rolling ? "Rolling" : "Trailer"}</span> : null}
      </span>
      <span className={styles.slateBar}>
        <span>Sc {slateNumber(program.slug)}</span>
        <span>{program.type}</span>
        <span>{program.year}</span>
      </span>
      <span className={styles.slateTitle}>{program.title}</span>
      <span className={styles.slateGenre}>{program.genre}</span>
    </Link>
  );
}
