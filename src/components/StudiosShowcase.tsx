import Image from "next/image";
import Link from "next/link";
import type { ColumnArticle, ColumnCategory, ColumnMedia, ColumnSubcategory, ColumnTag, ColumnVideo } from "../../payload-types";
import { getPayloadClient } from "@/lib/payload-client";
import { columnArticleHref } from "@/lib/content";
import { visiblePageTaxonomy } from "@/lib/column-page-taxonomy";
import { getMarketCompanies, type MarketCompanySummary } from "@/lib/d1-market";
import { buildSlugLookupKeys } from "@/lib/slug-lookup";
import { StudiosCatalog, type StudiosCatalogArticle, type StudiosCatalogCategory } from "./StudiosCatalog";
import { StudiosHero, type StudiosHeroItem } from "./StudiosHero";
import { BeadedCurtainEntrance } from "./BeadedCurtainEntrance";
import { StudiosContentReveal } from "./StudiosContentReveal";
import styles from "./StudiosShowcase.module.css";

export type StudiosNewsItem = {
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
  const labels = [...visiblePageTaxonomy(article.categories), ...visiblePageTaxonomy(article.subcategories)]
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

export function StudiosPressCard({ item }: { item: StudiosNewsItem }) {
  return (
    <Link className={styles.pressCard} href={item.href}>
      <span className={styles.pressImage}>{item.imageUrl ? <Image alt={item.imageAlt} fill sizes="(max-width: 720px) 38vw, 18vw" src={item.imageUrl} /> : null}</span>
      <span className={styles.pressCopy}><time>{item.date}</time><strong>{item.title}</strong>{item.description ? <small>{item.description}</small> : null}</span>
    </Link>
  );
}

export function StudiosEventCard({ item }: { item: StudiosNewsItem }) {
  return (
    <Link className={styles.eventCard} href={item.href}>
      <span className={styles.eventImage}>
        {item.imageUrl ? <Image alt={item.imageAlt} fill sizes="(max-width: 700px) 95px, 130px" src={item.imageUrl} /> : <span className={styles.eventMark}>{item.mark}</span>}
      </span>
      <div><h3>{item.title}</h3><p>{item.date}</p>{item.description ? <small>{item.description}</small> : null}</div>
      <span className={styles.calendarIcon} aria-hidden>▦</span>
    </Link>
  );
}

const officialMarketLogos: Record<string, { alt: string; src: string }> = {
  netflix: {
    alt: "Netflix",
    src: "https://images.ctfassets.net/4cd45et68cgf/7LrExJ6PAj6MSIPkDyCO86/542b1dfabbf3959908f69be546879952/Netflix-Brand-Logo.png",
  },
  tvf: {
    alt: "TVF International",
    src: "https://tvfinternational.com/themes/international/images/tvf_logo4.png",
  },
  viu: {
    alt: "Viu",
    src: "https://www.viu.com/ott/hk/v1/images/Viu_logo.svg",
  },
};

const marketWordmarks: Record<string, { label: string; className: string }> = {
  disney: {
    label: "Disney+",
    className: "font-serif text-[clamp(28px,5vw,58px)] font-bold italic tracking-[-0.08em] text-[#8ed7ff]",
  },
  hbo: {
    label: "HBO",
    className: "text-[clamp(30px,5.4vw,64px)] font-black tracking-[-0.09em] text-white",
  },
  iqiyi: {
    label: "iQIYI",
    className: "rounded-[8px] border-[3px] border-[#00dc5a] px-[0.28em] py-[0.03em] text-[clamp(24px,4.5vw,52px)] font-black tracking-[-0.06em] text-[#00dc5a]",
  },
  true: {
    label: "true",
    className: "text-[clamp(30px,5.4vw,64px)] font-black italic tracking-[-0.09em] text-[#e51b23]",
  },
};

function marketLogoBrand(companySlug: string): string | undefined {
  const compactSlug = companySlug.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "");

  if (compactSlug.includes("netflix")) return "netflix";
  if (compactSlug === "viu" || compactSlug.startsWith("viu")) return "viu";
  if (compactSlug === "tvf" || compactSlug.includes("tvfinternational") || compactSlug.includes("tvfmedia")) return "tvf";
  if (compactSlug.includes("disney")) return "disney";
  if (compactSlug === "max" || compactSlug.includes("hbo")) return "hbo";
  if (compactSlug.includes("iqiyi") || compactSlug.includes("iqyi")) return "iqiyi";
  if (compactSlug.startsWith("true")) return "true";
  return undefined;
}

