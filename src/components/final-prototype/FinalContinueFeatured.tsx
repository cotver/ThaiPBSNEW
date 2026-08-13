"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { titleEyebrow, titleHref, titleInlineText, type Title } from "@/lib/content";

/** Final-only adaptation of Style 10's Recommended rail. */
export function FinalContinueFeatured({ titles, viewAllHref }: { titles: Title[]; viewAllHref: string }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const update = () => {
      const maxScroll = rail.scrollWidth - rail.clientWidth;
      setCanScrollLeft(rail.scrollLeft > 2);
      setCanScrollRight(rail.scrollLeft < maxScroll - 2);
    };
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
    const gap = Number.parseFloat(window.getComputedStyle(rail).gap) || 0;
    const cardStep = firstCard.offsetWidth + gap;
    const visibleCards = Math.max(1, Math.round((rail.clientWidth + gap) / cardStep));
    rail.scrollBy({ behavior: "smooth", left: direction * visibleCards * cardStep });
  }

  return (
    <section aria-label="Continue Watching" className="final-continue-latest">
      <header className="final-continue-latest__heading">
        <h2>Continue Watching</h2>
        <Link href={viewAllHref}>View All ↗</Link>
      </header>
      <div className="final-continue-latest__stage">
        {canScrollLeft && <button aria-label="Scroll Continue Watching left" className="final-continue-latest__arrow is-left" onClick={() => scroll(-1)} type="button">‹</button>}
        <div className="final-continue-latest__grid" ref={railRef}>
        {titles.map((story, index) => {
          const image = story.heroImage || story.posterImage;
          return (
            <Link className="final-continue-latest__story" href={titleHref(story.slug)} key={story.slug}>
              <div className="final-continue-latest__image">
                {image ? <Image alt="" fill loading={index < 5 ? "eager" : "lazy"} sizes="(max-width: 640px) 82vw, (max-width: 900px) 48vw, (max-width: 1200px) 32vw, (max-width: 1535px) 24vw, 19vw" src={image} /> : <i className={`final-continue-latest__fallback bg-gradient-to-br ${story.tone}`} />}
                {story.progress && <b style={{ width: story.progress }} />}
              </div>
              <div className="final-continue-latest__copy">
                <p>{String(index + 1).padStart(2, "0")} / {titleEyebrow(story)}{story.year ? ` / ${story.year}` : ""}</p>
                <h3>{titleInlineText(story)}</h3>
                <b>Continue watching →</b>
              </div>
            </Link>
          );
        })}
        </div>
        {canScrollRight && <button aria-label="Scroll Continue Watching right" className="final-continue-latest__arrow is-right" onClick={() => scroll(1)} type="button">›</button>}
      </div>
    </section>
  );
}
