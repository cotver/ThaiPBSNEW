import Image from "next/image";
import Link from "next/link";
import { titleEyebrow, titleInlineText, type Title } from "@/lib/content";
import { ArrowIcon, BlogStoryCard } from "./BlogStoryCard";
import { getPrototypeCategories, styleDetails, titleCategories, type PrototypeCategory, type PrototypeStyle } from "./blog-data";
import { EditorialCategoryTiles } from "./EditorialCategoryTiles";
import { EditorialExplore } from "./EditorialExplore";
import type { CategoryTile } from "@/lib/payload-content";

type PageProps = {
  categories: PrototypeCategory[];
  style: PrototypeStyle;
};

export function BlogPrototypeHome({ categoryTiles, style, titles }: { categoryTiles: CategoryTile[]; style: PrototypeStyle; titles: Title[] }) {
  const featured = titles.find((title) => title.featured) ?? titles[0];
  const secondary = titles.filter((title) => title.slug !== featured?.slug).slice(0, 2);
  const latest = titles.filter((title) => title.slug !== featured?.slug).slice(0, 6);

  return (
    <PrototypeFrame categories={getPrototypeCategories(titles)} style={style}>
      {featured ? <HomeHero featured={featured} secondary={secondary} style={style} /> : null}
      <div className="bp-explore">
        <EditorialCategoryTiles categories={categoryTiles} style={style} />
      </div>
      <section className="bp-section bp-latest" id="latest">
        <SectionHeading eyebrow="Latest" title="Latest Stories" />
        <div className="bp-card-grid">
          {latest.map((title, index) => <BlogStoryCard key={title.slug} priority={index < 3} style={style} title={title} />)}
        </div>
      </section>
      <EditorialExplore categories={[]} excludeSectionIds={["featured", "latest"]} style={style} titles={titles} />
    </PrototypeFrame>
  );
}

export function BlogPrototypeCategory({ category, style, titles }: { category: PrototypeCategory; style: PrototypeStyle; titles: Title[] }) {
  return (
    <PrototypeFrame categories={getPrototypeCategories(titles)} style={style}>
      <header className="bp-page-intro">
        <p className="bp-eyebrow">Thai PBS content</p>
        <h1>{category.label}</h1>
        <p>{titles.length.toLocaleString("th-TH")} available stories</p>
      </header>
      <EditorialExplore categories={[]} style={style} titles={titles} />
    </PrototypeFrame>
  );
}

export function BlogPrototypeArticle({ related, style, title }: { related: Title[]; style: PrototypeStyle; title: Title }) {
  const artwork = title.heroImage || title.posterImage;
  const category = titleCategories(title)[0];

  return (
    <PrototypeFrame categories={getPrototypeCategories([title, ...related])} style={style}>
      <article className="bp-article">
        <header className="bp-article-hero">
          <div className="bp-article-heading">
            <Link className="bp-back-link" href={`/prototype/${style}/category/${category.slug}`}>← {category.label}</Link>
            <p className="bp-eyebrow">{titleEyebrow(title)}</p>
            <h1>{titleInlineText(title)}</h1>
            <p className="bp-article-deck">{title.description}</p>
            <p className="bp-article-meta">{title.year}{title.duration ? ` · ${title.duration}` : ""}</p>
          </div>
          <div className="bp-article-art">
            {artwork ? <Image alt="" className="bp-cover" fill priority sizes="(max-width: 900px) 100vw, 52vw" src={artwork} /> : <div className="bp-art-fallback" data-tone="2" />}
          </div>
        </header>

        <div className="bp-article-layout">
          <div className="bp-article-body">
            <p className="bp-dropcap">{title.description}</p>
          </div>
          <aside className="bp-article-facts">
            <p>Story details</p>
            <dl><div><dt>Category</dt><dd>{category.label}</dd></div><div><dt>Format</dt><dd>{title.type}</dd></div><div><dt>Published</dt><dd>{title.year || "2026"}</dd></div></dl>
          </aside>
        </div>
      </article>

      {related.length ? (
        <section className="bp-section bp-related">
          <SectionHeading eyebrow="Continue reading" title="Related stories" />
          <div className="bp-card-grid">{related.slice(0, 3).map((item) => <BlogStoryCard key={item.slug} style={style} title={item} />)}</div>
        </section>
      ) : null}
    </PrototypeFrame>
  );
}

