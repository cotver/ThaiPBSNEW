"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { titleEyebrow, titleHref, titleInlineText, type Title } from "@/lib/content";

/** Final-only program-category rail based on the earlier Continue Watching card band. */
export function FinalProgramBand({ title, titles, viewAllHref }: { title: string; titles: Title[]; viewAllHref: string }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const visibleTitles = titles.slice(0, 21);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const update = () => {
      const maxScroll = rail.scrollWidth - rail.clientWidth;
      setCanScrollLeft(rail.scrollLeft > 2);
      setCanScrollRight(rail.scrollLeft < maxScroll - 2);
    };
    rail.scrollLeft = 0;
    update();
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { rail.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [titles]);

  if (!titles.length) return null;

  function scroll(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;
    const firstCard = rail.firstElementChild as HTMLElement | null;
    if (!firstCard) return;
    const styles = window.getComputedStyle(rail);
    const gap = Number.parseFloat(styles.gap) || 0;
    const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0;
    const paddingRight = Number.parseFloat(styles.paddingRight) || 0;
    const step = firstCard.offsetWidth + gap;
    const visibleCards = Math.max(1, Math.round((rail.clientWidth - paddingLeft - paddingRight + gap) / step));
    const currentCard = Math.round(rail.scrollLeft / step);
    const targetCard = Math.max(0, currentCard + direction * Math.max(1, visibleCards - 1));
    rail.scrollTo({ behavior: "smooth", left: Math.min(rail.scrollWidth - rail.clientWidth, targetCard * step) });
  }

  return (
    <section className="final-program-band" aria-label={title}>
      <header>
        <h2>{title}</h2>
        <Link href={viewAllHref}>View All ↗</Link>
      </header>
      <div className="final-program-band__stage">
        {canScrollLeft && <button aria-label={`Scroll ${title} left`} className="final-program-band__arrow is-left" onClick={() => scroll(-1)} type="button">‹</button>}
        <div className="final-program-band__rail" ref={railRef}>
        {visibleTitles.map((story, index) => {
          const image = story.posterImage || story.heroImage;
          return (
            <Link className="final-program-band__card" href={titleHref(story.slug)} key={story.slug}>
              <div className="final-program-band__image">
                {image ? <Image alt="" fill loading={index < 4 ? "eager" : "lazy"} sizes="(max-width: 640px) 68vw, 25vw" src={image} /> : <span className={`final-program-band__fallback bg-gradient-to-br ${story.tone}`} />}
              </div>
              <p>{String(index + 1).padStart(2, "0")} / {titleEyebrow(story)}</p>
              <h3>{titleInlineText(story)}</h3>
              {(story.duration || story.year) && <small>{story.duration || story.year}</small>}
            </Link>
          );
        })}
        </div>
        {canScrollRight && <button aria-label={`Scroll ${title} right`} className="final-program-band__arrow is-right" onClick={() => scroll(1)} type="button">›</button>}
      </div>
    </section>
  );
}
