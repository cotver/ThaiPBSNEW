"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { titleEyebrow, titleHref, titleInlineText, type Title } from "@/lib/content";

/** Final-only program-category rail based on the earlier Continue Watching card band. */
export function FinalProgramBand({ title, titles, viewAllHref }: { title: string; titles: Title[]; viewAllHref: string }) {
  const [page, setPage] = useState(0);
  const [cardsPerPage, setCardsPerPage] = useState(7);

  useEffect(() => {
    const updateCardsPerPage = () => {
      const width = window.innerWidth;
      setCardsPerPage(width >= 1536 ? 7 : width >= 1280 ? 6 : width >= 1024 ? 5 : width >= 768 ? 4 : width >= 640 ? 3 : 2);
    };
    updateCardsPerPage();
    window.addEventListener("resize", updateCardsPerPage);
    return () => window.removeEventListener("resize", updateCardsPerPage);
  }, []);

  if (!titles.length) return null;
  const pageCount = Math.ceil(titles.length / cardsPerPage);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  const pageTitles = titles.slice(currentPage * cardsPerPage, (currentPage + 1) * cardsPerPage);

  return (
    <section className="final-program-band" aria-label={title}>
      <header>
        <h2>{title}</h2>
        <Link href={viewAllHref}>View All ↗</Link>
      </header>
      <div className="final-program-band__stage">
        {currentPage > 0 && <button aria-label={`Show previous ${title} programs`} className="final-program-band__arrow is-left" onClick={() => setPage((value) => Math.max(0, value - 1))} type="button">‹</button>}
        <div className="final-program-band__rail">
        {pageTitles.map((story, index) => {
          const image = story.posterImage || story.heroImage;
          return (
            <Link className="final-program-band__card" href={titleHref(story.slug)} key={story.slug}>
              <div className="final-program-band__image">
                {image ? <Image alt="" fill loading={index < 4 ? "eager" : "lazy"} sizes="(max-width: 640px) 68vw, 25vw" src={image} /> : <span className={`final-program-band__fallback bg-gradient-to-br ${story.tone}`} />}
              </div>
              <p>{String(currentPage * cardsPerPage + index + 1).padStart(2, "0")} / {titleEyebrow(story)}</p>
              <h3>{titleInlineText(story)}</h3>
              {(story.duration || story.year) && <small>{story.duration || story.year}</small>}
            </Link>
          );
        })}
        </div>
        {currentPage < pageCount - 1 && <button aria-label={`Show next ${title} programs`} className="final-program-band__arrow is-right" onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} type="button">›</button>}
      </div>
    </section>
  );
}
