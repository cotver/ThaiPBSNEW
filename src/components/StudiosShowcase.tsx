import Image from "next/image";
import Link from "next/link";
import type { ColumnArticle, ColumnCategory, ColumnMedia, ColumnSubcategory, ColumnTag, ColumnVideo } from "../../payload-types";
import { getPayloadClient } from "@/lib/payload-client";
import { columnArticleHref } from "@/lib/content";
import { StudiosCatalog, type StudiosCatalogArticle, type StudiosCatalogCategory } from "./StudiosCatalog";
import { StudiosHero, type StudiosHeroItem } from "./StudiosHero";
import styles from "./StudiosShowcase.module.css";

type StudiosNewsItem = {
  date: string;
  description?: string;
  id: number;
  href: string;
  imageAlt: string;
  imageUrl?: string;
  mark: string;
  title: string;
};
function relationLabel(value: number | ColumnCategory | ColumnSubcategory | ColumnTag): string | undefined {
  return typeof value === "object" ? value.nameEn || value.nameTh : undefined;
}

function relationId(value: number | { id: number }): number {
  return typeof value === "number" ? value : value.id;
}

function articleImage(article: ColumnArticle): ColumnMedia | undefined {
  const horizontalImage = article.heroImages.horizontal[0]?.image;
  return typeof horizontalImage === "object" ? horizontalImage : undefined;
}

function featuredArticleToHero(article: ColumnArticle): StudiosHeroItem | null {
  const image = articleImage(article);
  if (!image?.url) return null;

  const populatedVideo = article.videos?.find((video): video is ColumnVideo => typeof video === "object" && Boolean(video.url));
  const labels = [...(article.categories || []), ...(article.subcategories || [])]
    .map(relationLabel)
    .filter((label): label is string => Boolean(label));

  return {
    description: article.descriptionEn || article.excerptEn || article.descriptionTh || article.excerptTh || undefined,
    eyebrow: labels.join("  ›  ") || undefined,
    id: article.id,
    href: columnArticleHref(article.slug),
    imageAlt: image.alt || article.titleEn || article.titleTh,
    imageUrl: image.url,
    title: article.titleEn || article.titleTh,
    videoAlt: populatedVideo?.alt || undefined,
    videoMimeType: populatedVideo?.mimeType || undefined,
    videoUrl: populatedVideo?.url || undefined,
  };
}

