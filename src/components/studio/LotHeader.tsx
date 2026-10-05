"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { lotGalleryHref } from "@/lib/studio/data";
import { cue } from "@/lib/studio/sound";
import styles from "@/components/studio/studio-lot.module.css";

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
      <Link aria-label="ThaiPBS Studio gallery home" className={styles.brand} data-cursor="Back to the gallery" href={lotGalleryHref}>
        <span aria-hidden="true" className={styles.tally} />
        <span className={styles.brandText}>
          <strong>ThaiPBS</strong>
          <span>Studio</span>
        </span>
      </Link>

      <div className={styles.walkSlot} id={walkSlotId}>
        {/* The gallery is /home itself; its own pages (/home/studio/…) get a way back. */}
        {pathname === "/home" ? null : (
          <Link className={styles.backLink} data-cursor="Back to the gallery" href={lotGalleryHref} onMouseEnter={() => cue("tick")}>
            <span aria-hidden="true">←</span> Back to the gallery
          </Link>
        )}
      </div>

      {/* Keeps the walk centred in the header's three-column grid. */}
      <div aria-hidden="true" className={styles.headerTools} />
    </header>
  );
}
