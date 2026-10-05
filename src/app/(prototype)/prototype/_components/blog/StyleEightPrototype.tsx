"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { titleInlineText, type Title } from "@/lib/content";
import type { CategoryTile, TitleCollections } from "@/lib/payload-content";
import { getPrototypeCategories, titleCategories, type PrototypeCategory } from "./blog-data";

type HomeProps = { categoryTiles: CategoryTile[]; collections: TitleCollections; titles: Title[] };
type CategoryProps = { category: PrototypeCategory; titles: Title[] };
type ArticleProps = { related: Title[]; title: Title };

export function StyleEightHome({ categoryTiles, collections, titles }: HomeProps) {
  const available = titles.filter((item) => !item.isDiscontinued);
  const lead = available.find((item) => item.featured) ?? available[0];
  const featured = unique([...available.filter((item) => item.featured), ...available]).filter((item) => item.slug !== lead?.slug).slice(0, 3);
  const fresh = unique([...available.filter((item) => item.isNew), ...available]).slice(0, 4);
  const recommended = unique([...collections.recommended, ...available]).slice(0, 6);
  const latest = unique([...available, ...collections.continueWatching]).slice(0, 7);
  const collectionRows = collectionSections(collections).filter((row) => !["recommended", "continue-watching"].includes(row.id));

  return <StyleEightMotion><div className="s8-shell" id="top">
    <StyleEightHeader categories={getPrototypeCategories(titles)} />
    <main>
      {lead ? <PatchworkHero lead={lead} supporting={featured} /> : null}
      <WelcomeStory title={recommended[0] ?? fresh[0] ?? lead} />
      <FreshStories titles={fresh} />
      <DiscoveryBoard titles={recommended.slice(0, 5)} />
      {recommended[1] ? <VisualBreak title={recommended[1]} /> : null}
      <LatestStories titles={latest} />
      <PatchCategories categories={categoryTiles} />
      <section className="s8-collections" id="programs">{collectionRows.map((row, index) => <CollectionPatch index={index} key={row.id} {...row} />)}</section>
    </main>
    <StyleEightFooter />
  </div></StyleEightMotion>;
}

export function StyleEightCategory({ category, titles }: CategoryProps) {
  return <StyleEightMotion><div className="s8-shell s8-inner"><StyleEightHeader categories={getPrototypeCategories(titles)} /><main><header className="s8-index-head" data-s8-reveal><p>Thai PBS / Collection</p><h1>{category.label}</h1><span>{String(titles.length).padStart(2, "0")} stories to explore</span></header><section className="s8-index-grid">{titles.map((item, index) => <PatchCard index={index} key={item.slug} title={item} />)}</section></main><StyleEightFooter /></div></StyleEightMotion>;
}

export function StyleEightArticle({ related, title }: ArticleProps) {
  const category = titleCategories(title)[0];
  return <StyleEightMotion><div className="s8-shell s8-inner"><StyleEightHeader categories={getPrototypeCategories([title, ...related])} /><main><article className="s8-article"><StoryImage className="s8-article__image" priority title={title} /><header className="s8-article__head" data-s8-reveal><p>{category.label} / {title.type}</p><h1>{titleInlineText(title)}</h1><span>{[title.year, title.duration, title.rating].filter(Boolean).join(" · ")}</span></header><div className="s8-article__body"><p>{title.description}</p><dl><div><dt>Category</dt><dd>{category.label}</dd></div><div><dt>Format</dt><dd>{title.type}</dd></div><div><dt>Duration</dt><dd>{title.duration || "—"}</dd></div></dl></div></article>{related.length ? <section className="s8-related"><PatchHeading label="More ideas" number="Next" /><div>{related.slice(0, 4).map((item, index) => <PatchCard index={index} key={item.slug} title={item} />)}</div></section> : null}</main><StyleEightFooter /></div></StyleEightMotion>;
}

function StyleEightMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const header = element.querySelector<HTMLElement>(".s8-header");
    let previous = window.scrollY;
    const onScroll = () => { const next = window.scrollY; header?.classList.toggle("is-hidden", next > previous && next > 160); previous = next; };
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }), { threshold: .12 });
    element.querySelectorAll<HTMLElement>("[data-s8-reveal]").forEach((item) => observer.observe(item));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); observer.disconnect(); };
  }, []);
  return <div className="style-eight" ref={root}>{children}</div>;
}