export function MarketCompanyLogo({
  companyName,
  companySlug,
  priority = false,
  sizes,
}: {
  companyName: string;
  companySlug: string;
  priority?: boolean;
  sizes: string;
}) {
  const brand = marketLogoBrand(companySlug);
  const officialLogo = brand ? officialMarketLogos[brand] : undefined;
  if (officialLogo) {
    return (
      <Image
        alt={`${officialLogo.alt} official logo`}
        className="object-contain"
        data-market-logo-image
        fill
        priority={priority}
        sizes={sizes}
        src={officialLogo.src}
        unoptimized
      />
    );
  }

  const wordmark = brand ? marketWordmarks[brand] : undefined;
  return (
    <span
      aria-label={`${companyName} logo`}
      className={`flex h-full w-full items-center justify-center overflow-hidden text-center ${wordmark?.className || "text-[clamp(20px,3.5vw,44px)] font-black uppercase tracking-[-0.04em] text-white/90"}`}
      data-market-logo-wordmark
      role="img"
    >
      {wordmark?.label || companyName}
    </span>
  );
}

export function StudiosMarketCompanyCard({ company }: { company: MarketCompanySummary }) {
  return (
    <Link
      aria-label={`View programs purchased by ${company.name}`}
      data-market-logo-card
      href={`/studios/market/${encodeURIComponent(company.slug)}`}
      title={company.name}
    >
      <span data-market-logo-frame data-market-brand={company.slug}>
        <MarketCompanyLogo
          companyName={company.name}
          companySlug={company.slug}
          sizes="(max-width: 519px) 72vw, (max-width: 759px) 36vw, 23vw"
        />
      </span>
    </Link>
  );
}

function articleToCatalogItem(article: ColumnArticle, badge: string, dateLabel?: string, includeWithoutImage = false): StudiosCatalogArticle | null {
  const image = articleImage(article);
  if (!image?.url && !includeWithoutImage) return null;

  const tags = [...visiblePageTaxonomy(article.subcategories), ...(article.tags || [])]
    .map(relationLabel)
    .filter((label): label is string => Boolean(label));

  return {
    badge,
    dateLabel: dateLabel || articleDateLabel(article),
    description: article.descriptionEn || article.excerptEn || article.descriptionTh || article.excerptTh || undefined,
    id: article.id,
    href: columnArticleHref(article.slug),
    imageAlt: image?.alt || article.titleEn || article.titleTh,
    imageUrl: image?.url || undefined,
    tags: [...new Set(tags)],
    title: article.titleEn || article.titleTh,
  };
}

function categoryToCatalog(
  category: ColumnCategory,
  publishedArticles: ColumnArticle[],
  now: number,
  articleLimit?: number,
): StudiosCatalogCategory {
  const articles = publishedArticles.filter((article) =>
    article.categories?.some((articleCategory) => relationId(articleCategory) === category.id),
  );
  const newArticles = articles.filter((article) => article.isNormal);
  const newEpisodes = articles.filter((article) =>
    Boolean(article.isNewEpisodes) &&
    (!article.newEpisodesUntil || new Date(article.newEpisodesUntil).getTime() > now),
  );
  const comingSoon = articles.filter((article) =>
    Boolean(article.comingSoon) &&
    (!article.comingSoonDate || new Date(article.comingSoonDate).getTime() > now),
  );
  const mapArticles = (items: ColumnArticle[], badge: string, dateFor?: (article: ColumnArticle) => string | undefined, includeWithoutImage = false) =>
    items
      .map((article) => articleToCatalogItem(article, badge, dateFor?.(article), includeWithoutImage))
      .filter((article): article is StudiosCatalogArticle => Boolean(article))
      .slice(0, articleLimit);
  const cover = typeof category.coverImage === "object" ? category.coverImage : undefined;
  const fallbackCover = articles.map(articleImage).find((image) => Boolean(image?.url));

  return {
    articles: {
      all: mapArticles(articles, "", undefined, true),
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
    description: category.descriptionEn?.trim() || category.descriptionTh?.trim() || undefined,
    id: category.id,
    name: category.nameEn || category.nameTh,
    slug: category.slug,
  };
}

async function getStudioContent(categoryArticleLimit?: number): Promise<{
  categories: StudiosCatalogCategory[];
  otherCategories: StudiosCatalogCategory[];
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
        sort: "showInPageSortOrder",
      }),
    ]);

    const featuredArticles = articleResult.docs
      .filter((article) => article.isFeature && (!article.featureUntil || new Date(article.featureUntil).getTime() > now))
      .map(featuredArticleToHero)
      .filter((item): item is StudiosHeroItem => Boolean(item));
    const categories = visiblePageTaxonomy(categoryResult.docs)
      .map((category) => categoryToCatalog(category, articleResult.docs, now, categoryArticleLimit));
    const otherCategories = categoryResult.docs
      .filter((category) => category.showInPage === false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id)
      .map((category) => categoryToCatalog(category, articleResult.docs, now, categoryArticleLimit));
    const pressReleases = articleResult.docs
      .filter((article) => article.isPressReleases)
      .map((article) => articleToNewsItem(article));
    const marketsAndEvents = articleResult.docs
      .filter((article) => article.isMarketsAndEvents)
      .map((article) => articleToNewsItem(article, true));

    return { categories, otherCategories, featuredArticles, marketsAndEvents, pressReleases };
  } catch (error) {
    console.warn("Unable to load Column Studios content", error);
    return { categories: [], otherCategories: [], featuredArticles: [], marketsAndEvents: [], pressReleases: [] };
  }
}

