import Image from "next/image";
import Link from "next/link";
import { titleEyebrow, titleHref, titleInlineText, type Title } from "@/lib/content";

export function FinalYearMotion({ titles, viewAllHref, year }: { titles: Title[]; viewAllHref: string; year: number }) {
  if (!titles.length) return null;

  return (
    <section className="final-year-motion" aria-label={`ThaiPBS Year ${year}`}>
      <header className="final-year-motion__heading">
        <div>
          <h2>ThaiPBS Year {year}</h2>
        </div>
        <Link href={viewAllHref}>View All <b>›</b></Link>
      </header>

      <div className="final-year-motion__grid">
        {titles.slice(0, 11).map((item, index) => {
          const image = index === 0 ? item.heroImage || item.posterImage : item.posterImage || item.heroImage;
          return (
            <Link className={index === 0 ? "final-year-motion__card is-featured" : "final-year-motion__card"} href={titleHref(item.slug)} key={item.slug}>
              <div className="final-year-motion__image">
                {image ? <Image alt="" fill sizes={index === 0 ? "(max-width: 980px) 100vw, 34vw" : "(max-width: 640px) 50vw, (max-width: 980px) 50vw, 17vw"} src={image} /> : <span className={`final-year-motion__fallback bg-gradient-to-br ${item.tone}`} />}
              </div>
              <div className="final-year-motion__copy">
                <p>{titleEyebrow(item)}</p>
                <h3>{titleInlineText(item)}</h3>
                {index === 0 && item.description && <span>{item.description}</span>}
                <small>{[item.year, item.duration].filter(Boolean).join(" · ")}</small>
                <i aria-hidden="true">↗</i>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