function StyleEightHeader({ categories }: { categories: PrototypeCategory[] }) {
  return <header className="s8-header"><Link className="s8-brand" href="/prototype/style-8"><span>Thai</span><b>PBS</b><i>Patchwork</i></Link><nav><a href="#fresh">New</a><a href="#latest">Latest</a><a href="#categories">Explore</a><a href="#programs">Programs</a></nav><details><summary aria-label="Open category menu"><span>Menu</span><b>＋</b></summary><div>{categories.map((category) => <Link href={`/prototype/style-8/category/${category.slug}`} key={category.slug}>{category.label}</Link>)}</div></details></header>;
}

function PatchworkHero({ lead, supporting }: { lead: Title; supporting: Title[] }) {
  return <section className="s8-hero"><div className="s8-hero__intro" data-s8-reveal><p>Thai PBS / Stories for every day</p><h1>Stories made<br />close to <i>home.</i></h1><span>พบรายการ เรื่องเล่า และมุมมองใหม่ ๆ ที่ชวนให้คุณมองโลกใกล้ตัวด้วยสายตาที่ต่างออกไป</span><Link href={`/prototype/style-8/article/${lead.slug}`}>Explore the feature <b>↘</b></Link></div><div className="s8-hero__patches"><Link className="s8-hero-card s8-hero-card--lead" href={`/prototype/style-8/article/${lead.slug}`}><StoryImage priority title={lead} /><div><p>{titleCategories(lead)[0]?.label}</p><h2>{titleInlineText(lead)}</h2><span>{lead.description}</span><b>Open story ↘</b></div></Link>{supporting.slice(0, 2).map((item, index) => <Link className={`s8-hero-card s8-hero-card--${index + 1}`} href={`/prototype/style-8/article/${item.slug}`} key={item.slug}><StoryImage title={item} /><div><p>{titleCategories(item)[0]?.label}</p><h2>{titleInlineText(item)}</h2><span>{item.description}</span><b>See programme ↘</b></div></Link>)}</div></section>;
}

