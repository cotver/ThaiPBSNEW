import type {
  ArticlePDF,
  ColumnArticle,
  ColumnAuthor,
  ColumnCategory,
  ColumnMedia,
  ColumnSubcategory,
  ColumnTag,
  ColumnVideo,
  ColumnRelatedStory,
} from "../../payload-types";
import { cache } from "react";
import { getPayloadClient } from "@/lib/payload-client";
import { visiblePageTaxonomy } from "@/lib/column-page-taxonomy";
import { buildSlugLookupKeys } from "@/lib/slug-lookup";
import { columnArticleHref } from "@/lib/content";
import { relatedTextTerms, richTextPlainText, scoreRelatedText } from "@/lib/related-relevance";

export type ColumnArticleDetail = {
  id: number;
  author?: string;
  categoryIds: number[];
  categories: { name: string; slug: string }[];
  content: unknown;
  date: string;
  description?: string;
  heroAlt: string;
  heroUrl?: string;
  pdfFilename?: string;
  pdfUrl?: string;
  slug: string;
  subcategoryIds: number[];
  tagIds: number[];
  tags: string[];
  title: string;
  video?: { alt: string; mimeType?: string; url: string };
  relatedStories: RelatedStory[];
  searchTitle: string;
  searchBody: string;
};

export type RelatedStory = {
  id?: number;
  href: string;
  title: string;
  heroUrl?: string;
  date?: string;
};

function safeStoryUrl(value: string | null | undefined): string | undefined {
  const url = value?.trim();
  if (!url) return undefined;
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? url : undefined;
  } catch {
    return undefined;
  }
}

function mapPinnedStories(rows: ColumnArticle['relatedStories'] | ColumnRelatedStory['relatedStories']): RelatedStory[] {
  return (rows || []).flatMap<RelatedStory>((row) => {
    if (row.kind === 'article') {
      const story = typeof row.article === 'object' ? row.article as ColumnArticle : undefined;
      if (!story || story._status !== 'published' || !story.slug) return [];
      const imageValue = story.heroImages?.horizontal?.[0]?.image;
      const image = imageValue && typeof imageValue === 'object' ? imageValue as ColumnMedia : undefined;
      return [{ id: story.id, href: columnArticleHref(story.slug), title: story.titleEn || story.titleTh, heroUrl: image?.url || undefined, date: story.publishedDate || story.createdAt }];
    }
    if (row.kind === 'custom') {
      const href = safeStoryUrl(row.url);
      const image = row.image && typeof row.image === 'object' ? row.image as ColumnMedia : undefined;
      if (!href || !row.title || !image?.url) return [];
      return [{ href, title: row.title, heroUrl: image.url }];
    }
    return [];
  });
}

export async function getGlobalRelatedStories(): Promise<RelatedStory[]> {
  try {
    const payload = await getPayloadClient();
    const global = await payload.findGlobal({ slug: 'column-related-stories', depth: 3, overrideAccess: true });
    return mapPinnedStories(global.relatedStories);
  } catch (error) {
    console.warn('Unable to load global related stories', error);
    return [];
  }
}

function label(value: ColumnCategory | ColumnSubcategory | ColumnTag): string {
  return value.nameEn || value.nameTh;
}

function hasRichText(content: ColumnArticle["contentEn"]): boolean {
  return Boolean(content?.root?.children?.length);
}

function relationIds(items: (number | { id: number })[] | null | undefined): number[] {
  return (items || []).map((item) => typeof item === "number" ? item : item.id);
}

function mapArticle(article: ColumnArticle): ColumnArticleDetail {
  const title = article.titleEn || article.titleTh;
  const heroValue = article.heroImages.horizontal[0]?.image;
  const hero = typeof heroValue === "object" ? heroValue as ColumnMedia : undefined;
  const pdf = article.articlePDF && typeof article.articlePDF === "object"
    ? article.articlePDF as ArticlePDF
    : undefined;
  const author = typeof article.author === "object" ? article.author as ColumnAuthor : undefined;
  const video = article.videos?.find((item): item is ColumnVideo => typeof item === "object" && Boolean(item.url));
  const categories = visiblePageTaxonomy(article.categories)
    .map((item) => ({ name: label(item), slug: item.slug }));
  const tags = [...visiblePageTaxonomy(article.subcategories), ...(article.tags || [])]
    .filter((item): item is ColumnSubcategory | ColumnTag => typeof item === "object")
    .map(label);

  return {
    id: article.id,
    author: author ? author.nameEn || author.nameTh : undefined,
    categoryIds: relationIds(article.categories),
    categories,
    content: hasRichText(article.contentEn) ? article.contentEn : article.contentTh,
    date: article.publishedDate || article.createdAt,
    description: article.descriptionEn || article.excerptEn || article.descriptionTh || article.excerptTh || undefined,
    heroAlt: hero?.alt || title,
    heroUrl: hero?.url || undefined,
    pdfFilename: pdf?.filename || undefined,
    pdfUrl: pdf?.url || undefined,
    slug: article.slug,
    subcategoryIds: relationIds(article.subcategories),
    tagIds: relationIds(article.tags),
    tags: [...new Set(tags)],
    title,
    video: video?.url ? { alt: video.alt || title, mimeType: video.mimeType || undefined, url: video.url } : undefined,
    relatedStories: mapPinnedStories(article.relatedStories),
    searchTitle: [article.titleEn, article.titleTh].filter(Boolean).join(' '),
    searchBody: [article.descriptionEn, article.descriptionTh, article.excerptEn, article.excerptTh,
      richTextPlainText(article.contentEn), richTextPlainText(article.contentTh)].filter(Boolean).join(' '),
  };
}

