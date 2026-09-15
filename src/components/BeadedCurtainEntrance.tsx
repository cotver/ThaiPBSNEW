"use client";

import { useEffect, useRef } from "react";
import { CrystalCurtainCanvas } from "./CrystalCurtainCanvas";
import styles from "./BeadedCurtainEntrance.module.css";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const doorOpenStart = 0.6;
const doorOpenEnd = 0.86;

export function BeadedCurtainEntrance({ title }: { title: string }) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let pointerFrame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    function renderScrollState() {
      const rect = section!.getBoundingClientRect();
      const value = reducedMotion
        ? 0.78
        : clamp(-rect.top / Math.max(1, rect.height - window.innerHeight), 0, 1);
      section!.style.setProperty("--curtain-progress", value.toFixed(3));
      section!.style.setProperty(
        "--door-open",
        clamp((value - doorOpenStart) / (doorOpenEnd - doorOpenStart), 0, 1).toFixed(3),
      );
      section!.style.setProperty("--door-approach", clamp((value - 0.78) / 0.22, 0, 1).toFixed(3));
    }

    renderScrollState();

    function renderPointerState() {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      section!.style.setProperty("--pointer-x", currentX.toFixed(3));
      section!.style.setProperty("--pointer-y", currentY.toFixed(3));
      if (Math.abs(targetX - currentX) > 0.002 || Math.abs(targetY - currentY) > 0.002) {
        pointerFrame = window.requestAnimationFrame(renderPointerState);
      }
    }

    function setPointerTarget(x: number, y: number) {
      targetX = x;
      targetY = y;
      window.cancelAnimationFrame(pointerFrame);
      pointerFrame = window.requestAnimationFrame(renderPointerState);
    }

    function handlePointerMove(event: PointerEvent) {
      if (reducedMotion) return;
      setPointerTarget(
        clamp((event.clientX / window.innerWidth - 0.5) * 2, -1, 1),
        clamp((event.clientY / window.innerHeight - 0.5) * 2, -1, 1),
      );
    }

    function handlePointerLeave() {
      setPointerTarget(0, 0);
    }

    window.addEventListener("scroll", renderScrollState, { passive: true });
    window.addEventListener("resize", renderScrollState);
    section.addEventListener("pointermove", handlePointerMove, { passive: true });
    section.addEventListener("pointerleave", handlePointerLeave);
    return () => {
      window.cancelAnimationFrame(pointerFrame);
      window.removeEventListener("scroll", renderScrollState);
      window.removeEventListener("resize", renderScrollState);
      section.removeEventListener("pointermove", handlePointerMove);
      section.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  return (
    <section
      aria-label={`เข้าสู่ ${title}`}
      className={styles.entrance}
      data-door-open-end={doorOpenEnd}
      data-studios-entrance
      ref={sectionRef}
    >
      <div className={styles.stage}>
        <div className={styles.backdrop}>
          <div className={styles.hallGlow} />
          <div className={styles.hallFloor} />
          <div className={styles.doorway} aria-hidden="true">
            <div className={styles.interior}>
              <div className={styles.innerArch} />
              <div className={styles.innerFloor} />
            </div>
            <div className={`${styles.doorLeaf} ${styles.doorLeafLeft}`} />
            <div className={`${styles.doorLeaf} ${styles.doorLeafRight}`} />
            <div className={styles.threshold} />
          </div>
          <div className={styles.portalTextWindow} aria-hidden="true">
            <span className={styles.portalMark} data-text={title}>{title}</span>
          </div>
        </div>
        <div className={styles.frame} aria-hidden="true" />
        <div className={styles.canopy}>
          <CrystalCurtainCanvas className={styles.canvas} entranceRef={sectionRef} />
          <div className={styles.rod} aria-hidden="true"><span /><strong>{title}</strong><span /></div>
        </div>
        <div className={styles.intro}>
          <span className={styles.eyebrow}>BEHIND THE STORIES</span>
          <h2>Step inside<br /><em>our stories.</em></h2>
          <p>เลื่อนลงเพื่อเปิดม่านและเข้าสู่โลกของเรื่องราว</p>
        </div>
        <div className={styles.scrollCue} aria-hidden="true"><span>SCROLL TO ENTER</span><i /></div>
      </div>
    </section>
  );
}
