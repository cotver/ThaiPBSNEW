import Image from "next/image";
import Link from "next/link";
import { titleEyebrow, titleInlineText, type Title } from "@/lib/content";
import type { CategoryTile } from "@/lib/payload-content";
import { EditorialCategoryTiles } from "./EditorialCategoryTiles";
import { getEditorialSections, getPrototypeCategories, titleCategories, type PrototypeCategory, type PrototypeStyle } from "./blog-data";

type HomeProps = { categoryTiles: CategoryTile[]; titles: Title[] };
type CategoryProps = { category: PrototypeCategory; titles: Title[] };
type ArticleProps = { related: Title[]; title: Title };

export function StyleOneHome({ categoryTiles, titles }: HomeProps) {
  const featured = titles.find((title) => title.featured) ?? titles[0];
  const supporting = titles.filter((title) => title.slug !== featured?.slug).slice(0, 2);
  const recommended = getEditorialSections(titles).find((section) => section.id === "new")?.titles ?? [];
  return (
    <StyleOneFrame categories={getPrototypeCategories(titles)}>
      {featured ? <StyleOneHero featured={featured} supporting={supporting} /> : null}
      <ExploreBlock categories={categoryTiles} style="style-1" />
      <section className="s1-latest">
        <EditorialIntro count={titles.length} index="01" kicker="From the field" title="Latest stories" />
        <div className="s1-story-stack">{titles.slice(0, 7).map((title, index) => <StyleOneStory index={index} key={title.slug} title={title} />)}</div>
      </section>
      {recommended.length ? <StyleOneRecommendations titles={recommended} /> : null}
    </StyleOneFrame>
  );
}

export function StyleOneCategory({ category, titles }: CategoryProps) {
  return (
    <StyleOneFrame categories={getPrototypeCategories(titles)}>
      <header className="s1-page-title"><p>Field notes / category</p><h1>{category.label}</h1><span>{titles.length.toLocaleString("th-TH")} stories in this collection</span></header>
      <section className="s1-category-list">{titles.map((title, index) => <StyleOneStory index={index} key={title.slug} title={title} />)}</section>
    </StyleOneFrame>
  );
}

export function StyleOneArticle({ related, title }: ArticleProps) {
  const category = titleCategories(title)[0];
  return (
    <StyleOneFrame categories={getPrototypeCategories([title, ...related])}>
      <article className="s1-article">
        <header className="s1-article-hero">
          <StoryArt className="s1-article-image" orientation="horizontal" priority title={title} />
          <div className="s1-article-overlay" />
          <div className="s1-article-title"><Link href={`/prototype/style-1/category/${category.slug}`}>← {category.label}</Link><p>{titleEyebrow(title)}</p><h1>{titleInlineText(title)}</h1><span>{storyMeta(title)}</span></div>
        </header>
        <div className="s1-article-paper"><p className="s1-article-deck">{title.description}</p><aside><span>Category</span><strong>{category.label}</strong><span>Format</span><strong>{title.type}</strong><span>Published</span><strong>{title.year}</strong></aside></div>
      </article>
      <StyleOneRelated titles={related} />
    </StyleOneFrame>
  );
}

export function StyleTwoHome({ categoryTiles, titles }: HomeProps) {
  const featured = titles.find((title) => title.featured) ?? titles[0];
  const supporting = titles.filter((title) => title.slug !== featured?.slug).slice(0, 2);
  return (
    <StyleTwoFrame categories={getPrototypeCategories(titles)}>
      {featured ? <StyleTwoHero featured={featured} supporting={supporting} /> : null}
      <ExploreBlock categories={categoryTiles} style="style-2" />
      <section className="s2-stories">
        <EditorialIntro count={titles.length} index="Signal / 01" kicker="Current feed" title="Stories in motion" />
        <div className="s2-bento">{titles.slice(0, 8).map((title, index) => <StyleTwoCard featured={index === 0} key={title.slug} title={title} />)}</div>
      </section>
      <StyleTwoTicker categories={getPrototypeCategories(titles)} />
    </StyleTwoFrame>
  );
}