export type RelatedColumnArticle = {
  date: string;
  heroUrl?: string;
  id: number;
  slug: string;
  title: string;
};

export async function getRelatedColumnArticles(
  article: ColumnArticleDetail,
  limit = 10,
  excludeIds: number[] = [],
): Promise<{ items: RelatedColumnArticle[]; hasMatches: boolean }> {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "column-articles",
      depth: 1,
      overrideAccess: true,
      pagination: false,
      sort: "-publishedDate",
      select: {
        titleTh: true,
        titleEn: true,
        slug: true,
        heroImages: true,
        categories: true,
        subcategories: true,
        tags: true,
        descriptionTh: true,
        descriptionEn: true,
        excerptTh: true,
        excerptEn: true,
        contentTh: true,
        contentEn: true,
        publishedDate: true,
        createdAt: true,
      },
      where: {
        and: [
          { _status: { equals: "published" } },
          { id: { not_in: [article.id, ...excludeIds] } },
        ],
      },
    });

    const categories = new Set(article.categoryIds);
    const subcategories = new Set(article.subcategoryIds);
    const tags = new Set(article.tagIds);
    const sourceText = relatedTextTerms(article.searchTitle, article.searchBody);
    const textById = new Map(result.docs.map((candidate) => [candidate.id, relatedTextTerms(
      [candidate.titleEn, candidate.titleTh].filter(Boolean).join(' '),
      [candidate.descriptionEn, candidate.descriptionTh, candidate.excerptEn, candidate.excerptTh,
        richTextPlainText(candidate.contentEn), richTextPlainText(candidate.contentTh)].filter(Boolean).join(' '),
    )]));
    const documentFrequency = new Map<string, number>();
    for (const text of textById.values()) {
      for (const word of new Set([...text.title, ...text.body])) {
        documentFrequency.set(word, (documentFrequency.get(word) || 0) + 1);
      }
    }
    const candidates = result.docs.map((candidate) => {
      const score = relationIds(candidate.categories).filter((id) => categories.has(id)).length * 8
        + relationIds(candidate.subcategories).filter((id) => subcategories.has(id)).length * 3
        + relationIds(candidate.tags).filter((id) => tags.has(id)).length
        + scoreRelatedText(sourceText, textById.get(candidate.id)!, documentFrequency, result.docs.length);
      return { candidate, score };
    });
    const matches = candidates.filter(({ score }) => score > 0);
    const selected = (matches.length ? matches : candidates)
      .sort((a, b) => b.score - a.score ||
        new Date(b.candidate.publishedDate || b.candidate.createdAt).getTime()
        - new Date(a.candidate.publishedDate || a.candidate.createdAt).getTime())
      .slice(0, limit);

    return {
      hasMatches: matches.length > 0,
      items: selected.map(({ candidate }) => {
        const title = candidate.titleEn || candidate.titleTh;
        const imageValue = candidate.heroImages?.horizontal?.[0]?.image;
        const image = imageValue && typeof imageValue === "object" ? imageValue : undefined;
        return {
          date: candidate.publishedDate || candidate.createdAt,
          heroUrl: image?.url || undefined,
          id: candidate.id,
          slug: candidate.slug,
          title,
        };
      }),
    };
  } catch (error) {
    console.warn(`Unable to load related Column Articles for "${article.slug}"`, error);
    return { items: [], hasMatches: false };
  }
}

export const getColumnArticleBySlug = cache(async (slug: string): Promise<ColumnArticleDetail | undefined> => {
  try {
    const slugLookupKeys = buildSlugLookupKeys(slug);
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "column-articles",
      depth: 3,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        and: [
          {
            or: slugLookupKeys.map((key) => ({ slug: { equals: key } })),
          },
          { _status: { equals: "published" } },
        ],
      },
    });

    return result.docs[0] ? mapArticle(result.docs[0]) : undefined;
  } catch (error) {
    console.warn(`Unable to load Column Article: ${slug}`, error);
    return undefined;
  }
});