function WelcomeStory({ title }: { title?: Title }) { if (!title) return null; return <section className="s8-welcome" data-s8-reveal><div><span>Hello, curious minds</span><h2>Find something<br />worth staying for.</h2><p>ทุกเรื่องราวถูกจัดวางให้ค้นพบได้ง่าย ตั้งแต่รายการใหม่ ไปจนถึงสารคดีและเรื่องเล่าที่คุณอาจพลาดไป</p><Link href={`/prototype/style-8/article/${title.slug}`}>Start exploring ↘</Link></div><StoryImage title={title} /></section>; }
function FreshStories({ titles }: { titles: Title[] }) { if (!titles.length) return null; return <section className="s8-fresh" id="fresh"><PatchHeading label="Fresh from Thai PBS" number="01" /><div>{titles.map((title, index) => <EditorialRow index={index} key={title.slug} title={title} />)}</div></section>; }
function DiscoveryBoard({ titles }: { titles: Title[] }) { if (!titles.length) return null; return <section className="s8-discovery" id="recommended"><div className="s8-discovery__intro" data-s8-reveal><span>Made for wandering</span><h2>Pick a story.<br />Follow the <i>feeling.</i></h2><p>A playful route through programmes selected from the Thai PBS catalogue.</p></div><div className="s8-discovery__board">{titles.slice(0, 4).map((title, index) => <PatchCard index={index} key={title.slug} title={title} />)}</div></section>; }
function VisualBreak({ title }: { title: Title }) { return <section className="s8-visual-break" data-s8-reveal><Link href={`/prototype/style-8/article/${title.slug}`}><StoryImage title={title} /><div><p>Learn something new</p><h2>{titleInlineText(title)}</h2><span>{title.description}</span><b>Explore this story ↘</b></div></Link></section>; }
function LatestStories({ titles }: { titles: Title[] }) { if (!titles.length) return null; return <section className="s8-latest" id="latest"><PatchHeading label="Latest stories" number="02" /><div>{titles.map((title, index) => <Link className="s8-latest__item" data-s8-reveal href={`/prototype/style-8/article/${title.slug}`} key={title.slug}><span>{String(index + 1).padStart(2, "0")}</span><StoryImage title={title} /><div><p>{titleCategories(title)[0]?.label}</p><h3>{titleInlineText(title)}</h3><small>{title.description}</small></div><b>↘</b></Link>)}</div></section>; }
function CollectionPatch({ id, index, title, titles }: { id: string; index: number; title: string; titles: Title[] }) { return <section className={`s8-collection s8-collection--${index % 3}`} id={id}><PatchHeading label={title} number={String(index + 3).padStart(2, "0")} /><div>{titles.slice(0, 5).map((item, itemIndex) => <PatchCard index={itemIndex} key={item.slug} title={item} />)}</div></section>; }
function PatchCategories({ categories }: { categories: CategoryTile[] }) { if (!categories.length) return null; return <section className="s8-categories" id="categories"><header className="s8-category-head" data-s8-reveal><span>Explore by interest</span><h2>Find your<br />next <i>world.</i></h2><p>Choose a category and see where it takes you.</p></header><div className="s8-category-patches">{categories.map((category, index) => <Link className={`s8-category-patch s8-category-patch--${index % 6}`} data-s8-reveal href={`/prototype/style-8/category/${encodeURIComponent(category.slug)}`} key={category.id}>{category.imageUrl ? <Image alt="" fill sizes="(max-width: 640px) 90vw, 32vw" src={category.imageUrl} /> : <span className="s8-category-patch__fallback" data-tone={category.id % 4} />}<small>{String(index + 1).padStart(2, "0")}</small><strong>{category.name}</strong><b>↘</b></Link>)}</div></section>; }
function PatchHeading({ label, number }: { label: string; number: string }) { return <header className="s8-section-head" data-s8-reveal><span>{number}</span><h2>{label}</h2><i>✦</i></header>; }
function EditorialRow({ index, title }: { index: number; title: Title }) { return <Link className={`s8-editorial-row s8-editorial-row--${index % 2}`} data-s8-reveal href={`/prototype/style-8/article/${title.slug}`}><StoryImage title={title} /><div><span>{String(index + 1).padStart(2, "0")} / {titleCategories(title)[0]?.label}</span><h3>{titleInlineText(title)}</h3><p>{title.description}</p><b>Read more ↘</b></div></Link>; }
function PatchCard({ index, title }: { index: number; title: Title }) { return <Link className={`s8-card s8-card--${index % 5}`} data-s8-reveal href={`/prototype/style-8/article/${title.slug}`}><StoryImage title={title} /><div><p>{titleCategories(title)[0]?.label || title.type}</p><h3>{titleInlineText(title)}</h3><span>{title.year} · {title.duration || title.type}</span><b>↘</b></div></Link>; }
function StoryImage({ className = "", priority = false, title }: { className?: string; priority?: boolean; title: Title }) { const image = title.heroImage || title.posterImage; return <div className={`s8-image ${className}`}>{image ? <Image alt="" fill priority={priority} sizes="(max-width: 720px) 100vw, 60vw" src={image} /> : <span className="s8-image__fallback" data-tone={Math.abs(hash(title.slug)) % 4} />}</div>; }
function StyleEightFooter() { return <footer className="s8-footer"><div><b>Thai PBS</b><i>Patchwork</i></div><p>Stories, ideas and programmes—made easy to explore.</p><a href="#top">Back to top ↑</a></footer>; }

function unique(items: Title[]) { return [...new Map(items.map((item) => [item.slug, item])).values()]; }
function hash(value: string) { return [...value].reduce((total, character) => ((total << 5) - total) + character.charCodeAt(0), 0); }
function collectionSections(collections: TitleCollections) { const rows: Array<{ id: string; title: string; titles: Title[] }> = []; const add = (id: string, title: string, titles: Title[]) => { if (titles.length) rows.push({ id, title, titles }); }; add("recommended", "Recommended", collections.recommended); for (const row of collections.typeRows) add(`type-${row.type.id}`, row.type.name, row.titles); add("continue-watching", "Continue Watching", collections.continueWatching); add("continue-programs", "Continue Programs", collections.continuePrograms); add("discontinued", "Discontinued Programs", collections.discontinuedPrograms); for (const row of collections.yearRows) add(`year-${row.year}`, `Thai PBS Year ${row.year}`, row.titles); add("thai", "Thai Programs", collections.thaiPrograms); add("international", "International", collections.internationalPrograms); return rows; }
