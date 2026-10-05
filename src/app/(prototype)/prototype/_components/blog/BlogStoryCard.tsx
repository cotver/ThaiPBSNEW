import Image from "next/image";
import Link from "next/link";
import { titleInlineText, type Title } from "@/lib/content";
import type { PrototypeStyle } from "./blog-data";

export function BlogStoryCard({ priority = false, style, title }: { priority?: boolean; style: PrototypeStyle; title: Title }) {
  const image = title.heroImage || title.posterImage;
  const href = `/prototype/${style}/article/${encodeURIComponent(title.slug)}`;

  return (
    <article className="bp-story-card">
      <Link href={href} aria-label={`Read ${titleInlineText(title)}`}>
        <div className="bp-story-card__image">
          {image ? (
            <Image alt="" className="bp-cover" fill priority={priority} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" src={image} />
          ) : (
            <div className="bp-art-fallback" data-tone={Math.abs(hashCode(title.slug)) % 4} />
          )}
          {title.isNew ? <span className="bp-new-badge">New</span> : null}
        </div>
        <div className="bp-story-card__body">
          <p className="bp-card-meta">{title.genre || "Thai PBS Story"} <span>·</span> {title.duration || "5 min"}</p>
          <h3>{titleInlineText(title)}</h3>
          <p className="bp-card-description">{title.description}</p>
          <span className="bp-card-link">Read story <ArrowIcon /></span>
        </div>
      </Link>
    </article>
  );
}

function hashCode(value: string) {
  return [...value].reduce((total, character) => ((total << 5) - total) + character.charCodeAt(0), 0);
}

export function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14M14 6l6 6-6 6"/></svg>;
}
