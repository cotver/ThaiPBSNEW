"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./StudiosShowcase.module.css";

export type StudiosHeroItem = {
  description?: string;
  eyebrow?: string;
  id: number;
  href: string;
  imageAlt: string;
  imageUrl: string;
  title: string;
  videoAlt?: string;
  videoMimeType?: string;
  videoUrl?: string;
};

const AUTO_SLIDE_MS = 6500;

function Chevron() {
  return <span aria-hidden className={styles.chevron} />;
}

function PlayIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9 7 8 5-8 5V7Z" /></svg>;
}

function ArticleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6V3Zm8 2v4h3.5L14 5ZM9 12v2h6v-2H9Zm0 4v2h6v-2H9Z" /></svg>;
}

export function StudiosHero({ items }: { items: StudiosHeroItem[] }) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const current = items[active];

  useEffect(() => {
    if (items.length < 2 || playing) return;

    const timer = window.setTimeout(() => {
      setActive((index) => (index + 1) % items.length);
    }, AUTO_SLIDE_MS);

    return () => window.clearTimeout(timer);
  }, [active, items.length, playing]);

  if (!current) {
    return null;
  }

  function selectSlide(index: number) {
    setPlaying(false);
    setActive(index);
  }

  function moveSlide(direction: number) {
    selectSlide((active + direction + items.length) % items.length);
  }

  return (
    <>
      <div className={styles.hero}>
        {items.map((item, index) => (
          <div
            aria-hidden={index !== active}
            className={`${styles.heroSlide} ${index === active ? styles.activeHeroSlide : ""}`}
            key={item.id}
          >
            <Image
              alt={item.imageAlt}
              className={styles.heroImage}
              fill
              priority={index === 0}
              sizes="100vw"
              src={item.imageUrl}
            />
          </div>
        ))}

        {playing && current.videoUrl ? (
          <video
            aria-label={current.videoAlt || current.title}
            autoPlay
            className={styles.heroVideo}
            controls
            key={current.videoUrl}
            playsInline
            poster={current.imageUrl}
            preload="auto"
          >
            <source src={current.videoUrl} type={current.videoMimeType} />
          </video>
        ) : null}

        {!playing ? <div className={styles.heroShade} /> : null}

        {items.length > 1 ? (
          <>
            <button aria-label="Previous feature" className={`${styles.slideArrow} ${styles.slideArrowLeft}`} onClick={() => moveSlide(-1)} type="button"><Chevron /></button>
            <button aria-label="Next feature" className={`${styles.slideArrow} ${styles.slideArrowRight}`} onClick={() => moveSlide(1)} type="button"><Chevron /></button>
          </>
        ) : null}

        {!playing ? (
          <>
            <div className={styles.heroTitle}>
              <span>Featured</span>
              <h2 id="studios-heading">{current.title}</h2>
              {current.eyebrow ? <p>{current.eyebrow}</p> : null}
              {current.description ? <small>{current.description}</small> : null}
            </div>
            <div className={styles.heroButtons}>
              {current.videoUrl ? (
                <button aria-label={`Play ${current.title}`} onClick={() => setPlaying(true)} type="button"><PlayIcon /></button>
              ) : null}
              <Link aria-label={`Read ${current.title}`} href={current.href}><ArticleIcon /></Link>
            </div>
          </>
        ) : null}
      </div>

      {items.length > 1 ? (
        <div className={styles.dots} aria-label={`Featured slide ${active + 1} of ${items.length}`}>
          {items.map((item, index) => (
            <button
              aria-label={`Show ${item.title}`}
              className={index === active ? styles.activeDot : ""}
              key={item.id}
              onClick={() => selectSlide(index)}
              type="button"
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