export function StyleTwoCategory({ category, titles }: CategoryProps) {
  return (
    <StyleTwoFrame categories={getPrototypeCategories(titles)}>
      <header className="s2-page-title"><p>Thai PBS Signal</p><h1>{category.label}</h1><span>{titles.length.toLocaleString("th-TH")} available stories</span></header>
      <section className="s2-category-bento">{titles.map((title, index) => <StyleTwoCard featured={index % 5 === 0} key={title.slug} title={title} />)}</section>
    </StyleTwoFrame>
  );
}

export function StyleTwoArticle({ related, title }: ArticleProps) {
  const category = titleCategories(title)[0];
  return (
    <StyleTwoFrame categories={getPrototypeCategories([title, ...related])}>
      <article className="s2-article">
        <header className="s2-article-card"><div className="s2-article-copy"><Link href={`/prototype/style-2/category/${category.slug}`}>Back to {category.label}</Link><p>{titleEyebrow(title)}</p><h1>{titleInlineText(title)}</h1><span>{storyMeta(title)}</span></div><StoryArt className="s2-article-art" orientation="vertical" priority title={title} /></header>
        <div className="s2-article-body"><div><p>{title.description}</p></div><aside><span>Story details</span><dl><div><dt>Category</dt><dd>{category.label}</dd></div><div><dt>Format</dt><dd>{title.type}</dd></div><div><dt>Published</dt><dd>{title.year}</dd></div></dl></aside></div>
      </article>
      <section className="s2-related"><h2>Keep exploring</h2><div>{related.slice(0, 3).map((item) => <StyleTwoCard key={item.slug} title={item} />)}</div></section>
    </StyleTwoFrame>
  );
}

export function StyleThreeHome({ categoryTiles, titles }: HomeProps) {
  const featured = titles.find((title) => title.featured) ?? titles[0];
  const supporting = titles.filter((title) => title.slug !== featured?.slug).slice(0, 3);
  return (
    <StyleThreeFrame categories={getPrototypeCategories(titles)}>
      {featured ? <StyleThreeHero featured={featured} supporting={supporting} /> : null}
      <ExploreBlock categories={categoryTiles} style="style-3" />
      <section className="s3-news"><div className="s3-section-bar"><span>01</span><h2>Latest stories</h2><small>{titles.length.toLocaleString("th-TH")} items</small></div><div className="s3-news-grid">{titles.slice(0, 9).map((title, index) => <StyleThreeCard index={index} key={title.slug} title={title} />)}</div></section>
    </StyleThreeFrame>
  );
}

export function StyleThreeCategory({ category, titles }: CategoryProps) {
  return (
    <StyleThreeFrame categories={getPrototypeCategories(titles)}>
      <header className="s3-page-title"><span>Category index</span><h1>{category.label}</h1><strong>{String(titles.length).padStart(2, "0")}</strong></header>
      <section className="s3-category-table">{titles.map((title, index) => <StyleThreeRow index={index} key={title.slug} title={title} />)}</section>
    </StyleThreeFrame>
  );
}

export function StyleThreeArticle({ related, title }: ArticleProps) {
  const category = titleCategories(title)[0];
  return (
    <StyleThreeFrame categories={getPrototypeCategories([title, ...related])}>
      <article className="s3-article">
        <header className="s3-article-head"><Link href={`/prototype/style-3/category/${category.slug}`}>← Index / {category.label}</Link><div><p>{titleEyebrow(title)}</p><h1>{titleInlineText(title)}</h1></div><strong>{title.year}</strong></header>
        <StoryArt className="s3-article-image" orientation="horizontal" priority title={title} />
        <div className="s3-article-body"><p>{title.description}</p><dl><div><dt>Category</dt><dd>{category.label}</dd></div><div><dt>Format</dt><dd>{title.type}</dd></div><div><dt>Runtime</dt><dd>{title.duration || "—"}</dd></div></dl></div>
      </article>
      <section className="s3-related"><div className="s3-section-bar"><span>02</span><h2>Next in the grid</h2><small>{related.length} items</small></div>{related.slice(0, 4).map((item, index) => <StyleThreeRow index={index} key={item.slug} title={item} />)}</section>
    </StyleThreeFrame>
  );
}

