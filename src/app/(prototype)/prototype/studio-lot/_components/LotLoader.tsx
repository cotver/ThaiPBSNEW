"use client";

import styles from "../experience.module.css";

/** Static leader shown while the server prepares data and while the device is being probed. */
export function RouteLeader() {
  return (
    <div className={styles.routeLoader} role="status">
      <div className={styles.leader}>
        <div aria-hidden="true" className={styles.leaderDial}>
          <span className={styles.leaderHand} />
          <span className={styles.leaderCross} />
          <span className={styles.leaderRing} />
          <span className={styles.leaderCount}>3</span>
        </div>
        <div className={styles.leaderMeta}>
          <span>Thai PBS · Studio Lot</span>
          <span>Hanging the work</span>
        </div>
        <span className={styles.srOnly}>Loading</span>
      </div>
    </div>
  );
}

/**
 * Academy-leader countdown driven by real load progress, then a film-gate reveal.
 * The number counts down as assets arrive — it never lies about how long is left.
 */
export function LotLoader({ phase, progress, reducedMotion }: { phase: "loading" | "reveal" | "live"; progress: number; reducedMotion: boolean }) {
  if (phase === "live") return null;
  const count = progress < 0.34 ? 3 : progress < 0.67 ? 2 : 1;
  const percent = Math.round(progress * 100);

  return (
    <div className={styles.loader} data-phase={phase} data-reduced={reducedMotion || undefined} role="status" aria-live="polite">
      <div aria-hidden="true" className={styles.gateTop} />
      <div aria-hidden="true" className={styles.gateBottom} />
      <div className={styles.leader}>
        <div aria-hidden="true" className={styles.leaderDial}>
          <span className={styles.leaderHand} />
          <span className={styles.leaderCross} />
          <span className={styles.leaderRing} />
          <span className={styles.leaderCount} key={count}>
            {count}
          </span>
        </div>
        <div className={styles.leaderMeta}>
          <span>Thai PBS · Studio Lot</span>
          <span>{phase === "reveal" ? "Rolling" : `Hanging works ${String(percent).padStart(3, "0")}%`}</span>
        </div>
        <p className={styles.leaderTitle}>
          Opening night
          <span>คืนเปิดนิทรรศการ</span>
        </p>
        <span className={styles.srOnly}>{phase === "reveal" ? "Studio lot ready" : `Loading studio lot, ${percent} percent`}</span>
      </div>
    </div>
  );
}
