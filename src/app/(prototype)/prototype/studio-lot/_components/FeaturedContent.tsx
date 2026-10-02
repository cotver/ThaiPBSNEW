"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { lotProgramHref, type LotLinkItem, type LotProgram } from "../_lib/data";
import styles from "../studio-lot.module.css";
import { Artwork, EmptyNote, ProgramMeta } from "./LotSections";

/** Same hold as the hall's LED walls and /home's HeroCarousel. */
const AUTO_SLIDE_MS = 6500;

/** A hall screen to follow and steer: which slide it shows, and how to put another one up. */
export type HallScreen = { active: number; onActiveChange: (index: number) => void };

/** `href` is left out for a slide with nothing to open; the screen then shows it without a link. */
type Slide = { key: string; title: string; image?: string; href?: string; cursor: string; copy: ReactNode };

/**
 * A screen room in the panel: the big 16:9 screen cycling its slides (as on the hall wall), and every
 * slide beneath it — pick one to put it on the screen, as on /home. Given `screen`, it follows and steers
 * the hall's LED wall; without it, it runs its own clock.
 */
function ScreenContent({ slides, screen, badge, listLabel, empty }: { slides: Slide[]; screen?: HallScreen; badge: string; listLabel: string; empty: string }) {
  const [own, setOwn] = useState(0);
  const [pickKey, setPickKey] = useState(0);
  const following = screen !== undefined;
  const active = Math.min(Math.max(0, following ? screen.active : own), Math.max(0, slides.length - 1));
  const current = slides[active];

  // Our own clock only when nothing else drives the screen; the hall's LED wall keeps time otherwise.
  useEffect(() => {
    if (following || slides.length < 2) return;
    const timer = window.setTimeout(() => setOwn((index) => (index + 1) % slides.length), AUTO_SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [following, own, pickKey, slides.length]);

  if (!current) return <EmptyNote>{empty}</EmptyNote>;

  const pick = (index: number) => {
    setOwn(index);
    setPickKey((key) => key + 1);
    screen?.onActiveChange(index);
  };

  const lead = (
    <>
      <span className={styles.premiereArt}>
        {slides.map((slide, index) => (
          <span aria-hidden={index !== active} className={styles.featureSlide} data-active={index === active || undefined} key={slide.key}>
            <Artwork alt="" priority={index === active} sizes="(max-width: 900px) 100vw, 580px" src={slide.image} tone={index} />
          </span>
        ))}
        <span className={styles.premiereBadge}>
          <span className={styles.recDot} /> {badge} · {active + 1}/{slides.length}
        </span>
      </span>
      <span className={styles.premiereCopy}>{current.copy}</span>
    </>
  );

  return (
    <div className={styles.premiere}>
      {current.href ? (
        <Link className={styles.premiereLead} data-cursor={current.cursor} href={current.href}>
          {lead}
        </Link>
      ) : (
        <div className={styles.premiereLead}>{lead}</div>
      )}

      {/* Shown even for a single slide, so every screen room reads the same. */}
      {slides.length ? (
        <ol aria-label={listLabel} className={styles.featureList}>
          {slides.map((slide, index) => (
            <li key={slide.key}>
              <button
                aria-label={`Show ${slide.title}`}
                aria-pressed={index === active}
                className={styles.featurePick}
                data-cursor="Put it on the screen"
                onClick={() => pick(index)}
                type="button"
              >
                <span className={styles.orderThumb}>
                  <Artwork alt="" sizes="(max-width: 700px) 45vw, 180px" src={slide.image} tone={index} />
                </span>
                <span className={styles.featurePickTitle}>{slide.title}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

/** HeroCarousel: the featured programmes. */
export function FeaturedContent({ programs, screen }: { programs: LotProgram[]; screen?: HallScreen }) {
  const slides = programs.map((program) => ({
    key: program.slug,
    title: program.title,
    image: program.hero,
    // Hero images and discontinued programs have no program page to open, as on /home.
    href: program.linkable ? lotProgramHref(program.slug) : undefined,
    cursor: "Enter the screening room",
    copy: (
      <>
        <ProgramMeta program={program} />
        <span className={styles.premiereTitle}>{program.title}</span>
        <span className={styles.premiereText}>{program.description}</span>
        {program.linkable ? <span className={styles.textLink}>{program.trailerUrl ? "Screen the trailer" : "Open the program"} →</span> : null}
      </>
    ),
  }));
  return <ScreenContent badge="Now screening" empty="No featured programs yet." listLabel="All featured programs" screen={screen} slides={slides} />;
}

/** StudiosHero (ThaiPBS Journal): the featured stories. */
export function StoryScreenContent({ items, screen, viewAllHref }: { items: LotLinkItem[]; screen?: HallScreen; viewAllHref?: string }) {
  const slides = items.map((item) => ({
    key: item.id,
    title: item.title,
    image: item.image,
    href: item.href,
    cursor: `Open ${item.title}`,
    copy: (
      <>
        {item.meta ? <p className={styles.meta}>{item.meta}</p> : null}
        <span className={styles.premiereTitle}>{item.title}</span>
        <span className={styles.textLink}>Read the story →</span>
      </>
    ),
  }));
  return (
    <div className={styles.shortlist}>
      <ScreenContent badge="On screen" empty="No stories yet." listLabel="All stories" screen={screen} slides={slides} />
      {viewAllHref ? (
        <Link className={styles.primaryButton} href={viewAllHref}>
          View all
        </Link>
      ) : null}
    </div>
  );
}
