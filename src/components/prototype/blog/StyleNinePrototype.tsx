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

export function StyleNineHome({ categoryTiles, collections, titles }: HomeProps) {
  const available = titles.filter((item) => !item.isDiscontinued);
  const lead = collections.heroes[0] ?? available.find((item) => item.featured) ?? available[0];
  const featured = unique([...available.filter((item) => item.featured), ...collections.recommended, ...available]).find((item) => item.slug !== lead?.slug);
  const recent = unique([...available.filter((item) => item.isNew), ...available]).filter((item) => item.slug !== lead?.slug && item.slug !== featured?.slug).slice(0, 6);
  const recommended = unique([...collections.recommended, ...available]).slice(0, 6);
  const notes = unique([...collections.continueWatching, ...available]).slice(0, 4);
  const rows = collectionSections(collections).slice(0, 4);

  return <StyleNineMotion><div className="s9-shell" id="top">
    <StyleNineHeader categories={getPrototypeCategories(titles)} />
    <main>
      {lead ? <JournalHero lead={lead} /> : null}
      {featured ? <FeaturedJournal title={featured} /> : null}
      <RecentJournal titles={recent} />
      <CatalogueFigures categories={categoryTiles.length} collections={rows.length} titles={available} />
      <CategoryTrail categories={categoryTiles} />
      <FieldNotes titles={notes} />
      <section className="s9-programs" id="programs">{rows.map((row, index) => <ProgramJournal index={index} key={row.id} {...row} />)}</section>
      <VisualDiary titles={recommended} />
    </main>
    <StyleNineFooter categories={getPrototypeCategories(titles)} />
  </div></StyleNineMotion>;
}

export function StyleNineCategory({ category, titles }: CategoryProps) {
  return <StyleNineMotion><div className="s9-shell s9-inner"><StyleNineHeader categories={getPrototypeCategories(titles)} /><main><header className="s9-index-head" data-s9-reveal><p>Thai PBS Journal</p><h1>{category.label}</h1><span>{titles.length} stories selected for this trail</span></header><section className="s9-index-grid">{titles.map((title, index) => <JournalCard index={index} key={title.slug} title={title} />)}</section></main><StyleNineFooter categories={getPrototypeCategories(titles)} /></div></StyleNineMotion>;
}

export function StyleNineArticle({ related, title }: ArticleProps) {
  const category = titleCategories(title)[0];
  return <StyleNineMotion><div className="s9-shell s9-inner"><StyleNineHeader categories={getPrototypeCategories([title, ...related])} /><main><article className="s9-article"><JournalImage className="s9-article__image" priority title={title} /><header className="s9-article__head" data-s9-reveal><p>{category.label}</p><h1>{titleInlineText(title)}</h1><span>{[title.year, title.duration, title.type].filter(Boolean).join(" · ")}</span></header><div className="s9-article__body"><p>{title.description}</p><aside><span>Programme notes</span><dl><div><dt>Category</dt><dd>{category.label}</dd></div><div><dt>Format</dt><dd>{title.type}</dd></div><div><dt>Duration</dt><dd>{title.duration || "—"}</dd></div></dl></aside></div></article>{related.length ? <section className="s9-related"><JournalHeading eyebrow="Continue the journey" title="Related stories" /><div>{related.slice(0, 3).map((item, index) => <JournalCard index={index} key={item.slug} title={item} />)}</div></section> : null}</main><StyleNineFooter categories={getPrototypeCategories([title, ...related])} /></div></StyleNineMotion>;
}

function StyleNineMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const header = element.querySelector<HTMLElement>(".s9-header");
    const onScroll = () => header?.classList.toggle("is-scrolled", window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (reduced) return () => window.removeEventListener("scroll", onScroll);
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }), { threshold: .12, rootMargin: "0px 0px -6%" });
    element.querySelectorAll<HTMLElement>("[data-s9-reveal]").forEach((item) => observer.observe(item));
    return () => { window.removeEventListener("scroll", onScroll); observer.disconnect(); };
  }, []);
  return <div className="style-nine" ref={root}>{children}</div>;
}

