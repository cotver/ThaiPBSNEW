import { cache } from "react";
import type { Article, Category, Episode, Media, Program, Season } from "../../payload-types";
import { titleHref, type Title } from "@/lib/content";
import type { TitleCollections, TypeProgramRow, YearProgramRow } from "@/lib/payload-content";
import { getPayloadClient } from "@/lib/payload-client";

export type FinalArticleCard = {
  author?: string;
  categoryNames: string[];
  excerpt: string;
  featuredUntil?: string;
  imageAlt: string;
  imageUrl?: string;
  isFeatured: boolean;
  programHref?: string;
  programTitle: string;
  publishedDate: string;
  slug: string;
  tags: string[];
  targetLabel: string;
  title: string;
};

export type FinalArticleDetail = FinalArticleCard & {
  content: Article["contentTh"];
  description: string;
  id: number;
  seoDescription: string;
  seoTitle: string;
  socialImageUrl?: string;
};

export async function getFinalArticles(): Promise<FinalArticleCard[]> {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "articles",
      depth: 3,
      overrideAccess: true,
      pagination: false,
      sort: "-publishedDate",
      where: { status: { equals: "published" } },
    });

    return result.docs.map(articleToCard);
  } catch (error) {
    console.warn("Unable to load published Payload articles", error);
    return [];
  }
}

export function buildFinalArticleCollections(articles: FinalArticleCard[]): TitleCollections {
  const titles = articles.map(articleToTitle);
  const featuredArticleSlugs = new Set(
    articles.filter((article) => isActiveFeaturedArticle(article)).map((article) => article.slug),
  );

  return {
    continuePrograms: titles,
    continueWatching: titles,
    discontinuedPrograms: titles.map((title) => ({ ...title, isDiscontinued: true })),
    heroes: titles.filter((title) => featuredArticleSlugs.has(title.slug)),
    internationalPrograms: titles,
    posterMockups: titles,
    recommended: titles.slice(0, 8),
    thaiPrograms: titles,
    typeRows: articleCategoryRows(articles, titles),
    watchlist: [],
    yearRows: articleYearRows(articles, titles),
  };
}

export const getFinalArticle = cache(async (slug: string): Promise<FinalArticleDetail | undefined> => {
  try {
    const payload = await getPayloadClient();
    const normalizedSlug = normalizeSlug(slug);
    const result = await payload.find({
      collection: "articles",
      depth: 3,
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          { status: { equals: "published" } },
          {
            or: [
              { slug: { equals: slug } },
              { slug: { equals: normalizedSlug } },
            ],
          },
        ],
      },
    });
    const article = result.docs[0];

    if (!article) return undefined;

    const card = articleToCard(article);
    return {
      ...card,
      content: article.contentTh,
      description: cleanText(article.descriptionTh) || cleanText(article.descriptionEn) || card.excerpt,
      id: article.id,
      seoDescription:
        cleanText(article.seoDescriptionTh) ||
        cleanText(article.seoDescriptionEn) ||
        cleanText(article.excerptTh) ||
        cleanText(article.excerptEn),
      seoTitle: cleanText(article.seoTitleTh) || cleanText(article.seoTitleEn) || card.title,
      socialImageUrl: mediaUrl(article.socialSharingImage),
    };
  } catch (error) {
    console.warn(`Unable to load Payload article "${slug}"`, error);
    return undefined;
  }
});

export async function getRelatedFinalArticles(article: FinalArticleDetail, limit = 3): Promise<FinalArticleCard[]> {
  try {
    const payload = await getPayloadClient();
    const current = await payload.findByID({
      collection: "articles",
      id: article.id,
      depth: 0,
      overrideAccess: true,
    });
    const programId = relationId(current.program);

    if (!programId) return [];

    const result = await payload.find({
      collection: "articles",
      depth: 3,
      limit,
      overrideAccess: true,
      sort: "-publishedDate",
      where: {
        and: [
          { status: { equals: "published" } },
          { id: { not_equals: article.id } },
          { program: { equals: programId } },
        ],
      },
    });

    return result.docs.map(articleToCard);
  } catch (error) {
    console.warn(`Unable to load related articles for "${article.slug}"`, error);
    return [];
  }
}

function articleToCard(article: Article): FinalArticleCard {
  const program = populatedProgram(article.program);
  const title = cleanText(article.titleTh) || cleanText(article.titleEn) || "Thai PBS Article";
  const excerpt =
    cleanText(article.excerptTh) ||
    cleanText(article.excerptEn) ||
    cleanText(article.descriptionTh) ||
    cleanText(article.descriptionEn);
  const image = primaryArticleImage(article);

  return {
    author: cleanText(article.author) || undefined,
    categoryNames: relationshipNames(article.categories),
    excerpt,
    featuredUntil: article.featuredUntil || undefined,
    imageAlt: cleanText(image?.alt) || title,
    imageUrl: mediaUrl(image) || programImageUrl(program),
    isFeatured: Boolean(article.isFeatured),
    programHref: program?.slug ? titleHref(program.slug) : undefined,
    programTitle: programTitle(program),
    publishedDate: article.publishedDate || article.createdAt,
    slug: article.slug,
    tags: Array.isArray(article.tags) ? article.tags.map(cleanText).filter(Boolean) : [],
    targetLabel: articleTargetLabel(article),
    title,
  };
}

