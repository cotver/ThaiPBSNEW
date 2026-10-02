"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { lotBase } from "../_lib/data";
import { cue } from "../_lib/sound";
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

      {/* Keeps the walk centred in the header's three-column grid. */}
      <div aria-hidden="true" className={styles.headerTools} />
    </header>
  );
}
