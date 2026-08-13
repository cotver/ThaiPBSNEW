import Image from "next/image";
import Link from "next/link";
import { titleEyebrow, titleHref, titleInlineText, type Title } from "@/lib/content";

/** Final-only adaptation of Style 10's Recommended rail. */
export function FinalContinueFeatured({ titles, viewAllHref }: { titles: Title[]; viewAllHref: string }) {
  if (!titles.length) return null;

  return (
    <section aria-label="Continue Watching" className="final-continue-latest">
      <header className="final-continue-latest__heading">
        <h2>Continue Watching</h2>
        <Link href={viewAllHref}>View All ↗</Link>
      </header>
      <div className="final-continue-latest__grid">
        {titles.map((story, index) => {
          const image = story.heroImage || story.posterImage;
          return (
            <Link className="final-continue-latest__story" href={titleHref(story.slug)} key={story.slug}>
              <div className="final-continue-latest__image">
                {image ? <Image alt="" fill loading={index < 4 ? "eager" : "lazy"} sizes="(max-width: 640px) 48vw, 31vw" src={image} /> : <i className={`final-continue-latest__fallback bg-gradient-to-br ${story.tone}`} />}
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
    </section>
  );
}