export function isActiveFeaturedArticle(article: FinalArticleCard, now = Date.now()): boolean {
  if (!article.isFeatured) return false;
  if (!article.featuredUntil) return true;

  const featuredUntil = new Date(article.featuredUntil).getTime();
  return Number.isFinite(featuredUntil) && featuredUntil >= now;
}

function articleToTitle(article: FinalArticleCard): Title {
  const published = new Date(article.publishedDate);
  const year = Number.isNaN(published.getTime()) ? "" : String(published.getFullYear());

  return {
    categoryNames: article.categoryNames,
    description: article.excerpt,
    duration: "",
    eyebrow: `${article.programTitle} · ${article.targetLabel}`,
    featured: isActiveFeaturedArticle(article),
    genre: article.categoryNames[0] || article.targetLabel,
    heroImage: article.imageUrl,
    homeYear: year ? Number(year) : undefined,
    isContinue: false,
    isDiscontinued: false,
    isGlobalProgram: false,
    isNew: true,
    posterImage: article.imageUrl,
    rating: "",
    showHeroActions: true,
    showHeroDetails: true,
    slug: article.slug,
    title: article.title,
    tone: "from-slate-950 via-cyan-900 to-orange-500",
    type: "Original",
    year,
  };
}

function articleCategoryRows(articles: FinalArticleCard[], titles: Title[]): TypeProgramRow[] {
  const groups = new Map<string, { name: string; titles: Title[] }>();

  articles.forEach((article, index) => {
    const names = article.categoryNames.length ? article.categoryNames : [article.targetLabel];
    names.forEach((name) => {
      const slug = slugify(name) || `article-group-${index + 1}`;
      const group = groups.get(slug) || { name, titles: [] };
      if (!group.titles.some((title) => title.slug === titles[index].slug)) group.titles.push(titles[index]);
      groups.set(slug, group);
    });
  });

  return [...groups.entries()].map(([slug, group], index) => ({
    titles: group.titles,
    type: {
      id: -(index + 1),
      name: group.name,
      showTitle: true,
      slug,
    },
  }));
}

function articleYearRows(articles: FinalArticleCard[], titles: Title[]): YearProgramRow[] {
  const groups = new Map<number, Title[]>();

  articles.forEach((article, index) => {
    const date = new Date(article.publishedDate);
    if (Number.isNaN(date.getTime())) return;
    const year = date.getFullYear();
    groups.set(year, [...(groups.get(year) || []), titles[index]]);
  });

  return [...groups.entries()]
    .sort(([left], [right]) => right - left)
    .map(([year, groupedTitles]) => ({ titles: groupedTitles, year }));
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function articleTargetLabel(article: Article): string {
  if (article.targetType === "episode") {
    const episode = populatedEpisode(article.episode);
    const label = cleanText(episode?.epNameTh) || cleanText(episode?.epNameEn);
    return label || (episode?.ep != null ? `Episode ${episode.ep}` : "Episode article");
  }

  if (article.targetType === "season") {
    const season = populatedSeason(article.season);
    const label = cleanText(season?.seasonName) || cleanText(season?.seasonNameEn);
    return label || (season?.season != null ? `Season ${season.season}` : "Season article");
  }

  return "Program article";
}

function primaryArticleImage(article: Article): Media | undefined {
  const horizontal = article.heroImages?.horizontal?.[0]?.image;
  const vertical = article.heroImages?.vertical?.[0]?.image;
  return populatedMedia(horizontal) || populatedMedia(vertical);
}

function programImageUrl(program?: Program): string | undefined {
  if (!program) return undefined;
  return mediaUrl(program.image) || mediaUrl(program.coverImage);
}

function programTitle(program?: Program): string {
  if (!program) return "Thai PBS";
  return cleanText(program.titleTh) || cleanText(program.titleEn) || cleanText(program._displayTitle) || "Thai PBS";
}

function populatedProgram(value: Article["program"]): Program | undefined {
  return value && typeof value === "object" ? value : undefined;
}

function populatedSeason(value: Article["season"]): Season | undefined {
  return value && typeof value === "object" ? value : undefined;
}

function populatedEpisode(value: Article["episode"]): Episode | undefined {
  return value && typeof value === "object" ? value : undefined;
}

function populatedMedia(value: number | Media | null | undefined): Media | undefined {
  return value && typeof value === "object" ? value : undefined;
}

function mediaUrl(value: number | Media | null | undefined): string | undefined {
  return populatedMedia(value)?.url || undefined;
}

function relationshipNames(value: Article["categories"]): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const category = item as Category;
      return cleanText(category.name) || cleanText(category.slug);
    })
    .filter(Boolean);
}

function relationId(value: number | { id: number } | null | undefined): number | undefined {
  if (typeof value === "number") return value;
  return value?.id;
}

function normalizeSlug(value: string): string {
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