function StyleNineHeader({ categories }: { categories: PrototypeCategory[] }) {
  return <header className="s9-header"><Link className="s9-brand" href="/prototype/style-9"><span aria-hidden="true">◌</span><div><b>Thai PBS</b><small>Story Journal</small></div></Link><nav><a href="#recent">New stories</a><a href="#trail">Explore</a><a href="#programs">Programs</a></nav><details><summary aria-label="Open navigation"><i>Menu</i><b>＋</b></summary><div><a href="#recent">New stories</a><a href="#trail">Explore</a><a href="#programs">Programs</a>{categories.slice(0, 5).map((item) => <Link href={`/prototype/style-9/category/${item.slug}`} key={item.slug}>{item.label}</Link>)}</div></details></header>;
}

function JournalHero({ lead }: { lead: Title }) {
  return <section className="s9-hero"><Link className="s9-hero__image" href={`/prototype/style-9/article/${lead.slug}`}><JournalImage priority title={lead} /></Link><div className="s9-welcome" data-s9-reveal><JournalImage portrait title={lead} /><p>Welcome to</p><h1>Stories<br />worth a journey.</h1><span>บันทึกเรื่องราว ผู้คน และโลกใบนี้ ผ่านรายการจาก Thai PBS</span></div><Link className="s9-hero__caption" href={`/prototype/style-9/article/${lead.slug}`}><span>{titleCategories(lead)[0]?.label}</span><b>{titleInlineText(lead)}</b><i>Read the cover story →</i></Link></section>;
}

