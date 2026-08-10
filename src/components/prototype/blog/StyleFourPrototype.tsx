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

export function StyleFourHome({ categoryTiles, collections, titles }: HomeProps) {
  const lead = titles.find((title) => title.featured) ?? titles[0];
  const featuredPrograms = unique([...titles.filter((title) => title.featured), ...titles]).slice(0, 5);
  const newTitles = titles.filter((title) => title.isNew).slice(0, 5);
  const recommended = collections.recommended.filter((title) => title.slug !== lead?.slug);
  const recommendedTitles = recommended.length ? unique(recommended).slice(0, 6) : titles.filter((title) => title.slug !== lead?.slug).slice(0, 6);
  const latestTitles = unique([...titles.filter((title) => !title.isDiscontinued), ...recommended]).slice(0, 6);
  const programSections = [
    { id: "new", title: "New", titles: newTitles.length ? newTitles : titles.slice(0, 6) },
    { id: "featured", title: "Featured", titles: featuredPrograms },
    { id: "recommended", title: "Recommended", titles: recommendedTitles },
    { id: "latest", title: "Latest", titles: latestTitles },
    ...collectionSections(collections).filter((section) => section.id !== "recommended"),
  ].filter((section) => section.titles.length);

  return (
    <StyleFourMotion>
      <div className="s4-shell">
        <StyleFourHeader categories={getPrototypeCategories(titles)} />
        {lead ? <StyleFourShowcase programs={featuredPrograms} /> : null}
        <StyleFourExplore categories={categoryTiles} />
        <section className="s4-program-hub" id="programs">
          {programSections.map((section) => <ProgramBand id={section.id} key={section.id} title={section.title} titles={section.titles} />)}
        </section>
      </div>
    </StyleFourMotion>
  );
}

export function StyleFourCategory({ category, titles }: CategoryProps) {
  return <StyleFourMotion><div className="s4-shell s4-inner"><StyleFourHeader categories={getPrototypeCategories(titles)} /><main>
    <header className="s4-inner-head"><Link href="/prototype/style-4">← Index</Link><span>Category / {String(titles.length).padStart(2, "0")}</span><h1>{category.label}</h1><p>A current of stories, selected from the Thai PBS catalogue.</p></header>
    <section className="s4-archive">{titles.map((title, index) => <StreamStory index={index} key={title.slug} title={title} />)}</section>
  </main></div></StyleFourMotion>;
}

export function StyleFourArticle({ related, title }: ArticleProps) {
  const category = titleCategories(title)[0];
  return <StyleFourMotion><div className="s4-shell s4-inner"><StyleFourHeader categories={getPrototypeCategories([title, ...related])} /><main>
    <article className="s4-article"><StoryImage className="s4-article__image" priority title={title} /><h1 className="s4-article-title">{titleInlineText(title)}</h1><div className="s4-article__body"><p>{title.description}</p><dl><div><dt>Category</dt><dd>{category.label}</dd></div><div><dt>Format</dt><dd>{title.type}</dd></div><div><dt>Duration</dt><dd>{title.duration || "—"}</dd></div></dl></div></article>
    {related.length ? <section className="s4-article-related"><span>Next wave</span>{related.map((item, index) => <StreamStory index={index} key={item.slug} title={item} />)}</section> : null}
  </main></div></StyleFourMotion>;
}

function StyleFourMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let stageLocked = false;
    let stageTimer = 0;
    const update = () => {
      frame = 0;
      element.style.setProperty("--s4-scroll", String(window.scrollY));
      const sequence = element.querySelector<HTMLElement>("[data-s4-featured-sequence]");
      const frameElement = sequence?.querySelector<HTMLElement>(".s4-showcase__frame");
      if (!sequence || !frameElement) return;
      const travel = Math.max(1, sequence.offsetHeight - frameElement.offsetHeight);
      const progress = Math.min(1, Math.max(0, -sequence.getBoundingClientRect().top / travel));
      const slides = Array.from(sequence.querySelectorAll<HTMLElement>("[data-s4-feature-slide]"));
      const stage = progress * Math.max(0, slides.length - 1);
      sequence.style.setProperty("--s4-feature-progress", progress.toFixed(4));
      slides.forEach((slide, index) => {
        const distance = stage - index;
        const presence = Math.max(0, 1 - Math.abs(distance));
        slide.style.setProperty("--s4-slide-progress", distance.toFixed(4));
        slide.style.setProperty("--s4-slide-presence", presence.toFixed(4));
        slide.style.setProperty("--s4-slide-scale", (0.9 + presence * 0.1).toFixed(4));
        slide.style.setProperty("--s4-slide-blur", `${Math.min(12, Math.abs(distance) * 12).toFixed(2)}px`);
      });
    };
    const request = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    const stepFeaturedProgram = (event: WheelEvent) => {
      const sequence = element.querySelector<HTMLElement>("[data-s4-featured-sequence]");
      const frameElement = sequence?.querySelector<HTMLElement>(".s4-showcase__frame");
      const slides = sequence ? Array.from(sequence.querySelectorAll<HTMLElement>("[data-s4-feature-slide]")) : [];
      if (!sequence || !frameElement || slides.length < 2) return;
      const sequenceTop = window.scrollY + sequence.getBoundingClientRect().top;
      const travel = Math.max(1, sequence.offsetHeight - frameElement.offsetHeight);
      const offset = window.scrollY - sequenceTop;
      const direction = Math.sign(event.deltaY);
      if (!direction || offset < -1 || offset > travel + 1) return;
      const currentStage = Math.round((offset / travel) * (slides.length - 1));
      const nextStage = Math.min(slides.length - 1, Math.max(0, currentStage + direction));
      if (nextStage === currentStage) return;
      event.preventDefault();
      if (stageLocked) return;
      stageLocked = true;
      window.scrollTo({ behavior: "smooth", top: sequenceTop + (travel * nextStage) / (slides.length - 1) });
      stageTimer = window.setTimeout(() => { stageLocked = false; }, 520);
    };
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add("is-visible"); }), { threshold: 0.16 });
    element.querySelectorAll("[data-reveal]").forEach((item) => observer.observe(item));
    update(); window.addEventListener("scroll", request, { passive: true }); window.addEventListener("wheel", stepFeaturedProgram, { passive: false });
    return () => { window.removeEventListener("scroll", request); window.removeEventListener("wheel", stepFeaturedProgram); observer.disconnect(); window.clearTimeout(stageTimer); if (frame) window.cancelAnimationFrame(frame); };
  }, []);
  return <div className="style-four" ref={root}>{children}</div>;
}