function PrototypeFrame({ categories, children, style }: PageProps & { children: React.ReactNode }) {
  return (
    <div className={`blog-prototype blog-prototype--${style}`}>
      <PrototypeHeader categories={categories} style={style} />
      <main>{children}</main>
      <PrototypeFooter categories={categories} style={style} />
    </div>
  );
}

function PrototypeHeader({ categories, style }: PageProps) {
  const details = styleDetails[style];
  return (
    <header className="bp-header">
      <Link className="bp-brand" href={`/prototype/${style}`}><BrandMark /><span>Thai PBS <em>{details.name}</em></span></Link>
      <nav className="bp-desktop-nav" aria-label={`${details.label} navigation`}>
        <Link href={`/prototype/${style}`}>Home</Link>
        {categories.slice(0, 3).map((category) => <Link href={`/prototype/${style}/category/${category.slug}`} key={category.slug}>{category.label}</Link>)}
      </nav>
      <div className="bp-header-actions">
        <Link className="bp-compare-link" href="/prototype">{details.label}</Link>
        <details className="bp-mobile-menu"><summary aria-label="Open navigation"><span/><span/></summary><div><Link href={`/prototype/${style}`}>Home</Link>{categories.slice(0, 4).map((category) => <Link href={`/prototype/${style}/category/${category.slug}`} key={category.slug}>{category.label}</Link>)}<Link href="/prototype">Compare styles</Link></div></details>
      </div>
    </header>
  );
}

function HomeHero({ featured, secondary, style }: { featured: Title; secondary: Title[]; style: PrototypeStyle }) {
  const image = featured.heroImage || featured.posterImage;
  return (
    <section className="bp-home-hero">
      <Link className="bp-lead-story" href={`/prototype/${style}/article/${encodeURIComponent(featured.slug)}`}>
        <div className="bp-lead-art">{image ? <Image alt="" className="bp-cover" fill priority sizes="(max-width: 900px) 100vw, 68vw" src={image} /> : <div className="bp-art-fallback" data-tone="0" />}</div>
        <div className="bp-lead-copy"><p className="bp-eyebrow">Cover story · {featured.genre}</p><h1>{titleInlineText(featured)}</h1><p>{featured.description}</p><span>Read the full story <ArrowIcon /></span></div>
      </Link>
      <div className="bp-hero-side">
        {secondary.map((title) => <MiniStory key={title.slug} style={style} title={title} />)}
      </div>
    </section>
  );
}

function MiniStory({ style, title }: { style: PrototypeStyle; title: Title }) {
  const image = title.heroImage || title.posterImage;
  return <Link className="bp-mini-story" href={`/prototype/${style}/article/${encodeURIComponent(title.slug)}`}><div>{image ? <Image alt="" className="bp-cover" fill sizes="180px" src={image} /> : <div className="bp-art-fallback" data-tone="1" />}</div><span><small>{title.genre}</small><strong>{titleInlineText(title)}</strong></span></Link>;
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div className="bp-section-heading"><div><p className="bp-eyebrow">{eyebrow}</p><h2 id="catalog-title">{title}</h2></div></div>;
}

function PrototypeFooter({ categories, style }: PageProps) {
  return <footer className="bp-footer"><div><Link className="bp-brand" href={`/prototype/${style}`}><BrandMark /><span>Thai PBS <em>{styleDetails[style].name}</em></span></Link><p>Stories that help us understand one another—and the world we share.</p></div><nav>{categories.slice(0, 4).map((category) => <Link href={`/prototype/${style}/category/${category.slug}`} key={category.slug}>{category.label}</Link>)}</nav><div className="bp-footer-bottom"><span>© 2026 Thai PBS prototype</span><Link href="/prototype">Compare Style 1 · 2 · 3</Link></div></footer>;
}

function BrandMark() {
  return <svg aria-hidden="true" viewBox="0 0 40 40"><path d="M5 20 20 5l15 15-15 15L5 20Z"/><circle cx="20" cy="20" r="6"/></svg>;
}
