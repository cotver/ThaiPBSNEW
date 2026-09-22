import type {
  ArticlePDF,
  ColumnArticle,
  ColumnAuthor,
  ColumnCategory,
  ColumnMedia,
  ColumnSubcategory,
  ColumnTag,
  ColumnVideo,
} from "../../payload-types";
import { getPayloadClient } from "@/lib/payload-client";
import { visiblePageTaxonomy } from "@/lib/column-page-taxonomy";
import { buildSlugLookupKeys } from "@/lib/slug-lookup";

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
};

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
  limit = 4,
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
        publishedDate: true,
        createdAt: true,
      },
      where: {
        and: [
          { _status: { equals: "published" } },
          { id: { not_equals: article.id } },
        ],
      },
    });

    const categories = new Set(article.categoryIds);
    const subcategories = new Set(article.subcategoryIds);
    const tags = new Set(article.tagIds);
    const candidates = result.docs.map((candidate) => {
      const score = relationIds(candidate.categories).filter((id) => categories.has(id)).length * 8
        + relationIds(candidate.subcategories).filter((id) => subcategories.has(id)).length * 3
        + relationIds(candidate.tags).filter((id) => tags.has(id)).length;
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

export async function getColumnArticleBySlug(slug: string): Promise<ColumnArticleDetail | undefined> {
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
}
