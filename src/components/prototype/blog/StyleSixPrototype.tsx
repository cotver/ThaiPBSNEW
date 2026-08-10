"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { titleInlineText, type Title } from "@/lib/content";
import type { CategoryTile, TitleCollections } from "@/lib/payload-content";
import { EditorialCategoryTiles } from "./EditorialCategoryTiles";
import { getPrototypeCategories, titleCategories, type PrototypeCategory } from "./blog-data";

type HomeProps = { categoryTiles: CategoryTile[]; collections: TitleCollections; titles: Title[] };
type CategoryProps = { category: PrototypeCategory; titles: Title[] };
type ArticleProps = { related: Title[]; title: Title };

export function StyleSixHome({ categoryTiles, collections, titles }: HomeProps) {
  const available = titles.filter((item) => !item.isDiscontinued);
  const featured = unique([...available.filter((item) => item.featured), ...available]).slice(0, 4);
  const newTitles = unique([...available.filter((item) => item.isNew), ...available]).slice(0, 5);
  const recommended = unique([...collections.recommended, ...available]).slice(0, 7);
  const latest = unique([...available, ...collections.continueWatching]).slice(0, 7);
  const collectionsToShow = collectionSections(collections).filter((row) => !["recommended", "continue-watching"].includes(row.id));

  return <StyleSixMotion><div className="s6-shell" id="top">
    <StyleSixHeader categories={getPrototypeCategories(titles)} />
    <main>
      {featured.length ? <StoryDeck stories={featured} /> : null}
      <NewMosaic titles={newTitles} />
      {featured[1] ? <Spotlight title={featured[1]} /> : null}
      <RecommendationRail titles={recommended} />
      <LatestLedger titles={latest} />
      {categoryTiles.length ? <section className="s6-explore" id="categories" data-s6-reveal><EditorialCategoryTiles categories={categoryTiles} style="style-6" /></section> : null}
      <section className="s6-programs" id="programs">{collectionsToShow.map((row, index) => <ProgramSet index={index} key={row.id} {...row} />)}</section>
    </main>
    <StyleSixFooter />
  </div></StyleSixMotion>;
}

export function StyleSixCategory({ category, titles }: CategoryProps) {
  return <StyleSixMotion><div className="s6-shell s6-inner">
    <StyleSixHeader categories={getPrototypeCategories(titles)} />
    <main><header className="s6-index-head" data-s6-reveal><span>Thai PBS / Catalogue</span><h1>{category.label}</h1><p>{String(titles.length).padStart(2, "0")} programmes in this current</p></header><section className="s6-index-grid">{titles.map((item, index) => <ProgramCard index={index} key={item.slug} title={item} />)}</section></main>
    <StyleSixFooter />
  </div></StyleSixMotion>;
}

export function StyleSixArticle({ related, title }: ArticleProps) {
  const category = titleCategories(title)[0];
  return <StyleSixMotion><div className="s6-shell s6-inner">
    <StyleSixHeader categories={getPrototypeCategories([title, ...related])} />
    <main><article className="s6-article"><FrameImage className="s6-article__image" priority title={title} /><div className="s6-article__lead" data-s6-reveal><p>{category.label} / {title.type}</p><h1>{titleInlineText(title)}</h1><span>{[title.year, title.duration, title.rating].filter(Boolean).join(" · ")}</span></div><div className="s6-article__body"><p>{title.description}</p><dl><div><dt>Category</dt><dd>{category.label}</dd></div><div><dt>Format</dt><dd>{title.type}</dd></div><div><dt>Duration</dt><dd>{title.duration || "—"}</dd></div></dl></div></article>{related.length ? <section className="s6-related"><SectionHead label="Next current" number="/06" /><div>{related.slice(0, 4).map((item, index) => <ProgramCard index={index} key={item.slug} title={item} />)}</div></section> : null}</main>
    <StyleSixFooter />
  </div></StyleSixMotion>;
}

function StyleSixMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      element.style.setProperty("--s6-scroll", String(window.scrollY));
      const deck = element.querySelector<HTMLElement>("[data-s6-deck]");
      const sticky = deck?.querySelector<HTMLElement>(".s6-deck__sticky");
      const slides = deck ? Array.from(deck.querySelectorAll<HTMLElement>("[data-s6-slide]")) : [];
      if (!deck || !sticky || !slides.length) return;
      const travel = Math.max(1, deck.offsetHeight - sticky.offsetHeight);
      const progress = Math.min(1, Math.max(0, -deck.getBoundingClientRect().top / travel));
      const stage = progress * (slides.length - 1);
      deck.style.setProperty("--s6-deck-progress", progress.toFixed(4));
      slides.forEach((slide, index) => {
        const distance = stage - index;
        const presence = Math.max(0, 1 - Math.abs(distance));
        slide.style.setProperty("--s6-distance", distance.toFixed(4));
        slide.style.setProperty("--s6-presence", presence.toFixed(4));
      });
    };
    const request = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
    }), { threshold: .14 });
    element.querySelectorAll<HTMLElement>("[data-s6-reveal]").forEach((item) => observer.observe(item));
    update(); window.addEventListener("scroll", request, { passive: true });
    return () => { window.removeEventListener("scroll", request); observer.disconnect(); if (frame) cancelAnimationFrame(frame); };
  }, []);
  return <div className="style-six" ref={root}>{children}</div>;
}

