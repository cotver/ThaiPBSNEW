import Image from "next/image";
import Link from "next/link";
import { titleInlineText, type Title } from "@/lib/content";
import { EditorialCategoryTiles } from "./EditorialCategoryTiles";
import { getEditorialSections, titleCategories, type PrototypeStyle } from "./blog-data";
import type { CategoryTile } from "@/lib/payload-content";

export function EditorialExplore({ categories, excludeSectionIds = [], style, titles }: { categories: CategoryTile[]; excludeSectionIds?: string[]; style: PrototypeStyle; titles: Title[] }) {
  const sections = getEditorialSections(titles).filter((section) => !excludeSectionIds.includes(section.id));

  return (
    <div className="bp-explore">
      <EditorialCategoryTiles categories={categories} style={style} />
      {sections.map((section, sectionIndex) => (
        <section className="bp-editorial-section" key={section.id}>
          <div className="bp-editorial-heading">
            <div><span>{String(sectionIndex + 1).padStart(2, "0")}</span><h2>{section.title}</h2></div>
            <small>{section.titles.length.toLocaleString("th-TH")} stories</small>
          </div>
          <div className={`bp-editorial-grid ${sectionIndex === 0 ? "bp-editorial-grid--featured" : ""}`}>
            {section.titles.map((title, index) => <EditorialTile key={title.slug} lead={sectionIndex === 0 && index === 0} priority={sectionIndex === 0 && index < 3} style={style} title={title} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

function EditorialTile({ lead, priority, style, title }: { lead: boolean; priority: boolean; style: PrototypeStyle; title: Title }) {
  const image = title.heroImage || title.posterImage;
  const category = titleCategories(title)[0]?.label || title.genre;
  return (
    <article className={`bp-editorial-tile ${lead ? "bp-editorial-tile--lead" : ""}`}>
      <Link href={`/prototype/${style}/article/${encodeURIComponent(title.slug)}`}>
        <div className="bp-editorial-tile__art">
          {image ? <Image alt="" className="bp-cover" fill priority={priority} sizes={lead ? "(max-width: 760px) 100vw, 66vw" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"} src={image} /> : <div className="bp-art-fallback" data-tone={Math.abs(hashCode(title.slug)) % 4} />}
          <div className="bp-editorial-tile__shade" />
          {title.isNew ? <span className="bp-new-badge">New</span> : null}
        </div>
        <div className="bp-editorial-tile__copy">
          <p>{category}</p>
          <h3>{titleInlineText(title)}</h3>
          {lead ? <p className="bp-editorial-tile__description">{title.description}</p> : null}
          <span>{title.year || title.homeYear || ""}{title.duration ? ` · ${title.duration}` : ""}</span>
        </div>
      </Link>
    </article>
  );
}

function hashCode(value: string) {
  return [...value].reduce((total, character) => ((total << 5) - total) + character.charCodeAt(0), 0);
}