function StyleOneFrame({ categories, children }: { categories: PrototypeCategory[]; children: React.ReactNode }) {
  return <div className="prototype-v2 style-one"><StyleOneHeader categories={categories} /><main>{children}</main><StyleOneFooter categories={categories} /></div>;
}

function StyleTwoFrame({ categories, children }: { categories: PrototypeCategory[]; children: React.ReactNode }) {
  return <div className="prototype-v2 style-two"><StyleTwoHeader categories={categories} /><main>{children}</main><StyleTwoFooter categories={categories} /></div>;
}

function StyleThreeFrame({ categories, children }: { categories: PrototypeCategory[]; children: React.ReactNode }) {
  return <div className="prototype-v2 style-three"><StyleThreeHeader categories={categories} /><main>{children}</main><StyleThreeFooter categories={categories} /></div>;
}

function StyleOneHeader({ categories }: { categories: PrototypeCategory[] }) {
  return <header className="s1-header"><Link className="s1-wordmark" href="/prototype/style-1">Thai PBS <em>Field Notes</em></Link><nav>{categories.slice(0, 3).map((category) => <Link href={`/prototype/style-1/category/${category.slug}`} key={category.slug}>{category.label}</Link>)}</nav><details><summary aria-label="Open navigation"><span /><span /></summary><div><Link href="/prototype/style-1">Home</Link>{categories.slice(0, 5).map((category) => <Link href={`/prototype/style-1/category/${category.slug}`} key={category.slug}>{category.label}</Link>)}<Link href="/prototype">Compare styles</Link></div></details></header>;
}

function StyleTwoHeader({ categories }: { categories: PrototypeCategory[] }) {
  return <header className="s2-header"><Link className="s2-brand" href="/prototype/style-2"><BrandGlyph /> <span>Thai PBS Signal</span></Link><nav>{categories.slice(0, 4).map((category) => <Link href={`/prototype/style-2/category/${category.slug}`} key={category.slug}>{category.label}</Link>)}</nav><Link className="s2-switch" href="/prototype">Style 2 <Arrow /></Link><details><summary>Menu</summary><div><Link href="/prototype/style-2">Home</Link>{categories.slice(0, 5).map((category) => <Link href={`/prototype/style-2/category/${category.slug}`} key={category.slug}>{category.label}</Link>)}</div></details></header>;
}

function StyleThreeHeader({ categories }: { categories: PrototypeCategory[] }) {
  return <><header className="s3-header"><Link href="/prototype/style-3"><BrandGlyph /><span>Thai PBS<br />Daily Grid</span></Link><nav><Link href="/prototype/style-3">Latest</Link>{categories.slice(0, 3).map((category) => <Link href={`/prototype/style-3/category/${category.slug}`} key={category.slug}>{category.label}</Link>)}</nav><Link href="/prototype">03 / Compare</Link><details><summary aria-label="Open navigation">☰</summary><div><Link href="/prototype/style-3">Latest</Link>{categories.slice(0, 5).map((category) => <Link href={`/prototype/style-3/category/${category.slug}`} key={category.slug}>{category.label}</Link>)}</div></details></header><div className="s3-running-line"><span>Independent stories</span><span>Culture · Knowledge · Documentary</span><span>Thai PBS / 2026</span></div></>;
}

function StyleOneHero({ featured, supporting }: { featured: Title; supporting: Title[] }) {
  return <section className="s1-hero"><StoryArt className="s1-hero-art" orientation="horizontal" priority title={featured} /><div className="s1-hero-shade" /><div className="s1-hero-copy"><p>{titleEyebrow(featured)}</p><h1>{titleInlineText(featured)}</h1><p>{featured.description}</p><Link href={`/prototype/style-1/article/${featured.slug}`}>Read the story <Arrow /></Link></div><div className="s1-hero-support">{supporting.map((title, index) => <Link href={`/prototype/style-1/article/${title.slug}`} key={title.slug}><span>0{index + 2}</span><strong>{titleInlineText(title)}</strong><small>{storyMeta(title)}</small></Link>)}</div><span className="s1-scroll">Scroll to explore ↓</span></section>;
}

