"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Icon } from "@/components/AppShell";
import { navItems } from "@/lib/content";
import { lotGalleryHref } from "@/lib/studio/data";
import styles from "@/components/studio/studio-lot.module.css";

const subscribeScroll = (onChange: () => void) => {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
};
const isScrolled = () => window.scrollY > 24;

/** The site navigation's own Search entry (AppShell), so the lot's search goes where the site's does. */
const search = navItems.find((item) => item.icon === "search");

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

      <div className={styles.walkSlot} id={walkSlotId} />

      {/* Search, as in the site's navigation; from the gallery it opens over it as a modal (@lotModal). */}
      <div className={styles.headerTools}>
        {search ? (
          <Link aria-label={search.label} className={styles.searchLink} data-cursor={search.label} href={search.href}>
            <Icon active={pathname.startsWith(search.href)} name={search.icon} />
          </Link>
        ) : null}
      </div>
    </header>
  );
}
