import type { ReactNode } from "react";
import { siteContentClassName, siteShellClassName } from "@/components/site-shell";
import { MarketEventModalShell } from "@/components/studios/MarketEventModalShell";
import { plexThai } from "@/lib/studio/font";
import lot from "./studio-lot.module.css";
import styles from "./modal.module.css";

/**
 * A page opened from the Studio Lot: shown over the gallery in a full-window modal, so the 3D walk stays
 * loaded underneath and the page keeps its own proportions. Refreshing or sharing the URL still gives the
 * full page (see app/(site)/home/studio/@lotModal).
 * `site`: one of the site's own pages (/title, /article, …), in the wrappers the site shell gives it.
 * `lot`: one of the lot's pages, in the lot's chrome styles.
 */
export function StudioModal({ children, title, variant = "lot" }: { children: ReactNode; title: string; variant?: "lot" | "site" }) {
  return (
    <MarketEventModalShell closeLabel={`Close ${title}`} dialogClassName={styles.dialog} overlayClassName={styles.overlay} title={title}>
      {variant === "site" ? (
        <div className={siteShellClassName} data-site-shell>
          <div className={siteContentClassName}>{children}</div>
        </div>
      ) : (
        <div className={`${plexThai.variable} ${lot.root} ${styles.lotPage}`}>{children}</div>
      )}
    </MarketEventModalShell>
  );
}
