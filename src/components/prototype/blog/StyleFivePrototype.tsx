"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { titleInlineText, type Title } from "@/lib/content";
import type { CategoryTile, TitleCollections } from "@/lib/payload-content";
import { EditorialCategoryTiles } from "./EditorialCategoryTiles";
import { getPrototypeCategories, titleCategories, type PrototypeCategory } from "./blog-data";

type HomeProps = { categoryTiles: CategoryTile[]; collections: TitleCollections; titles: Title[] };
type CategoryProps = { category: PrototypeCategory; titles: Title[] };
type ArticleProps = { related: Title[]; title: Title };

export function StyleFiveHome({ categoryTiles, collections, titles }: HomeProps) {
  const available = titles.filter((item) => !item.isDiscontinued);
  const lead = available.find((item) => item.featured) ?? available[0];
  const fresh = unique([...available.filter((item) => item.isNew), ...available]).slice(0, 4);
  const featured = unique([...available.filter((item) => item.featured), ...available]).slice(0, 5);
  const recommended = unique([...collections.recommended, ...available]).filter((item) => item.slug !== lead?.slug).slice(0, 7);
  const latest = unique([...available, ...collections.continueWatching]).slice(0, 7);
  const collectionRows = collectionSections(collections).filter((row) => !["recommended", "continue-watching"].includes(row.id));

  return <StyleFiveMotion><div className="s5-shell" id="top">
    <StyleFiveHeader categories={getPrototypeCategories(titles)} />
    <main>
      {lead ? <MagazineHero lead={lead} supporting={featured.filter((item) => item.slug !== lead.slug).slice(0, 2)} /> : null}
      <EditorialNew titles={fresh} />
      {featured[1] ? <BigFeature title={featured[1]} /> : null}
      <RecommendedRail titles={recommended} />
      <LatestList titles={latest} />
      {categoryTiles.length ? <section className="s5-categories" id="categories" data-s5-reveal><EditorialCategoryTiles categories={categoryTiles} style="style-5" /></section> : null}
      <section className="s5-collections" id="programs">
        {collectionRows.map((row, index) => <CollectionRow index={index} key={row.id} {...row} />)}
      </section>
    </main>
    <StyleFiveFooter />
  </div></StyleFiveMotion>;
}

export function StyleFiveCategory({ category, titles }: CategoryProps) {
  return <StyleFiveMotion><div className="s5-shell s5-inner">
    <StyleFiveHeader categories={getPrototypeCategories(titles)} />
    <main>
      <header className="s5-category-head" data-s5-reveal><p>Thai PBS / Index</p><h1>{category.label}</h1><span>{String(titles.length).padStart(2, "0")} current stories</span></header>
      <section className="s5-category-grid">{titles.map((title, index) => <EditorialCard index={index} key={title.slug} title={title} />)}</section>
    </main>
    <StyleFiveFooter />
  </div></StyleFiveMotion>;
}

export function StyleFiveArticle({ related, title }: ArticleProps) {
  const category = titleCategories(title)[0];
  return <StyleFiveMotion><div className="s5-shell s5-inner">
    <StyleFiveHeader categories={getPrototypeCategories([title, ...related])} />
    <main>
      <article className="s5-article">
        <MagazineImage className="s5-article__image" priority title={title} />
        <div className="s5-article__intro" data-s5-reveal><p>{category.label} · {title.type}</p><h1>{titleInlineText(title)}</h1><span>{[title.year, title.duration, title.rating].filter(Boolean).join(" / ")}</span></div>
        <div className="s5-article__body"><p>{title.description}</p><dl><div><dt>Category</dt><dd>{category.label}</dd></div><div><dt>Format</dt><dd>{title.type}</dd></div><div><dt>Duration</dt><dd>{title.duration || "—"}</dd></div></dl></div>
      </article>
      {related.length ? <section className="s5-related"><SectionHeading number="Next" title="Keep reading" /><div>{related.slice(0, 4).map((item, index) => <EditorialCard index={index} key={item.slug} title={item} />)}</div></section> : null}
    </main>
    <StyleFiveFooter />
  </div></StyleFiveMotion>;
}

function StyleFiveMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const header = element.querySelector<HTMLElement>(".s5-header");
    const update = () => {
      frame = 0;
      element.style.setProperty("--s5-scroll", String(window.scrollY));
      header?.classList.toggle("is-condensed", window.scrollY > 80);
    };
    const request = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
    }), { threshold: 0.14 });
    element.querySelectorAll<HTMLElement>("[data-s5-reveal]").forEach((item) => observer.observe(item));
    update(); window.addEventListener("scroll", request, { passive: true });
    return () => { window.removeEventListener("scroll", request); observer.disconnect(); if (frame) window.cancelAnimationFrame(frame); };
  }, []);
  return <div className="style-five" ref={root}>{children}</div>;
}

function StyleFiveHeader({ categories }: { categories: PrototypeCategory[] }) {
  return <header className="s5-header"><Link className="s5-mark" href="/prototype/style-5"><b>Thai PBS</b><i>Edition</i></Link><nav><a href="#new">New</a><a href="#featured">Featured</a><a href="#recommended">Recommended</a></nav><details><summary aria-label="Open category index"><span>Index</span><b>+</b></summary><div>{categories.map((category) => <Link href={`/prototype/style-5/category/${category.slug}`} key={category.slug}>{category.label}</Link>)}</div></details></header>;
}