export async function getStudioCategoryCatalogBySlug(slug: string): Promise<StudiosCatalogCategory | undefined> {
  const { categories, otherCategories } = await getStudioContent();
  const slugLookupKeys = new Set(buildSlugLookupKeys(slug));
  return [...categories, ...otherCategories].find((category) => slugLookupKeys.has(category.slug));
}

export type StudiosNewsSection = "press-releases" | "markets-and-events";

export async function getStudioNewsBySection(section: StudiosNewsSection): Promise<StudiosNewsItem[]> {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "column-articles",
      depth: 2,
      overrideAccess: true,
      pagination: false,
      sort: "-publishedDate",
      where: {
        and: [
          { _status: { equals: "published" } },
          section === "press-releases"
            ? { isPressReleases: { equals: true } }
            : { isMarketsAndEvents: { equals: true } },
        ],
      },
    });
    return result.docs.map((article) => articleToNewsItem(article, section === "markets-and-events"));
  } catch (error) {
    console.warn(`Unable to load Studios ${section}`, error);
    return [];
  }
}

export type StudiosShowcaseProps = {
  showCurtain?: boolean;
};

export async function StudiosShowcase({ showCurtain = true }: StudiosShowcaseProps = {}) {
  const entranceTitle = "ThaiPBS Journal";
  const [studioContent, marketCompanies] = await Promise.all([getStudioContent(20), getMarketCompanies()]);
  const { categories, otherCategories, featuredArticles, pressReleases } = studioContent;
  const marketLogoCompanies = marketCompanies;
  const hasNews = pressReleases.length > 0 || marketLogoCompanies.length > 0;
  if (!featuredArticles.length && !categories.length && !otherCategories.length && !hasNews) return null;
  return (
    <section
      className={styles.showcase}
      aria-label={entranceTitle}
      data-studios-curtain-visible={showCurtain}
      data-studios-showcase
    >
      {showCurtain ? <BeadedCurtainEntrance title={entranceTitle} /> : null}
      <StudiosContentReveal>
        {featuredArticles.length ? (
          <div className={styles.revealSection} data-studios-reveal-section>
            <StudiosHero items={featuredArticles} />
          </div>
        ) : null}

        {categories.length ? (
          <div className={styles.revealSection} data-studios-reveal-section>
            <div className={styles.catalog} id="catalog">
              <StudiosCatalog categories={categories} showArticleSections={false} />
            </div>
          </div>
        ) : null}

        {otherCategories.length ? (
          <div className={styles.revealSection} data-studios-reveal-section>
            <section className={styles.otherCategories} aria-label="More Studios categories">
              <div className={styles.otherCategoryGrid}>
                {otherCategories.map((category) => (
                  <Link className={styles.otherCategoryCard} href={`/studios/${encodeURIComponent(category.slug)}`} key={category.id}>
                    <span className={styles.otherCategoryImage}>
                      {category.coverImageUrl ? (
                        <Image alt={category.coverAlt} fill sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 25vw" src={category.coverImageUrl} />
                      ) : null}
                    </span>
                    <span className={styles.otherCategoryCopy}>
                      <strong>{category.name}</strong>
                      {category.description ? <p>{category.description}</p> : null}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {hasNews ? (
          <div className={styles.revealSection} data-studios-reveal-section>
            <section className={styles.lightSection} id="news" aria-label="Studios news and events">
              {pressReleases.length ? (
                <>
                  <div className={styles.newsHeading}>
                    <h2>Press Releases</h2>
                    <Link className={styles.newsViewAll} href="/studios/news/press-releases">View All <span aria-hidden="true">›</span></Link>
                  </div>
                  <div className={styles.pressGrid}>
                    {pressReleases.slice(0, 10).map((item) => <StudiosPressCard item={item} key={item.id} />)}
                  </div>
                </>
              ) : null}
              {marketLogoCompanies.length ? (
                <>
                  <div className={`${styles.newsHeading} ${pressReleases.length ? styles.eventsTitle : ""}`}>
                    <h2>Markets and Events</h2>
                    <Link className={styles.newsViewAll} href="/studios/news/markets-and-events">View All <span aria-hidden="true">›</span></Link>
                  </div>
                  <div data-market-logo-grid>
                    {marketLogoCompanies.slice(0, 10).map((company) => <StudiosMarketCompanyCard company={company} key={company.slug} />)}
                  </div>
                </>
              ) : null}
            </section>
          </div>
        ) : null}
      </StudiosContentReveal>
    </section>
  );
}
