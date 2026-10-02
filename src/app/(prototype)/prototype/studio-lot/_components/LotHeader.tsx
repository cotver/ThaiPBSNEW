"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { lotBase } from "../_lib/data";
import { cue, onSoundChange, setSoundEnabled, soundEnabled } from "../_lib/sound";
import styles from "../studio-lot.module.css";

const subscribeScroll = (onChange: () => void) => {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
};
const isScrolled = () => window.scrollY > 24;

/** The gallery renders its walk controls (progress + rooms) into this header slot. */
export const walkSlotId = "lot-walk-slot";

export function LotHeader() {
  const pathname = usePathname();
  const sound = useSyncExternalStore(onSoundChange, soundEnabled, () => false);
  const scrolled = useSyncExternalStore(subscribeScroll, isScrolled, () => false);

  return (
    <header className={styles.header} data-lot-header data-scrolled={scrolled || undefined}>
      <Link aria-label="Studio Lot home" className={styles.brand} data-cursor="Back to the gallery" href={lotBase}>
        <span aria-hidden="true" className={styles.tally} />
        <span className={styles.brandText}>
          <strong>Thai PBS</strong>
          <span>Studio Lot</span>
        </span>
      </Link>

      <div className={styles.walkSlot} id={walkSlotId}>
        {pathname === lotBase ? null : (
          <Link className={styles.backLink} data-cursor="Back to the gallery" href={lotBase} onMouseEnter={() => cue("tick")}>
            <span aria-hidden="true">←</span> Back to the gallery
          </Link>
        )}
      </div>

      <div className={styles.headerTools}>
        <button
          aria-label={sound ? "Turn interface sound off" : "Turn interface sound on"}
          aria-pressed={sound}
          className={styles.soundToggle}
          data-cursor={sound ? "Sound on" : "Sound off"}
          onClick={() => setSoundEnabled(!sound)}
          type="button"
        >
          <span aria-hidden="true" className={styles.soundBars} data-on={sound || undefined}>
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className={styles.soundLabel}>{sound ? "Sound" : "Muted"}</span>
        </button>
        <Link className={styles.classicLink} data-cursor="Classic site" href="/home">
          Classic
        </Link>
      </div>
    </header>
  );
}
