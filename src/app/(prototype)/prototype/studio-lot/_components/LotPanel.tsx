"use client";

import { useEffect, useRef } from "react";
import type { LotData, LotSectionId } from "../_lib/data";
import styles from "../experience.module.css";
import type { HallScreen } from "./FeaturedContent";
import { RoomContent } from "./LotSections";

/** Room panel that unfolds beside the wall once the camera has settled on it. */
export function LotPanel({ data, screen, onClose, onSelect, section }: { data: LotData; screen?: HallScreen; onClose: () => void; onSelect: (section: LotSectionId) => void; section: LotSectionId }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const index = Math.max(0, data.rooms.findIndex((room) => room.id === section));
  const room = data.rooms[index];
  const next = data.rooms[(index + 1) % data.rooms.length];

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [section]);

  if (!room) return null;

  return (
    <aside aria-labelledby="lot-panel-title" className={styles.panel} data-kind={room.kind} role="dialog">
      <div aria-hidden="true" className={styles.panelScan} />
      <header className={styles.panelHeader}>
        <div>
          <p className={styles.panelKicker}>{room.thai}</p>
          <h2 className={styles.panelTitle} id="lot-panel-title" ref={headingRef} tabIndex={-1}>
            {room.title}
          </h2>
          <p className={styles.panelBlurb}>{room.blurb}</p>
        </div>
        <button aria-label="Back to the gallery" className={styles.panelClose} data-cursor="Back to the gallery" onClick={onClose} type="button">
          <span aria-hidden="true">Esc</span>
        </button>
      </header>

      <div className={styles.panelBody}>
        <RoomContent room={room} screen={screen} />
      </div>

      {data.rooms.length > 1 ? (
        <footer className={styles.panelFooter}>
          <button className={styles.panelNext} data-cursor={`Walk to ${next.title}`} onClick={() => onSelect(next.id)} type="button">
            <span>Next room</span>
            <strong>
              {next.title} →
            </strong>
          </button>
        </footer>
      ) : null}
    </aside>
  );
}
