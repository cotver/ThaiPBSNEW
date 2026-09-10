import type {
  ColumnArticle,
  ColumnAuthor,
  ColumnCategory,
  ColumnMedia,
  ColumnSubcategory,
  ColumnTag,
  ColumnVideo,
} from "../../payload-types";
import { getPayloadClient } from "@/lib/payload-client";

export type ColumnArticleDetail = {
  author?: string;
  categories: { name: string; slug: string }[];
  content: unknown;
  date: string;
  description?: string;
  heroAlt: string;
  heroUrl?: string;
  slug: string;
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

function mapArticle(article: ColumnArticle): ColumnArticleDetail {
  const title = article.titleEn || article.titleTh;
  const heroValue = article.heroImages.horizontal[0]?.image;
  const hero = typeof heroValue === "object" ? heroValue as ColumnMedia : undefined;
  const author = typeof article.author === "object" ? article.author as ColumnAuthor : undefined;
  const video = article.videos?.find((item): item is ColumnVideo => typeof item === "object" && Boolean(item.url));
  const categories = (article.categories || [])
    .filter((item): item is ColumnCategory => typeof item === "object")
    .map((item) => ({ name: label(item), slug: item.slug }));
  const tags = [...(article.subcategories || []), ...(article.tags || [])]
    .filter((item): item is ColumnSubcategory | ColumnTag => typeof item === "object")
    .map(label);

  return {
    author: author ? author.nameEn || author.nameTh : undefined,
    categories,
    content: hasRichText(article.contentEn) ? article.contentEn : article.contentTh,
    date: article.publishedDate || article.createdAt,
    description: article.descriptionEn || article.excerptEn || article.descriptionTh || article.excerptTh || undefined,
    heroAlt: hero?.alt || title,
    heroUrl: hero?.url || undefined,
    slug: article.slug,
    tags: [...new Set(tags)],
    title,
    video: video?.url ? { alt: video.alt || title, mimeType: video.mimeType || undefined, url: video.url } : undefined,
  };
}

export async function getColumnArticleBySlug(slug: string): Promise<ColumnArticleDetail | undefined> {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "column-articles",
      depth: 3,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        and: [
          { slug: { equals: slug } },
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
