"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./StudiosShowcase.module.css";

export type CatalogFilter = "new" | "newEpisodes" | "comingSoon";

export type StudiosCatalogArticle = {
  badge: string;
  dateLabel?: string;
  description?: string;
  id: number;
  href: string;
  imageAlt: string;
  imageUrl?: string;
  tags: string[];
  title: string;
};

export type StudiosCatalogCategory = {
  articles: Record<CatalogFilter | "all", StudiosCatalogArticle[]>;
  coverAlt: string;
  coverImageUrl?: string;
  description?: string;
  id: number;
  name: string;
  slug: string;
};

const filters: { label: string; value: CatalogFilter }[] = [
  { label: "New", value: "new" },
  { label: "New Episodes", value: "newEpisodes" },
  { label: "Coming Soon", value: "comingSoon" },
];

export function StudiosArticleCard({ article }: { article: StudiosCatalogArticle }) {
  return (
    <article className={styles.programCard} data-studios-reveal-item>
      <Link aria-label={`Read ${article.title}`} className={styles.programImage} href={article.href}>
        {article.imageUrl ? <Image alt={article.imageAlt} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 20vw" src={article.imageUrl} /> : null}
        {article.badge ? <span className={styles.newBadge}>{article.badge}</span> : null}
      </Link>
      <h4><Link href={article.href}>{article.title}</Link></h4>
      {article.dateLabel ? <p className={styles.format}>{article.dateLabel}</p> : null}
      {article.description ? <p className={styles.cardDescription}>{article.description}</p> : null}
      {article.tags.length ? <ul>{article.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul> : null}
    </article>
  );
}

function CategorySection({ category }: { category: StudiosCatalogCategory }) {
  const availableFilters = filters.filter((filter) => category.articles[filter.value].length > 0);
  const [activeFilter, setActiveFilter] = useState<CatalogFilter>(availableFilters[0]?.value || "new");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, moved: false, startX: 0, startScroll: 0 });
  const visibleFilter = availableFilters.some((filter) => filter.value === activeFilter)
    ? activeFilter
    : availableFilters[0]?.value || "new";
  const articles = category.articles[visibleFilter];

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const updateScrollState = () => {
      setCanScrollLeft(rail.scrollLeft > 2);
      setCanScrollRight(rail.scrollLeft < rail.scrollWidth - rail.clientWidth - 2);
    };

    rail.scrollLeft = 0;
    updateScrollState();
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(rail);
    return () => resizeObserver.disconnect();
  }, [visibleFilter, articles.length]);

  function scrollRail(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.max(rail.clientWidth * 0.82, 320), behavior: "smooth" });
  }

  function startDrag(event: React.MouseEvent<HTMLDivElement>) {
    if (event.button !== 0 || !railRef.current) return;
    dragRef.current = { active: true, moved: false, startX: event.clientX, startScroll: railRef.current.scrollLeft };
  }

  function moveDrag(event: React.MouseEvent<HTMLDivElement>) {
    const rail = railRef.current;
    const drag = dragRef.current;
    if (!rail || !drag.active) return;
    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > 6) drag.moved = true;
    if (drag.moved) rail.scrollLeft = drag.startScroll - delta;
  }

  function stopDrag() {
    dragRef.current.active = false;
  }

  function preventClickAfterDrag(event: React.MouseEvent<HTMLDivElement>) {
    if (!dragRef.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current.moved = false;
  }

  if (!availableFilters.length) return null;

  return (
    <section className={styles.programSection} id={`studio-${category.slug}`} aria-labelledby={`studio-${category.slug}-heading`}>
      <div className={styles.sectionHeading} data-studios-reveal-item>
        <div>
          <h3 id={`studio-${category.slug}-heading`}>{category.name}</h3>
          <Link className={styles.viewAll} href={`/studios/${encodeURIComponent(category.slug)}?filter=${visibleFilter}`}>
            View All <span aria-hidden="true">›</span>
          </Link>
        </div>
        <div className={styles.filters} role="group" aria-label={`Filter ${category.name} articles`}>
          {availableFilters.map((filter) => (
            <button
              className={visibleFilter === filter.value ? styles.activeFilter : ""}
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.programRail}>
        {canScrollLeft ? (
          <button aria-label={`Scroll ${category.name} articles left`} className={`${styles.railArrow} ${styles.railArrowLeft}`} onClick={() => scrollRail(-1)} type="button">‹</button>
        ) : null}
        <div
          aria-label={`${category.name} articles`}
          className={styles.programGrid}
          onClickCapture={preventClickAfterDrag}
          onDragStart={(event) => event.preventDefault()}
          onMouseDown={startDrag}
          onMouseLeave={stopDrag}
          onMouseMove={moveDrag}
          onMouseUp={stopDrag}
          onScroll={() => {
            const rail = railRef.current;
            if (!rail) return;
            setCanScrollLeft(rail.scrollLeft > 2);
            setCanScrollRight(rail.scrollLeft < rail.scrollWidth - rail.clientWidth - 2);
          }}
          ref={railRef}
          role="region"
          tabIndex={0}
        >
          {articles.map((article) => <StudiosArticleCard article={article} key={article.id} />)}
        </div>
        {canScrollRight ? (
          <button aria-label={`Scroll ${category.name} articles right`} className={`${styles.railArrow} ${styles.railArrowRight}`} onClick={() => scrollRail(1)} type="button">›</button>
        ) : null}
      </div>
    </section>
  );
}

export function StudiosCatalog({ categories, showArticleSections = false }: { categories: StudiosCatalogCategory[]; showArticleSections?: boolean }) {
  const articleCategories = categories.filter((category) => filters.some((filter) => category.articles[filter.value].length));
  if (!categories.length) return null;

  return (
    <>
      {showArticleSections ? articleCategories.map((category) => <CategorySection category={category} key={category.id} />) : null}

      <section className={styles.selections} aria-label="Column Categories">
        {categories.map((category) => (
          <Link
            className={styles.selectionCard}
            data-studios-reveal-item
            href={`/studios/${encodeURIComponent(category.slug)}`}
            key={category.id}
          >
            <span className={styles.selectionArt}>
              {category.coverImageUrl ? <Image alt={category.coverAlt} fill sizes="(max-width: 720px) 100vw, 33vw" src={category.coverImageUrl} /> : null}
            </span>
            <strong className={styles.selectionTitle}>{category.name}</strong>
          </Link>
        ))}
      </section>
    </>
  );
}
