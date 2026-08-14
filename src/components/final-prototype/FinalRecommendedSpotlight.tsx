"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { titleEyebrow, titleHref, titleInlineText, type Title } from "@/lib/content";

const ROTATION_INTERVAL_MS = 15_000;

export function FinalRecommendedSpotlight({ titles }: { titles: Title[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const count = titles.length;
  const activeTitle = titles[activeIndex] ?? titles[0];

  useEffect(() => {
    if (count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % count), ROTATION_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [count]);

  if (!activeTitle) return null;

  function move(direction: -1 | 1) {
    setActiveIndex((index) => (index + direction + count) % count);
  }

  const image = activeTitle.heroImage || activeTitle.posterImage;
  const metadata = [activeTitle.year, activeTitle.duration, activeTitle.rating].filter(Boolean);
  const titleText = titleInlineText(activeTitle);
  const titleLength = titleText.replace(/\s/g, "").length;
  const titleWords = titleText.split(/\s+/).filter(Boolean);
  const longestWordLength = Math.max(...titleWords.map((word) => word.length));
  const titleSize = titleLength > 34 || longestWordLength > 16
    ? "is-very-long"
    : titleLength > 12 || longestWordLength > 11 || titleWords.length > 2
      ? "is-long"
      : "";

  return (
    <section className="final-recommended" aria-label="Recommended For You">
      <div className="final-recommended__copy">
        <Link className="final-recommended__details" href={titleHref(activeTitle.slug)}>
          <p>{titleEyebrow(activeTitle)}</p>
          <h2 className={titleSize}>{titleText}</h2>
          {metadata.length > 0 && <small>{metadata.join(" · ")}</small>}
          {activeTitle.description && <span>{activeTitle.description}</span>}
        </Link>
        <div className="final-recommended__controls">
          <button aria-label="Show previous recommended program" disabled={count < 2} onClick={() => move(-1)} type="button">{"←"}</button>
          <small><b>{String(activeIndex + 1).padStart(2, "0")}</b> / {String(count).padStart(2, "0")}</small>
          <button aria-label="Show next recommended program" disabled={count < 2} onClick={() => move(1)} type="button">{"→"}</button>
        </div>
        <Link className="final-recommended__view-all" href="/browse?section=recommended&label=Recommended%20For%20You">
          View All {"›"}
        </Link>
      </div>

      <Link className="final-recommended__story" href={titleHref(activeTitle.slug)} key={activeTitle.slug}>
        <div className="final-recommended__image">
          {image ? (
            <Image alt="" fill priority={activeIndex === 0} sizes="(max-width: 980px) 100vw, 62vw" src={image} />
          ) : (
            <span className={`final-recommended__fallback bg-gradient-to-br ${activeTitle.tone}`} />
          )}
        </div>
        <span className="final-recommended__action">Explore programme {"↗"}</span>
      </Link>
    </section>
  );
}
