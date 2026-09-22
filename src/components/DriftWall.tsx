"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import styles from "./DriftWall.module.css";

type WallItem = { image: string; label: string };

const COLUMNS = 10;
const ROWS = 10;

export function DriftWall({ items }: { items: WallItem[] }) {
  const planeRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const plane = planeRef.current;
    if (!plane) return;

    let cancelled = false;
    const uniqueImages = new Map<string, HTMLImageElement>();
    plane.querySelectorAll("img").forEach((image) => {
      const source = image.currentSrc || image.src;
      if (source && !uniqueImages.has(source)) uniqueImages.set(source, image);
    });

    Promise.all([...uniqueImages.values()].map((image) => image.decode().catch(() => undefined)))
      .then(() => {
        if (!cancelled) setReady(true);
      });

    return () => { cancelled = true; };
  }, [items]);

  if (!items.length) return null;

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const plane = planeRef.current;
    if (!plane || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    plane.style.setProperty("--pointer-x", `${((event.clientX - bounds.left) / bounds.width - .5) * 4.8}deg`);
    plane.style.setProperty("--pointer-y", `${((event.clientY - bounds.top) / bounds.height - .5) * -4.8}deg`);
  };

  const handlePointerLeave = () => {
    planeRef.current?.style.setProperty("--pointer-x", "0deg");
    planeRef.current?.style.setProperty("--pointer-y", "0deg");
  };

  return (
    <div aria-hidden="true" className={`${styles.wall} ${ready ? styles.ready : ""}`} onPointerLeave={handlePointerLeave} onPointerMove={handlePointerMove}>
      <div className={styles.plane} ref={planeRef}>
        {Array.from({ length: COLUMNS }, (_, column) => {
          const tiles = Array.from({ length: ROWS }, (_, row) => items[(column * 3 + row) % items.length]);
          const duration = 45 / (1 + (column - 4) * .035);
          const trackStyle = {
            animationDuration: `${duration}s`,
            animationDelay: `${-duration * ((column * .19) % 1)}s`,
          } satisfies CSSProperties;

          return (
            <div className={styles.column} key={column}>
              <div className={`${styles.track} ${column % 2 ? styles.down : styles.up}`} style={trackStyle}>
                {[0, 1, 2].map((copy) => (
                  <div className={styles.sequence} key={copy}>
                    {tiles.map((item, row) => (
                      <div className={styles.tile} key={`${copy}-${row}`}>
                        <span className={styles.inner}>
                          <Image
                            alt=""
                            fill
                            loading={column === 0 && row === 0 && copy === 0 ? undefined : "eager"}
                            preload={column === 0 && row === 0 && copy === 0}
                            sizes="(max-width: 639px) 60vw, (max-width: 1023px) 42vw, (max-width: 1919px) 25vw, (max-width: 2999px) 18vw, 13vw"
                            src={item.image}
                            style={{ objectPosition: items.length === 1 ? `center ${((column * 3 + row) % 5) * 25}%` : "center" }}
                          />
                          <span className={styles.tint} />
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
