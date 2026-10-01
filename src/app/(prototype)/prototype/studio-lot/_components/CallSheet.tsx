"use client";

import type { LotData } from "../_lib/data";
import styles from "../studio-lot.module.css";
import { LotFooter, RoomContent } from "./LotSections";

/**
 * The gallery as a printed exhibition guide: the same rooms, in the same order as /home,
 * as a readable scrolling page. Used on phones, without WebGL, and whenever a list is preferred.
 */
export function CallSheet({ data, notice, onEnterLot }: { data: LotData; notice?: string; onEnterLot?: () => void }) {
  return (
    <main className={styles.sheet}>
      <header className={styles.sheetHero}>
        <p className={styles.kicker}>
          <span className={styles.recDot} /> Exhibition guide · Opening night
        </p>
        <h1 className={styles.sheetTitle}>
          Studio Lot
          <span>นิทรรศการรายการ Thai PBS</span>
        </h1>
        <p className={styles.lede}>Every section of the Thai PBS catalogue, hung room by room. Walk through, step closer, and open anything that catches your eye.</p>
        {notice ? <p className={styles.notice}>{notice}</p> : null}
        <div className={styles.buttonRow}>
          {onEnterLot ? (
            <button className={styles.primaryButton} data-cursor="Walk the gallery in 3D" onClick={onEnterLot} type="button">
              Walk the gallery in 3D
            </button>
          ) : null}
          {data.rooms[0] ? (
            <a className={styles.ghostButton} href={`#${data.rooms[0].id}`}>
              Start with {data.rooms[0].title}
            </a>
          ) : null}
        </div>
        <ol className={styles.sheetIndex}>
          {data.rooms.map((room) => (
            <li key={room.id}>
              <a href={`#${room.id}`}>{room.title}</a>
            </li>
          ))}
        </ol>
      </header>

      {data.rooms.map((room) => (
        <section aria-labelledby={`${room.id}-title`} className={styles.sheetSection} id={room.id} key={room.id}>
          <header className={styles.sheetSectionHeader}>
            <div>
              <p className={styles.kicker}>{room.thai}</p>
              <h2 id={`${room.id}-title`}>{room.title}</h2>
              <p className={styles.sectionBlurb}>{room.blurb}</p>
            </div>
          </header>
          <RoomContent room={room} />
        </section>
      ))}
      <LotFooter />
    </main>
  );
}
