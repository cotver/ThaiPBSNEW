"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import styles from "./StudiosShowcase.module.css";

type CatalogFilter = "new" | "newEpisodes" | "comingSoon";

export type StudiosCatalogArticle = {
  badge: string;
  dateLabel?: string;
  description?: string;
  id: number;
  href: string;
  imageAlt: string;
  imageUrl: string;
  tags: string[];
  title: string;
};

export type StudiosCatalogCategory = {
  articles: Record<CatalogFilter, StudiosCatalogArticle[]>;
  coverAlt: string;
  coverImageUrl?: string;
  id: number;
  name: string;
  slug: string;
};

const filters: { label: string; value: CatalogFilter }[] = [
  { label: "New", value: "new" },
  { label: "New Episodes", value: "newEpisodes" },
  { label: "Coming Soon", value: "comingSoon" },
];

function CategorySection({ category }: { category: StudiosCatalogCategory }) {
  const availableFilters = filters.filter((filter) => category.articles[filter.value].length > 0);
  const [activeFilter, setActiveFilter] = useState<CatalogFilter>(availableFilters[0]?.value || "new");
  const visibleFilter = availableFilters.some((filter) => filter.value === activeFilter)
    ? activeFilter
    : availableFilters[0]?.value || "new";
  const articles = category.articles[visibleFilter];

  if (!availableFilters.length) return null;

  return (
    <section className={styles.programSection} id={`studio-${category.slug}`} aria-labelledby={`studio-${category.slug}-heading`}>
      <div className={styles.sectionHeading}>
        <div>
          <h3 id={`studio-${category.slug}-heading`}>{category.name}</h3>
          <span className={styles.articleCount}>{articles.length} articles</span>
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

      <div className={styles.programGrid}>
        {articles.map((article) => (
          <article className={styles.programCard} key={article.id}>
            <Link aria-label={`Read ${article.title}`} className={styles.programImage} href={article.href}>
              <Image alt={article.imageAlt} fill sizes="(max-width: 720px) 84vw, 31vw" src={article.imageUrl} />
              <span className={styles.newBadge}>{article.badge}</span>
            </Link>
            <h4><Link href={article.href}>{article.title}</Link></h4>
            {article.dateLabel ? <p className={styles.format}>{article.dateLabel}</p> : null}
            {article.description ? <p className={styles.cardDescription}>{article.description}</p> : null}
            {article.tags.length ? <ul>{article.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function StudiosCatalog({ categories }: { categories: StudiosCatalogCategory[] }) {
  const visibleCategories = categories.filter((category) => Object.values(category.articles).some((articles) => articles.length));
  if (!visibleCategories.length) return null;

  return (
    <>
      {visibleCategories.map((category) => <CategorySection category={category} key={category.id} />)}

      <section className={styles.selections} aria-label="Column Categories">
        {visibleCategories.map((category) => (
          <a className={styles.selectionCard} href={`#studio-${category.slug}`} key={category.id}>
            <span className={styles.selectionArt}>
              {category.coverImageUrl ? <Image alt={category.coverAlt} fill sizes="(max-width: 720px) 100vw, 33vw" src={category.coverImageUrl} /> : null}
              <span>{category.name}</span>
            </span>
            <strong className={styles.selectionTitle}>{category.name}</strong>
          </a>
        ))}
      </section>
    </>
  );
}
