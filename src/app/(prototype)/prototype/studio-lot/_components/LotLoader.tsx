"use client";

import styles from "../experience.module.css";

/**
 * The exhibition's title card: a serif title, a thin progress line and a small spinning ring.
 * The ring and the line only animate `transform`, which stays smooth while the page is busy.
 */
function OpeningCard({ progress, status }: { progress?: number; status: string }) {
  return (
    <div className={styles.opening}>
      <span aria-hidden="true" className={styles.openingSpinner} />
      <p className={styles.openingKicker}>Thai PBS · Programme Collection</p>
      <p className={styles.openingTitle}>
        Studio Lot
        <span>นิทรรศการรายการ Thai PBS</span>
      </p>
      <span aria-hidden="true" className={styles.openingTrack}>
        {progress === undefined ? <span className={styles.openingFill} data-indeterminate="" /> : <span className={styles.openingFill} style={{ transform: `scaleX(${progress})` }} />}
      </span>
      <p className={styles.openingStatus}>{status}</p>
    </div>
  );
}

/** Shown while the server prepares data and while the device is being probed. */
export function RouteLeader() {
  return (
    <div className={styles.routeLoader} role="status">
      <OpeningCard status="Preparing the exhibition" />
      <span className={styles.srOnly}>Loading</span>
    </div>
  );
}

/** Real load progress, then the lights come up on the gallery. */
export function LotLoader({ phase, progress, reducedMotion }: { phase: "loading" | "reveal" | "live"; progress: number; reducedMotion: boolean }) {
  if (phase === "live") return null;
  const percent = Math.round(progress * 100);

  return (
    <div className={styles.loader} data-phase={phase} data-reduced={reducedMotion || undefined} role="status" aria-live="polite">
      <OpeningCard progress={progress} status={phase === "reveal" ? "Opening the doors" : `Hanging the works · ${percent}%`} />
      <span className={styles.srOnly}>{phase === "reveal" ? "Gallery ready" : `Loading the gallery, ${percent} percent`}</span>
    </div>
  );
}