function StyleSixHeader({ categories }: { categories: PrototypeCategory[] }) {
  return <header className="s6-header"><Link className="s6-brand" href="/prototype/style-6"><span>Thai</span><b>PBS</b><i>Current</i></Link><nav><a href="#new">New</a><a href="#recommended">Recommended</a><a href="#programs">Programs</a></nav><details><summary><span>Explore</span><b>＋</b></summary><div>{categories.map((category) => <Link href={`/prototype/style-6/category/${category.slug}`} key={category.slug}>{category.label}</Link>)}</div></details></header>;
}

function StoryDeck({ stories }: { stories: Title[] }) {
  const style = { "--s6-deck-height": `${100 + Math.max(0, stories.length - 1) * 76}svh` } as CSSProperties;
  return <section className="s6-deck" data-s6-deck style={style}><div className="s6-deck__sticky"><div className="s6-deck__stage">{stories.map((story, index) => <Link className="s6-deck__slide" data-s6-slide href={`/prototype/style-6/article/${story.slug}`} key={story.slug}><FrameImage className="s6-deck__image" priority={index === 0} title={story} /><div className="s6-deck__veil" /><div className="s6-deck__copy"><p>{String(index + 1).padStart(2, "0")} / {titleCategories(story)[0]?.label || "Featured"}</p><h1>{titleInlineText(story)}</h1><div><span>{story.duration || story.type}</span><small>{story.description}</small></div></div><em>Open ↗</em></Link>)}</div><div className="s6-deck__meter" aria-hidden="true"><i /><span>Scroll through stories</span><b>{String(stories.length).padStart(2, "0")}</b></div></div></section>;
}

function NewMosaic({ titles }: { titles: Title[] }) { if (!titles.length) return null; return <section className="s6-new" id="new"><SectionHead label="New signals" number="/01" /><div>{titles.map((title, index) => <ProgramCard index={index} key={title.slug} title={title} />)}</div></section>; }
function Spotlight({ title }: { title: Title }) { return <section className="s6-spotlight" data-s6-reveal><Link href={`/prototype/style-6/article/${title.slug}`}><FrameImage title={title} /><div><p>Focus / Thai PBS</p><h2>{titleInlineText(title)}</h2><span>Enter story →</span></div></Link></section>; }
function RecommendationRail({ titles }: { titles: Title[] }) { if (!titles.length) return null; return <section className="s6-recommended" id="recommended"><SectionHead label="Picked for your now" number="/02" /><div>{titles.map((title, index) => <ProgramCard index={index} key={title.slug} title={title} />)}</div></section>; }
function LatestLedger({ titles }: { titles: Title[] }) { if (!titles.length) return null; return <section className="s6-latest"><SectionHead label="Latest transmission" number="/03" /><div>{titles.map((title, index) => <Link className="s6-latest__item" data-s6-reveal href={`/prototype/style-6/article/${title.slug}`} key={title.slug}><b>{String(index + 1).padStart(2, "0")}</b><h3>{titleInlineText(title)}</h3><span>{titleCategories(title)[0]?.label}</span><FrameImage title={title} /><i>↗</i></Link>)}</div></section>; }
function ProgramSet({ id, index, title, titles }: { id: string; index: number; title: string; titles: Title[] }) { return <section className={`s6-program-set s6-program-set--${index % 3}`} id={id}><SectionHead label={title} number={`/${String(index + 4).padStart(2, "0")}`} /><div>{titles.slice(0, 5).map((item, itemIndex) => <ProgramCard index={itemIndex} key={item.slug} title={item} />)}</div></section>; }
function SectionHead({ label, number }: { label: string; number: string }) { return <header className="s6-section-head" data-s6-reveal><span>{number}</span><h2>{label}</h2><i /></header>; }
function ProgramCard({ index, title }: { index: number; title: Title }) { return <Link className={`s6-card s6-card--${index % 5}`} data-s6-reveal href={`/prototype/style-6/article/${title.slug}`}><FrameImage title={title} /><div><p>{titleCategories(title)[0]?.label || title.type}</p><h3>{titleInlineText(title)}</h3><span>{title.year} / {title.duration || title.type}</span></div></Link>; }
function FrameImage({ className = "", priority = false, title }: { className?: string; priority?: boolean; title: Title }) { const image = title.heroImage || title.posterImage; return <div className={`s6-image ${className}`}>{image ? <Image alt="" fill priority={priority} sizes="(max-width: 720px) 100vw, 60vw" src={image} /> : <span className="s6-image__fallback" data-tone={Math.abs(hash(title.slug)) % 4} />}</div>; }
function StyleSixFooter() { return <footer className="s6-footer"><p>Thai PBS <i>Current</i></p><span>One catalogue / many ways in</span><a href="#top">Back to start ↑</a></footer>; }

function unique(items: Title[]) { return [...new Map(items.map((item) => [item.slug, item])).values()]; }
function hash(value: string) { return [...value].reduce((total, character) => ((total << 5) - total) + character.charCodeAt(0), 0); }
function collectionSections(collections: TitleCollections) { const rows: Array<{ id: string; title: string; titles: Title[] }> = []; const add = (id: string, title: string, titles: Title[]) => { if (titles.length) rows.push({ id, title, titles }); }; add("recommended", "Recommended", collections.recommended); for (const row of collections.typeRows) add(`type-${row.type.id}`, row.type.name, row.titles); add("continue-watching", "Continue Watching", collections.continueWatching); add("continue-programs", "Continue Programs", collections.continuePrograms); add("discontinued", "Discontinued Programs", collections.discontinuedPrograms); for (const row of collections.yearRows) add(`year-${row.year}`, `Thai PBS Year ${row.year}`, row.titles); add("thai", "Thai Programs", collections.thaiPrograms); add("international", "International", collections.internationalPrograms); return rows; }