function StyleTwoHero({ featured, supporting }: { featured: Title; supporting: Title[] }) {
  return <section className="s2-hero"><div className="s2-hero-card"><div className="s2-hero-copy"><p>Selected story / {featured.year}</p><h1>{titleInlineText(featured)}</h1><span>{featured.description}</span><Link href={`/prototype/style-2/article/${featured.slug}`}>Open story <Arrow /></Link></div><StoryArt className="s2-hero-art" orientation="vertical" priority title={featured} /></div><div className="s2-hero-side">{supporting.map((title) => <StyleTwoCard key={title.slug} orientation="horizontal" title={title} />)}</div></section>;
}

function StyleThreeHero({ featured, supporting }: { featured: Title; supporting: Title[] }) {
  return <section className="s3-hero"><div className="s3-hero-tags">{[featured, ...supporting].slice(0, 3).map((title, index) => <Link href={`/prototype/style-3/article/${title.slug}`} key={title.slug}><span>0{index + 1}</span><strong>{titleCategories(title)[0]?.label}</strong></Link>)}</div><Link className="s3-lead" href={`/prototype/style-3/article/${featured.slug}`}><StoryArt className="s3-lead-art" orientation="horizontal" priority title={featured} /><div><p>{titleEyebrow(featured)}</p><h1>{titleInlineText(featured)}</h1><span>{featured.description}</span></div></Link><aside>{supporting.slice(0, 2).map((title, index) => <Link href={`/prototype/style-3/article/${title.slug}`} key={title.slug}><strong>{String(index + 2).padStart(2, "0")}</strong><span>{titleInlineText(title)}</span><small>{storyMeta(title)}</small></Link>)}</aside></section>;
}

function ExploreBlock({ categories, style }: { categories: CategoryTile[]; style: PrototypeStyle }) {
  return <div className="bp-explore prototype-explore"><EditorialCategoryTiles categories={categories} style={style} /></div>;
}

function StyleOneStory({ index, title }: { index: number; title: Title }) {
  return <article className="s1-story"><Link href={`/prototype/style-1/article/${title.slug}`}><StoryArt className="s1-story-art" orientation="horizontal" title={title} /><div><span>{String(index + 1).padStart(2, "0")} / {titleCategories(title)[0]?.label}</span><h3>{titleInlineText(title)}</h3><p>{title.description}</p><small>{storyMeta(title)}</small></div></Link></article>;
}

function StyleOneRecommendations({ titles }: { titles: Title[] }) {
  return <section className="s1-recommended"><EditorialIntro count={titles.length} index="02" kicker="Freshly added" title="Recommended" /><div>{titles.slice(0, 4).map((title) => <Link href={`/prototype/style-1/article/${title.slug}`} key={title.slug}><StoryArt orientation="vertical" title={title} /><span>{titleCategories(title)[0]?.label}</span><h3>{titleInlineText(title)}</h3></Link>)}</div></section>;
}

function StyleOneRelated({ titles }: { titles: Title[] }) {
  if (!titles.length) return null;
  return <section className="s1-related"><h2>Continue reading</h2>{titles.slice(0, 3).map((title, index) => <StyleOneStory index={index} key={title.slug} title={title} />)}</section>;
}

function StyleTwoCard({ featured = false, orientation, title }: { featured?: boolean; orientation?: "horizontal" | "vertical"; title: Title }) {
  const mediaOrientation = orientation ?? (featured ? "horizontal" : "vertical");
  return <article className={`s2-card ${featured ? "is-featured" : ""}`}><Link href={`/prototype/style-2/article/${title.slug}`}><StoryArt className="s2-card-art" orientation={mediaOrientation} title={title} /><div><p>{titleCategories(title)[0]?.label}</p><h3>{titleInlineText(title)}</h3>{featured ? <p className="s2-card-description">{title.description}</p> : null}<span>{storyMeta(title)}</span><i><Arrow /></i></div></Link></article>;
}