function StyleFourHeader({ categories }: { categories: PrototypeCategory[] }) {
  return <header className="s4-header"><Link href="/prototype/style-4" className="s4-logo"><b>Thai PBS</b><i>Afterimage</i></Link><nav><a href="#new">New</a><a href="#featured">Featured</a><a href="#recommended">Recommended</a></nav><details><summary aria-label="Open navigation"><span /><span /></summary><div>{categories.slice(0, 6).map((category) => <Link href={`/prototype/style-4/category/${category.slug}`} key={category.slug}>{category.label}</Link>)}</div></details></header>;
}

function StyleFourExplore({ categories }: { categories: CategoryTile[] }) {
  if (!categories.length) return null;
  return <section className="s4-explore" id="categories"><EditorialCategoryTiles categories={categories} style="style-4" /></section>;
}

function StyleFourShowcase({ programs }: { programs: Title[] }) {
  const style = {
    "--s4-feature-count": programs.length,
    "--s4-showcase-height": `${100 + Math.max(0, programs.length - 1) * 88}svh`,
    "--s4-showcase-mobile-height": `${programs.length * 80}svh`,
  } as CSSProperties;
  return <section className="s4-showcase" data-s4-featured-sequence style={style}>
    <div className="s4-showcase__frame">
      <div className="s4-showcase__deck">
        {programs.map((program, index) => <Link aria-label={`Open ${titleInlineText(program)}`} className="s4-showcase__slide" data-s4-feature-slide href={`/prototype/style-4/article/${program.slug}`} key={program.slug}>
          <StoryImage className="s4-showcase__art" priority={index === 0} title={program} />
          <div className="s4-showcase__wash" />
          <div className="s4-showcase__copy"><p>{String(index + 1).padStart(2, "0")} / {titleCategories(program)[0]?.label || "Featured"}</p><h1>{titleInlineText(program)}</h1><div><span>{[program.year, program.duration, program.rating].filter(Boolean).join(" / ")}</span><small>{program.description}</small></div></div>
          <span className="s4-showcase__open">Open story <b>↗</b></span>
        </Link>)}
      </div>
      <div className="s4-showcase__counter" aria-hidden="true"><i /><span>Rotate through the current</span></div>
    </div>
  </section>;
}

function StoryPanel({ index, title }: { index: number; title: Title }) { return <Link className="s4-story-panel s4-reveal" data-reveal href={`/prototype/style-4/article/${title.slug}`}><StoryImage title={title} /><span>{String(index + 1).padStart(2, "0")} / {titleCategories(title)[0]?.label}</span><h3>{titleInlineText(title)}</h3><small>{title.duration || title.year}</small></Link>; }
function ProgramBand({ id, title, titles }: { id: string; title: string; titles: Title[] }) { return <section className="s4-program-band" id={id}><header><h3>{title}</h3></header><div>{titles.slice(0, 7).map((item, itemIndex) => <StoryPanel index={itemIndex} key={item.slug} title={item} />)}</div></section>; }
function StreamStory({ index, title }: { index: number; title: Title }) { return <Link className="s4-stream-story s4-reveal" data-reveal href={`/prototype/style-4/article/${title.slug}`}><span>{String(index + 1).padStart(2, "0")}</span><StoryImage title={title} /><div><p>{titleCategories(title)[0]?.label} / {title.year}</p><h3>{titleInlineText(title)}</h3><small>{title.description}</small></div><i>↗</i></Link>; }
function StoryImage({ className = "", priority = false, title }: { className?: string; priority?: boolean; title: Title }) { const image = title.heroImage || title.posterImage; return <div className={`s4-image ${className}`}>{image ? <Image alt="" fill priority={priority} sizes="(max-width: 700px) 100vw, 60vw" src={image} /> : <div className="s4-image__fallback" data-tone={Math.abs(hash(title.slug)) % 4} />}</div>; }

function unique(titles: (Title | undefined)[]) { return [...new Map(titles.filter(Boolean).map((title) => [title!.slug, title!])).values()]; }
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