function formatArticleDate(rawDate: string): string | undefined {
  const date = new Date(rawDate);
  return Number.isNaN(date.getTime())
    ? undefined
    : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function articleDateLabel(article: ColumnArticle): string | undefined {
  return formatArticleDate(article.publishedDate || article.createdAt);
}

function articleMark(title: string): string {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function articleToNewsItem(article: ColumnArticle, useEventDate = false): StudiosNewsItem {
  const image = articleImage(article);
  const title = article.titleEn || article.titleTh;
  const rawDate = useEventDate && article.comingSoonDate
    ? article.comingSoonDate
    : article.publishedDate || article.createdAt;

  return {
    date: formatArticleDate(rawDate) || "",
    description: article.descriptionEn || article.excerptEn || article.descriptionTh || article.excerptTh || undefined,
    id: article.id,
    href: columnArticleHref(article.slug),
    imageAlt: image?.alt || title,
    imageUrl: image?.url || undefined,
    mark: articleMark(title),
    title,
  };
}

function articleToCatalogItem(article: ColumnArticle, badge: string, dateLabel?: string): StudiosCatalogArticle | null {
  const image = articleImage(article);
  if (!image?.url) return null;

  const tags = [...(article.subcategories || []), ...(article.tags || [])]
    .map(relationLabel)
    .filter((label): label is string => Boolean(label));

  return {
    badge,
    dateLabel: dateLabel || articleDateLabel(article),
    description: article.descriptionEn || article.excerptEn || article.descriptionTh || article.excerptTh || undefined,
    id: article.id,
    href: columnArticleHref(article.slug),
    imageAlt: image.alt || article.titleEn || article.titleTh,
    imageUrl: image.url,
    tags: [...new Set(tags)],
    title: article.titleEn || article.titleTh,
  };
}

function categoryToCatalog(
  category: ColumnCategory,
  publishedArticles: ColumnArticle[],
  now: number,
): StudiosCatalogCategory {
  const articles = publishedArticles.filter((article) =>
    article.categories?.some((articleCategory) => relationId(articleCategory) === category.id),
  );
  const newArticles = articles.filter((article) => !article.isNewEpisodes && !article.comingSoon);
  const newEpisodes = articles.filter((article) =>
    Boolean(article.isNewEpisodes) &&
    (!article.newEpisodesUntil || new Date(article.newEpisodesUntil).getTime() > now),
  );
  const comingSoon = articles.filter((article) =>
    Boolean(article.comingSoon) &&
    (!article.comingSoonDate || new Date(article.comingSoonDate).getTime() > now),
  );
  const mapArticles = (items: ColumnArticle[], badge: string, dateFor?: (article: ColumnArticle) => string | undefined) =>
    items
      .map((article) => articleToCatalogItem(article, badge, dateFor?.(article)))
      .filter((article): article is StudiosCatalogArticle => Boolean(article));
  const cover = typeof category.coverImage === "object" ? category.coverImage : undefined;
  const fallbackCover = articles.map(articleImage).find((image) => Boolean(image?.url));

  return {
    articles: {
      comingSoon: mapArticles(comingSoon, "Coming Soon", (article) =>
        article.comingSoonDate ? `Coming ${formatArticleDate(article.comingSoonDate)}` : undefined,
      ),
      new: mapArticles(newArticles, "New"),
      newEpisodes: mapArticles(newEpisodes, "New Episodes", (article) =>
        article.newEpisodesUntil ? `Until ${formatArticleDate(article.newEpisodesUntil)}` : undefined,
      ),
    },
    coverAlt: cover?.alt || fallbackCover?.alt || category.nameEn || category.nameTh,
    coverImageUrl: cover?.url || fallbackCover?.url || undefined,
    id: category.id,
    name: category.nameEn || category.nameTh,
    slug: category.slug,
  };
}

async function getStudioContent(): Promise<{
  categories: StudiosCatalogCategory[];
  featuredArticles: StudiosHeroItem[];
  marketsAndEvents: StudiosNewsItem[];
  pressReleases: StudiosNewsItem[];
}> {
  try {
    const payload = await getPayloadClient();
    const now = Date.now();
    const [articleResult, categoryResult] = await Promise.all([
      payload.find({
        collection: "column-articles",
        depth: 2,
        overrideAccess: true,
        pagination: false,
        sort: "-publishedDate",
        where: { _status: { equals: "published" } },
      }),
      payload.find({
        collection: "column-categories",
        depth: 1,
        overrideAccess: true,
        pagination: false,
        sort: "_order",
      }),
    ]);

    const featuredArticles = articleResult.docs
      .filter((article) => article.isFeature && (!article.featureUntil || new Date(article.featureUntil).getTime() > now))
      .map(featuredArticleToHero)
      .filter((item): item is StudiosHeroItem => Boolean(item));
    const categories = categoryResult.docs.map((category) => categoryToCatalog(category, articleResult.docs, now));
    const pressReleases = articleResult.docs
      .filter((article) => article.isPressReleases)
      .map((article) => articleToNewsItem(article));
    const marketsAndEvents = articleResult.docs
      .filter((article) => article.isMarketsAndEvents)
      .map((article) => articleToNewsItem(article, true));

    return { categories, featuredArticles, marketsAndEvents, pressReleases };
  } catch (error) {
    console.warn("Unable to load Column Studios content", error);
    return { categories: [], featuredArticles: [], marketsAndEvents: [], pressReleases: [] };
  }
}

export async function StudiosShowcase() {
  const { categories, featuredArticles, marketsAndEvents, pressReleases } = await getStudioContent();
  const catalogCategories = categories.filter((category) => Object.values(category.articles).some((articles) => articles.length));
  const hasNews = pressReleases.length > 0 || marketsAndEvents.length > 0;
  if (!featuredArticles.length && !catalogCategories.length && !hasNews) return null;

  return (
    <section className={styles.showcase} aria-label="Thai PBS Studios">
      {featuredArticles.length ? <StudiosHero items={featuredArticles} /> : null}

      {catalogCategories.length ? (
        <div className={styles.catalog} id="catalog">
          <StudiosCatalog categories={catalogCategories} />
        </div>
      ) : null}

      {hasNews ? (
        <section className={styles.lightSection} id="news" aria-label="Studios news and events">
          {pressReleases.length ? (
            <>
              <h2>Press Releases</h2>
              <div className={styles.pressGrid}>
                {pressReleases.map((item) => (
                  <Link className={styles.pressCard} href={item.href} key={item.id}>
                    <span className={styles.pressImage}>{item.imageUrl ? <Image alt={item.imageAlt} fill sizes="(max-width: 720px) 38vw, 18vw" src={item.imageUrl} /> : null}</span>
                    <span className={styles.pressCopy}><time>{item.date}</time><strong>{item.title}</strong>{item.description ? <small>{item.description}</small> : null}</span>
                  </Link>
                ))}
              </div>
            </>
          ) : null}
          {marketsAndEvents.length ? (
            <>
              <h2 className={pressReleases.length ? styles.eventsTitle : undefined}>Markets and Events</h2>
              <div className={styles.eventGrid}>
                {marketsAndEvents.map((item) => (
                  <Link className={styles.eventCard} href={item.href} key={item.id}>
                    <div className={styles.eventMark}>{item.mark}</div>
                    <div><h3>{item.title}</h3><p>{item.date}</p>{item.description ? <small>{item.description}</small> : null}</div>
                    <span className={styles.calendarIcon} aria-hidden>▦</span>
                  </Link>
                ))}
              </div>
            </>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
