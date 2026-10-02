"use client";

import type { Ref } from "react";
import type { LotRoom, LotSectionId } from "../_lib/data";
import styles from "../experience.module.css";
import { DragScroller } from "./DragScroller";

/**
 * The room strip in the top bar — one pill with a button per room and a progress line.
 * Shared by the 3D gallery and the list view so both look and behave the same; each supplies what
 * "current", "progress" and "select" mean for it.
 */
export function WalkNav({
  rooms,
  active,
  current,
  near,
  fillRef,
  cursorVerb,
  onSelect,
  onFocusRoom,
  onBlurRoom,
  onHoverRoom,
  markerRef,
}: {
  rooms: LotRoom[];
  /** Room shown as selected (filled pill). */
  active: LotSectionId | null;
  /** Room you are at — kept in view, and marked with aria-current. */
  current: LotSectionId | null;
  /** Room nearest to you (brighter text). */
  near: LotSectionId | null;
  fillRef: Ref<HTMLSpanElement>;
  cursorVerb: string;
  onSelect: (id: LotSectionId) => void;
  onFocusRoom?: (id: LotSectionId) => void;
  onBlurRoom?: () => void;
  onHoverRoom?: (id: LotSectionId | null) => void;
  markerRef?: (id: LotSectionId, element: HTMLButtonElement | null) => void;
}) {
  const follow = active ?? current ?? near;
  return (
    <div className={styles.reel} data-in-header>
      <div className={styles.reelTrack}>
        <span className={styles.reelFill} ref={fillRef} />
      </div>
      <DragScroller ariaLabel="Rooms in the gallery" className={styles.markers} followKey={follow} followSelector="[data-follow]">
        {rooms.map((room) => (
          <button
            aria-current={current === room.id ? "true" : undefined}
            className={styles.marker}
            data-active={active === room.id || undefined}
            data-cursor={`${cursorVerb} ${room.title}`}
            data-follow={follow === room.id || undefined}
            data-near={near === room.id || undefined}
            key={room.id}
            onBlur={onBlurRoom}
            onClick={() => onSelect(room.id)}
            onFocus={() => onFocusRoom?.(room.id)}
            onMouseEnter={() => onHoverRoom?.(room.id)}
            onMouseLeave={() => onHoverRoom?.(null)}
            ref={markerRef ? (element) => markerRef(room.id, element) : undefined}
            type="button"
          >
            <span className={styles.markerName}>{room.title}</span>
          </button>
        ))}
      </DragScroller>
    </div>
  );
}
