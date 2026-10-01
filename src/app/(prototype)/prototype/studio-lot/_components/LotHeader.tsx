"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { lotBase } from "../_lib/data";
import { cue, onSoundChange, setSoundEnabled, soundEnabled } from "../_lib/sound";
import styles from "../studio-lot.module.css";

const links = [
  { href: lotBase, label: "Gallery", exact: true },
  { href: `${lotBase}/programs`, label: "Programs" },
  { href: `${lotBase}/news`, label: "Newsroom" },
  { href: `${lotBase}/shortlist`, label: "Shortlist" },
];

export function LotHeader() {
  const pathname = usePathname();
  const sound = useSyncExternalStore(onSoundChange, soundEnabled, () => false);

  return (
    <header className={styles.header} data-lot-header>
      <Link aria-label="Studio Lot home" className={styles.brand} data-cursor="Back to the gallery" href={lotBase}>
        <span aria-hidden="true" className={styles.tally} />
        <span className={styles.brandText}>
          <strong>Thai PBS</strong>
          <span>Studio Lot</span>
        </span>
      </Link>

      <nav aria-label="Studio Lot" className={styles.nav}>
        {links.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link aria-current={active ? "page" : undefined} className={styles.navLink} data-cursor={link.label} href={link.href} key={link.href} onMouseEnter={() => cue("tick")}>
              {link.label}
            </Link>
          );
        })}
      </nav>

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
