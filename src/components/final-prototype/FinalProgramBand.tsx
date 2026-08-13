import Image from "next/image";
import Link from "next/link";
import { titleEyebrow, titleHref, titleInlineText, type Title } from "@/lib/content";

/** Final-only program-category rail based on the earlier Continue Watching card band. */
export function FinalProgramBand({ title, titles, viewAllHref }: { title: string; titles: Title[]; viewAllHref: string }) {
  if (!titles.length) return null;

  return (
    <section className="final-program-band" aria-label={title}>
      <header>
        <h2>{title}</h2>
        <Link href={viewAllHref}>View All ↗</Link>
      </header>
      <div className="final-program-band__rail">
        {titles.map((story, index) => {
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
    </section>
  );
}
