"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { finalArticleHref, titleEyebrow, titleInlineText, type Title } from "@/lib/content";

const PROGRAMS_PER_PAGE = 8;
const MAX_PAGES = 3;
const MAX_PROGRAMS = PROGRAMS_PER_PAGE * MAX_PAGES;

export function FinalProgramJournal({ title, titles, viewAllHref }: { title: string; titles: Title[]; viewAllHref: string }) {
  const [page, setPage] = useState(0);
  const limitedTitles = titles.slice(0, MAX_PROGRAMS);
  const pageCount = Math.max(1, Math.ceil(limitedTitles.length / PROGRAMS_PER_PAGE));
  const activePage = Math.min(page, pageCount - 1);
  const visibleTitles = limitedTitles.slice(activePage * PROGRAMS_PER_PAGE, (activePage + 1) * PROGRAMS_PER_PAGE);

  if (!titles.length) return null;

  function move(direction: -1 | 1) {
    setPage((current) => (Math.min(current, pageCount - 1) + direction + pageCount) % pageCount);
  }

  return (
    <section className="final-program-journal" aria-label={title} data-international={title === "International Programs"}>
      <header className="final-program-journal__intro">
        <h2>{title}</h2>
        <Link href={viewAllHref}>View All <b>›</b></Link>
      </header>

      <div className="final-program-journal__content">
        <div className="final-program-journal__cards" key={page}>
          {visibleTitles.map((item) => {
            const image = item.posterImage || item.heroImage;
            return (
              <Link className="final-program-journal__card" href={finalArticleHref(item.slug)} key={item.slug}>
                <div className="final-program-journal__image">
                  {image ? <Image alt="" fill sizes="(max-width: 640px) 72vw, (max-width: 980px) 40vw, 20vw" src={image} /> : <span className={`final-program-journal__fallback bg-gradient-to-br ${item.tone}`} />}
                </div>
                <span>{titleEyebrow(item)}</span>
                <h3>{titleInlineText(item)}</h3>
                <small>{[item.year, item.duration].filter(Boolean).join(" · ")}</small>
              </Link>
            );
          })}
        </div>

        {pageCount > 1 && (
          <nav className="final-program-journal__pagination" aria-label={`${title} pages`}>
            <button aria-label={`Show previous ${title} page`} onClick={() => move(-1)} type="button">←</button>
            <div>{Array.from({ length: pageCount }, (_, index) => <button aria-current={index === activePage ? "page" : undefined} aria-label={`Show ${title} page ${index + 1}`} key={index} onClick={() => setPage(index)} type="button">{String(index + 1).padStart(2, "0")}</button>)}</div>
            <button aria-label={`Show next ${title} page`} onClick={() => move(1)} type="button">→</button>
          </nav>
        )}
      </div>
    </section>
  );
}