function MagazineHero({ lead, supporting }: { lead: Title; supporting: Title[] }) {
  return <section className="s5-hero" id="featured">
    <Link className="s5-hero__visual" href={`/prototype/style-5/article/${lead.slug}`}><MagazineImage priority title={lead} /><span>Featured story ↗</span></Link>
    <div className="s5-hero__copy" data-s5-reveal><p>{titleCategories(lead)[0]?.label || "Featured"} / {lead.year}</p><h1>{titleInlineText(lead)}</h1><div><span>{lead.duration || lead.type}</span><p>{lead.description}</p></div></div>
    {supporting.length ? <aside className="s5-hero__side">{supporting.map((item, index) => <Link href={`/prototype/style-5/article/${item.slug}`} key={item.slug}><span>0{index + 1}</span><MagazineImage title={item} /><h2>{titleInlineText(item)}</h2></Link>)}</aside> : null}
  </section>;
}

function EditorialNew({ titles }: { titles: Title[] }) {
  if (!titles.length) return null;
  return <section className="s5-new" id="new"><SectionHeading number="01" title="New now" /><div className="s5-new__grid">{titles.map((title, index) => <EditorialCard index={index} key={title.slug} title={title} />)}</div></section>;
}

function BigFeature({ title }: { title: Title }) {
  return <section className="s5-big-feature" data-s5-reveal><Link href={`/prototype/style-5/article/${title.slug}`}><MagazineImage title={title} /><div><p>Thai PBS presents</p><h2>{titleInlineText(title)}</h2><span>Read story ↗</span></div></Link></section>;
}

function RecommendedRail({ titles }: { titles: Title[] }) {
  if (!titles.length) return null;
  return <section className="s5-recommended" id="recommended"><SectionHeading number="02" title="Recommended" /><div className="s5-recommended__rail">{titles.map((title, index) => <EditorialCard index={index} key={title.slug} title={title} />)}</div></section>;
}

function LatestList({ titles }: { titles: Title[] }) {
  if (!titles.length) return null;
  return <section className="s5-latest"><SectionHeading number="03" title="Latest" /><div>{titles.map((title, index) => <Link className="s5-latest__item" data-s5-reveal href={`/prototype/style-5/article/${title.slug}`} key={title.slug}><span>{String(index + 1).padStart(2, "0")}</span><h3>{titleInlineText(title)}</h3><p>{titleCategories(title)[0]?.label}</p><MagazineImage title={title} /><b>↗</b></Link>)}</div></section>;
}

function CollectionRow({ id, index, title, titles }: { id: string; index: number; title: string; titles: Title[] }) {
  if (!titles.length) return null;
  return <section className={`s5-collection s5-collection--${index % 3}`} id={id}><SectionHeading number={String(index + 4).padStart(2, "0")} title={title} /><div>{titles.slice(0, 5).map((item, itemIndex) => <EditorialCard index={itemIndex} key={item.slug} title={item} />)}</div></section>;
}

function SectionHeading({ number, title }: { number: string; title: string }) { return <header className="s5-section-head" data-s5-reveal><span>{number}</span><h2>{title}</h2><i /></header>; }
function EditorialCard({ index, title }: { index: number; title: Title }) { return <Link className={`s5-card s5-card--${index % 4}`} data-s5-reveal href={`/prototype/style-5/article/${title.slug}`}><MagazineImage title={title} /><div><p>{titleCategories(title)[0]?.label || title.type}</p><h3>{titleInlineText(title)}</h3><span>{title.year} · {title.duration || title.type}</span></div></Link>; }
function MagazineImage({ className = "", priority = false, title }: { className?: string; priority?: boolean; title: Title }) { const image = title.heroImage || title.posterImage; return <div className={`s5-image ${className}`}>{image ? <Image alt="" fill priority={priority} sizes="(max-width: 720px) 100vw, 60vw" src={image} /> : <span className="s5-image__fallback" data-tone={Math.abs(hash(title.slug)) % 4} />}</div>; }
function StyleFiveFooter() { return <footer className="s5-footer"><p>Thai PBS / Edition</p><p>Stories in motion, selected for now.</p><a href="#top">Back to top ↑</a></footer>; }

function unique(items: Title[]) { return [...new Map(items.map((item) => [item.slug, item])).values()]; }
function hash(value: string) { return [...value].reduce((total, character) => ((total << 5) - total) + character.charCodeAt(0), 0); }
function collectionSections(collections: TitleCollections) {
  const sections: Array<{ id: string; title: string; titles: Title[] }> = [];
  const add = (id: string, title: string, items: Title[]) => { if (items.length) sections.push({ id, title, titles: items }); };
  add("recommended", "Recommended", collections.recommended);
  for (const row of collections.typeRows) add(`type-${row.type.id}`, row.type.name, row.titles);
  add("continue-watching", "Continue Watching", collections.continueWatching);
  add("continue-programs", "Continue Programs", collections.continuePrograms);
  add("discontinued", "Discontinued Programs", collections.discontinuedPrograms);
  for (const row of collections.yearRows) add(`year-${row.year}`, `Thai PBS Year ${row.year}`, row.titles);
  add("thai", "Thai Programs", collections.thaiPrograms);
  add("international", "International", collections.internationalPrograms);
  return sections;
}
