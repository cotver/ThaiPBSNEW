"use client";

import { useEffect, useRef } from "react";
import styles from "./BeadedCurtainEntrance.module.css";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const doorOpenStart = 0.6;
const doorOpenEnd = 0.86;

function makeBeadSprite(): HTMLCanvasElement {
  const sprite = document.createElement("canvas");
  sprite.width = 48;
  sprite.height = 48;
  const context = sprite.getContext("2d");
  if (!context) return sprite;

  const shine = context.createRadialGradient(16, 12, 2, 24, 24, 23);
  shine.addColorStop(0, "#f5b692");
  shine.addColorStop(0.22, "#b84c42");
  shine.addColorStop(0.62, "#721d2a");
  shine.addColorStop(1, "#2d0a16");
  context.fillStyle = shine;
  context.beginPath();
  context.arc(24, 24, 22, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(255, 190, 136, .3)";
  context.lineWidth = 1.3;
  context.stroke();
  return sprite;
}

function makeDropSprite(): HTMLCanvasElement {
  const sprite = document.createElement("canvas");
  sprite.width = 64;
  sprite.height = 80;
  const context = sprite.getContext("2d");
  if (!context) return sprite;

  const shine = context.createLinearGradient(10, 7, 54, 69);
  shine.addColorStop(0, "#f3ae85");
  shine.addColorStop(0.28, "#a7343a");
  shine.addColorStop(0.7, "#641723");
  shine.addColorStop(1, "#260916");
  context.beginPath();
  context.moveTo(32, 4);
  context.bezierCurveTo(41, 8, 42, 22, 37, 32);
  context.bezierCurveTo(49, 35, 55, 48, 49, 61);
  context.bezierCurveTo(43, 75, 21, 75, 15, 61);
  context.bezierCurveTo(9, 48, 15, 35, 27, 32);
  context.bezierCurveTo(22, 22, 23, 8, 32, 4);
  context.closePath();
  context.fillStyle = shine;
  context.fill();
  context.strokeStyle = "rgba(255,194,145,.36)";
  context.lineWidth = 1.5;
  context.stroke();
  context.beginPath();
  context.ellipse(23, 45, 5, 11, -0.3, 0, Math.PI * 2);
  context.fillStyle = "rgba(255,220,185,.25)";
  context.fill();
  return sprite;
}

type BeadParticle = {
  x: number;
  y: number;
  z: number;
  oldX: number;
  oldY: number;
  oldZ: number;
  pinned: boolean;
  bottom: boolean;
};

type BeadStrand = { anchorX: number; gap: number; particles: BeadParticle[] };

export function BeadedCurtainEntrance({ title }: { title: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!section || !canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sprite = makeBeadSprite();
    const dropSprite = makeDropSprite();
    const pointer = { x: -1000, y: -1000, previousX: -1000, previousY: -1000, hovered: false };
    let strands: BeadStrand[] = [];
    let width = 0;
    let height = 0;
    let beadSize = 0;
    let physicsScale = 0;
    let lastFrame = 0;
    let frame = 0;
    let visible = false;

    function buildCurtain() {
      const strandCount = clamp(Math.round(width / 18), 38, 104);
      const spacing = width / (strandCount - 1);
      const beadGap = clamp(height / 33, 17, 23);
      beadSize = clamp(spacing * 0.83, 11, 17);
      physicsScale = spacing / 0.28;
      strands = Array.from({ length: strandCount }, (_, strand) => {
        const u = strand / (strandCount - 1);
        const lengthRatio = 0.52 + 0.48 * (1 - Math.sin(u * Math.PI));
        const count = Math.max(7, Math.ceil((height * lengthRatio - 28) / beadGap));
        const anchorX = strand * spacing;
        return {
          anchorX,
          gap: beadGap,
          particles: Array.from({ length: count }, (_, bead): BeadParticle => {
            const y = 34 + bead * beadGap;
            return { x: anchorX, y, z: 0, oldX: anchorX, oldY: y, oldZ: 0, pinned: bead === 0, bottom: bead === count - 1 };
          }),
        };
      });
    }

    function resize() {
      width = canvas!.clientWidth;
      height = canvas!.clientHeight;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas!.width = Math.round(width * pixelRatio);
      canvas!.height = Math.round(height * pixelRatio);
      context!.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      buildCurtain();
      render(false);
    }

    function progress() {
      if (reducedMotion) return 0.78;
      const rect = section!.getBoundingClientRect();
      return clamp(-rect.top / Math.max(1, rect.height - window.innerHeight), 0, 1);
    }

    function updatePhysics(now: number) {
      const dt = Math.min((now - lastFrame) / 1000, 0.032) || 0.016;
      lastFrame = now;
      if (reducedMotion) return;

      // The reference applies one soft pointer impulse, then lets the constrained chains swing.
      if (pointer.hovered) {
        let velocityX = pointer.x - pointer.previousX;
        let velocityY = pointer.y - pointer.previousY;
        const velocityLength = Math.hypot(velocityX, velocityY);
        const maxVelocity = physicsScale * 0.35;
        if (velocityLength > maxVelocity) {
          velocityX *= maxVelocity / velocityLength;
          velocityY *= maxVelocity / velocityLength;
        }
        const radius = physicsScale * 0.95;
        for (const strand of strands) {
          for (const bead of strand.particles) {
            if (bead.pinned) continue;
            const dx = bead.x - pointer.x;
            const dy = bead.y - pointer.y;
            const distance = Math.hypot(dx, dy, bead.z);
            if (distance >= radius) continue;
            const factor = (1 - (distance / radius) ** 2) * 0.25;
            const safeDistance = Math.max(distance, 0.001);
            bead.x += velocityX * factor * 0.85 + dx / safeDistance * factor * physicsScale * 0.12;
            bead.y += velocityY * factor * 0.35;
            bead.z += factor * physicsScale * 0.4 + Math.abs(velocityX) * factor * 0.3;
          }
        }
        pointer.previousX = pointer.x;
        pointer.previousY = pointer.y;
      }

      for (const strand of strands) {
        for (const bead of strand.particles) {
          if (bead.pinned) continue;
          const velocityX = (bead.x - bead.oldX) * 0.965;
          const velocityY = (bead.y - bead.oldY) * 0.965;
          const velocityZ = (bead.z - bead.oldZ) * 0.965;
          bead.oldX = bead.x;
          bead.oldY = bead.y;
          bead.oldZ = bead.z;
          bead.x += velocityX;
          bead.y += velocityY + 18 * physicsScale * dt * dt;
          bead.z += velocityZ;
        }
      }

      for (let iteration = 0; iteration < 4; iteration++) {
        for (const strand of strands) {
          const particles = strand.particles;
          for (let index = 0; index < particles.length - 1; index++) {
            const first = particles[index];
            const second = particles[index + 1];
            const dx = second.x - first.x;
            const dy = second.y - first.y;
            const dz = second.z - first.z;
            const distance = Math.hypot(dx, dy, dz) || 0.0001;
            const difference = (distance - strand.gap) / distance;
            const firstShare = first.pinned ? 0 : second.pinned ? 1 : 0.5;
            const secondShare = second.pinned ? 0 : first.pinned ? 1 : 0.5;
            first.x += dx * difference * firstShare;
            first.y += dy * difference * firstShare;
            first.z += dz * difference * firstShare;
            second.x -= dx * difference * secondShare;
            second.y -= dy * difference * secondShare;
            second.z -= dz * difference * secondShare;
          }
        }
      }
    }

    function render(advancePhysics: boolean, now = performance.now()) {
      if (!width || !height || !strands.length) return;
      const value = progress();
      const curtainOpen = clamp(value / 0.64, 0, 1);
      section!.style.setProperty("--curtain-progress", value.toFixed(3));
      section!.style.setProperty("--door-open", clamp((value - doorOpenStart) / (doorOpenEnd - doorOpenStart), 0, 1).toFixed(3));
      section!.style.setProperty("--door-approach", clamp((value - 0.78) / 0.22, 0, 1).toFixed(3));

      const open = Math.pow(curtainOpen, 1.28) * (width * 0.54 + beadSize);
      for (let index = 0; index < strands.length; index++) {
        const strand = strands[index];
        const targetX = index * width / (strands.length - 1) + (index < strands.length / 2 ? -open : open);
        const shift = targetX - strand.anchorX;
        if (!shift) continue;
        strand.anchorX = targetX;
        for (const bead of strand.particles) {
          bead.x += shift;
          bead.oldX += shift;
        }
      }
      if (advancePhysics) updatePhysics(now);
      context!.clearRect(0, 0, width, height);

      for (const strand of strands) {
        if (strand.anchorX < -80 || strand.anchorX > width + 80) continue;
        const particles = strand.particles;
        const projected = particles.map((bead) => {
          const perspective = clamp(1 / (1 - bead.z / Math.max(width * 0.75, 400)), 0.8, 1.3);
          return {
            x: width / 2 + (bead.x - width / 2) * perspective,
            y: height / 2 + (bead.y - height / 2) * perspective,
            perspective,
          };
        });
        context!.strokeStyle = "rgba(208,139,104,.4)";
        context!.lineWidth = 1;
        context!.beginPath();
        context!.moveTo(strand.anchorX, 20);
        for (const point of projected) context!.lineTo(point.x, point.y);
        context!.stroke();

        for (let index = 0; index < particles.length; index++) {
          const bead = particles[index];
          const { x, y, perspective } = projected[index];
          if (bead.bottom) {
            const previous = projected[index - 1];
            context!.save();
            context!.translate(x, y);
            context!.rotate(-Math.atan2(x - previous.x, y - previous.y));
            const dropWidth = beadSize * 1.5 * perspective;
            const dropHeight = beadSize * 1.85 * perspective;
            context!.drawImage(dropSprite, -dropWidth / 2, -dropHeight / 2, dropWidth, dropHeight);
            context!.restore();
          } else {
            const size = beadSize * perspective;
            context!.drawImage(sprite, x - size / 2, y - size / 2, size, size);
          }
        }
      }
    }

    function tick(now: number) {
      render(true, now);
      if (visible && !reducedMotion) frame = window.requestAnimationFrame(tick);
    }

    function onPointerMove(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      const x = (event.clientX - rect.left) * width / rect.width;
      const y = (event.clientY - rect.top) * height / rect.height;
      if (x < 0 || x > width || y < 0 || y > height) {
        pointer.hovered = false;
        return;
      }
      if (!pointer.hovered) {
        pointer.previousX = x;
        pointer.previousY = y;
        pointer.hovered = true;
      }
      pointer.x = x;
      pointer.y = y;
    }

    function onPointerLeave() {
      pointer.hovered = false;
      pointer.x = -1000;
      pointer.y = -1000;
    }

    function onScroll() {
      if (visible || reducedMotion) render(false);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      window.cancelAnimationFrame(frame);
      if (visible) {
        lastFrame = 0;
        frame = window.requestAnimationFrame(tick);
      }
    });
    visibilityObserver.observe(section);
    section.addEventListener("pointermove", onPointerMove, { passive: true });
    section.addEventListener("pointerleave", onPointerLeave);
    section.addEventListener("pointercancel", onPointerLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    resize();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      section.removeEventListener("pointermove", onPointerMove);
      section.removeEventListener("pointerleave", onPointerLeave);
      section.removeEventListener("pointercancel", onPointerLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section aria-label={`เข้าสู่ ${title}`} className={styles.entrance} data-studios-entrance data-door-open-end={doorOpenEnd} ref={sectionRef}>
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
            <span className={styles.portalMark}>{title}</span>
          </div>
        </div>
        <div className={styles.frame} aria-hidden="true" />
        <div className={styles.canopy}>
          <div className={styles.roof} aria-hidden="true" />
          <canvas aria-hidden="true" className={styles.canvas} ref={canvasRef} />
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
