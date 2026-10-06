import type { ReactNode } from "react";
import { MarketEventModalShell } from "@/components/studios/MarketEventModalShell";
import { plexThai } from "@/lib/studio/font";
import lot from "./studio-lot.module.css";
import styles from "./modal.module.css";

/**
 * A page opened from the Studio Lot: shown over the gallery in a modal, so the 3D walk stays loaded
 * underneath. Refreshing or sharing the URL still gives the full page (see app/(site)/home/studio/@lotModal).
 */
export function StudioModal({ children, title }: { children: ReactNode; title: string }) {
  return (
    <MarketEventModalShell closeLabel={`Close ${title}`} dialogClassName={styles.dialog} overlayClassName={styles.overlay} title={title}>
      <div className={`${plexThai.variable} ${lot.root}`}>{children}</div>
    </MarketEventModalShell>
  );
}