function FeaturedJournal({ title }: { title: Title }) { return <section className="s9-featured" data-s9-reveal><JournalHeading eyebrow="Editor’s selection" title="Featured story" /><Link href={`/prototype/style-9/article/${title.slug}`}><JournalImage title={title} /><div><p>{[title.year, title.duration].filter(Boolean).join(" · ")}</p><h2>{titleInlineText(title)}</h2><span>{title.description}</span><b>Discover this programme <i>→</i></b></div></Link></section>; }
function RecentJournal({ titles }: { titles: Title[] }) { if (!titles.length) return null; return <section className="s9-recent" id="recent"><JournalHeading eyebrow="Fresh from Thai PBS" title="Recent stories" /><div>{titles.map((title, index) => <JournalCard index={index} key={title.slug} title={title} />)}</div></section>; }
function CatalogueFigures({ categories, collections, titles }: { categories: number; collections: number; titles: Title[] }) { const newCount = titles.filter((item) => item.isNew).length; const globalCount = titles.filter((item) => item.isGlobalProgram).length; return <section className="s9-figures" aria-label="Catalogue overview" data-s9-reveal><div><b>{titles.length}</b><span>Programs<br />to discover</span></div><div><b>{newCount}</b><span>New<br />arrivals</span></div><div><b>{categories}</b><span>Paths by<br />interest</span></div><div><b>{globalCount || collections}</b><span>Global<br />perspectives</span></div></section>; }
function CategoryTrail({ categories }: { categories: CategoryTile[] }) { if (!categories.length) return null; return <section className="s9-trail" id="trail"><JournalHeading eyebrow="Choose your path" title="Explore the journal" /><div>{categories.slice(0, 8).map((category, index) => <Link href={`/prototype/style-9/category/${encodeURIComponent(category.slug)}`} key={category.id} data-s9-reveal><CategoryImage category={category} /><span>0{index + 1}</span><h3>{category.name}</h3><b>Explore →</b></Link>)}</div></section>; }
function FieldNotes({ titles }: { titles: Title[] }) { if (!titles.length) return null; return <section className="s9-notes"><JournalHeading eyebrow="Stories to stay with" title="Field notes" />{titles.map((title, index) => <Link className={`s9-note s9-note--${index % 2}`} href={`/prototype/style-9/article/${title.slug}`} key={title.slug} data-s9-reveal><JournalImage portrait={index % 2 === 1} title={title} /><div><p>Note {String(index + 1).padStart(2, "0")} / {titleCategories(title)[0]?.label}</p><h3>{titleInlineText(title)}</h3><span>{title.description}</span><b>Read the story →</b></div></Link>)}</section>; }
function ProgramJournal({ id, index, title, titles }: { id: string; index: number; title: string; titles: Title[] }) { if (!titles.length) return null; return <section className={`s9-program-journal s9-program-journal--${index % 2}`} id={id}><JournalHeading eyebrow={`Programme journal 0${index + 1}`} title={title} /><div>{titles.slice(0, 5).map((item, itemIndex) => <JournalCard index={itemIndex + index} key={item.slug} title={item} />)}</div></section>; }
function VisualDiary({ titles }: { titles: Title[] }) { if (!titles.length) return null; return <section className="s9-diary"><header data-s9-reveal><p>Keep exploring</p><h2>A visual diary of Thai PBS stories</h2></header><div>{titles.slice(0, 5).map((title, index) => <Link href={`/prototype/style-9/article/${title.slug}`} key={title.slug} aria-label={titleInlineText(title)}><JournalImage portrait={index === 1 || index === 4} title={title} /></Link>)}</div></section>; }
function JournalCard({ index, title }: { index: number; title: Title }) { return <Link className={`s9-card s9-card--${index % 4}`} href={`/prototype/style-9/article/${title.slug}`} data-s9-reveal><JournalImage portrait={index % 4 === 2} title={title} /><div><p>{titleCategories(title)[0]?.label} · {title.duration || title.type}</p><h3>{titleInlineText(title)}</h3><span>{title.description}</span><b>Open story →</b></div></Link>; }
function JournalHeading({ eyebrow, title }: { eyebrow: string; title: string }) { return <header className="s9-heading" data-s9-reveal><p>{eyebrow}</p><h2>{title}</h2></header>; }
function CategoryImage({ category }: { category: CategoryTile }) { return <div className="s9-category-image">{category.imageUrl ? <Image alt="" fill sizes="(max-width: 700px) 78vw, 28vw" src={category.imageUrl} /> : <span data-tone={category.id % 4} />}</div>; }
function JournalImage({ className = "", portrait = false, priority = false, title }: { className?: string; portrait?: boolean; priority?: boolean; title: Title }) { const image = portrait ? (title.posterImage || title.heroImage) : (title.heroImage || title.posterImage); return <div className={`s9-image ${portrait ? "s9-image--portrait" : ""} ${className}`}>{image ? <Image alt="" fill priority={priority} sizes={portrait ? "(max-width: 700px) 80vw, 32vw" : "(max-width: 700px) 100vw, 70vw"} src={image} /> : <span className="s9-image__fallback" data-tone={Math.abs(hash(title.slug)) % 4} />}</div>; }
function StyleNineFooter({ categories }: { categories: PrototypeCategory[] }) { return <footer className="s9-footer"><Link className="s9-brand" href="/prototype/style-9"><span aria-hidden="true">◌</span><div><b>Thai PBS</b><small>Story Journal</small></div></Link><nav>{categories.slice(0, 5).map((item) => <Link href={`/prototype/style-9/category/${item.slug}`} key={item.slug}>{item.label}</Link>)}</nav><div><p>Stories that bring the world closer.</p><a href="#top">Back to the beginning ↑</a></div></footer>; }

function unique(items: Title[]) { return [...new Map(items.map((item) => [item.slug, item])).values()]; }
function hash(value: string) { return [...value].reduce((total, character) => ((total << 5) - total) + character.charCodeAt(0), 0); }
function collectionSections(collections: TitleCollections) { const rows: Array<{ id: string; title: string; titles: Title[] }> = []; const add = (id: string, title: string, titles: Title[]) => { if (titles.length) rows.push({ id, title, titles }); }; add("recommended", "Recommended", collections.recommended); for (const row of collections.typeRows) add(`type-${row.type.id}`, row.type.name, row.titles); add("thai-programs", "Stories from Thailand", collections.thaiPrograms); add("international", "Across the world", collections.internationalPrograms); for (const row of collections.yearRows) add(`year-${row.year}`, `Journal ${row.year}`, row.titles); return rows; }