function StyleTwoTicker({ categories }: { categories: PrototypeCategory[] }) {
  if (!categories.length) return null;
  return <div className="s2-ticker" aria-label="Browse categories"><div>{[...categories, ...categories].map((category, index) => <Link href={`/prototype/style-2/category/${category.slug}`} key={`${category.slug}-${index}`}>{category.label}<span>✦</span></Link>)}</div></div>;
}

function StyleThreeCard({ index, title }: { index: number; title: Title }) {
  return <article className={`s3-card ${index === 0 ? "is-lead" : ""}`}><Link href={`/prototype/style-3/article/${title.slug}`}><StoryArt className="s3-card-art" orientation={index === 0 ? "horizontal" : "vertical"} title={title} /><div><span>{String(index + 1).padStart(2, "0")} / {titleCategories(title)[0]?.label}</span><h3>{titleInlineText(title)}</h3><small>{storyMeta(title)}</small></div></Link></article>;
}

function StyleThreeRow({ index, title }: { index: number; title: Title }) {
  return <article className="s3-row"><Link href={`/prototype/style-3/article/${title.slug}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{titleCategories(title)[0]?.label}</strong><h2>{titleInlineText(title)}</h2><small>{storyMeta(title)}</small><Arrow /></Link></article>;
}

function EditorialIntro({ count, index, kicker, title }: { count: number; index: string; kicker: string; title: string }) {
  return <header className="v2-editorial-intro"><div><span>{index}</span><p>{kicker}</p></div><h2>{title}</h2><small>{count.toLocaleString("th-TH")} stories</small></header>;
}

function StoryArt({ className = "", orientation, priority = false, title }: { className?: string; orientation: "horizontal" | "vertical"; priority?: boolean; title: Title }) {
  const image = orientation === "vertical" ? title.posterImage || title.heroImage : title.heroImage || title.posterImage;
  const sizes = orientation === "vertical" ? "(max-width: 720px) 50vw, 28vw" : "(max-width: 720px) 100vw, 60vw";
  return <div className={`v2-art v2-art--${orientation} ${className}`}>{image ? <Image alt="" fill priority={priority} sizes={sizes} src={image} /> : <div className="v2-art-fallback" data-tone={Math.abs(hashCode(title.slug)) % 4} />}</div>;
}

function StyleOneFooter({ categories }: { categories: PrototypeCategory[] }) {
  return <footer className="s1-footer"><div><span>Thai PBS</span><em>Field Notes</em></div><nav>{categories.slice(0, 4).map((category) => <Link href={`/prototype/style-1/category/${category.slug}`} key={category.slug}>{category.label}</Link>)}</nav><Link href="/prototype">Compare all styles ↗</Link></footer>;
}

function StyleTwoFooter({ categories }: { categories: PrototypeCategory[] }) {
  return <footer className="s2-footer"><div><BrandGlyph /><h2>Stories worth<br />staying with.</h2></div><nav>{categories.slice(0, 5).map((category) => <Link href={`/prototype/style-2/category/${category.slug}`} key={category.slug}>{category.label}</Link>)}</nav><div><span>Thai PBS Signal / 2026</span><Link href="/prototype">Compare directions <Arrow /></Link></div></footer>;
}

function StyleThreeFooter({ categories }: { categories: PrototypeCategory[] }) {
  return <footer className="s3-footer"><div><BrandGlyph /><strong>Thai PBS<br />Daily Grid</strong></div><nav>{categories.slice(0, 4).map((category, index) => <Link href={`/prototype/style-3/category/${category.slug}`} key={category.slug}><span>0{index + 1}</span>{category.label}</Link>)}</nav><Link href="/prototype">Back to comparison ↑</Link></footer>;
}

function BrandGlyph() { return <svg aria-hidden="true" viewBox="0 0 40 40"><path d="M5 20 20 5l15 15-15 15L5 20Z"/><circle cx="20" cy="20" r="6"/></svg>; }
function Arrow() { return <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>; }
function storyMeta(title: Title) { return [title.year || title.homeYear, title.duration].filter(Boolean).join(" · "); }
function hashCode(value: string) { return [...value].reduce((total, character) => ((total << 5) - total) + character.charCodeAt(0), 0); }
