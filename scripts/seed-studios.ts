import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ColumnArticle } from "../payload-types";
import config from "@payload-config";
import { getPayload, type Payload } from "payload";

/**
 * Run after the Column migrations have been applied:
 * npm run seed:studios
 */

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const studiosAssetDirectory = path.join(projectDirectory, "public", "studios");

type SeedCategory = {
  image: string;
  nameEn: string;
  nameTh: string;
  slug: string;
};

type SeedArticle = {
  category: string;
  comingSoon?: boolean;
  descriptionEn: string;
  descriptionTh: string;
  image: string;
  isFeature?: boolean;
  isMarketsAndEvents?: boolean;
  isNewEpisodes?: boolean;
  isPressReleases?: boolean;
  publishedDaysAgo: number;
  slug: string;
  titleEn: string;
  titleTh: string;
};

const categories: SeedCategory[] = [
  { image: "bangkok-after-dark.png", nameEn: "Drama", nameTh: "ละคร", slug: "drama" },
  { image: "sound-of-us.png", nameEn: "Junior", nameTh: "เยาวชน", slug: "junior" },
  { image: "river-of-life.png", nameEn: "Unscripted", nameTh: "สารคดีและรายการ", slug: "unscripted" },
];

const articles: SeedArticle[] = [
  {
    category: "drama",
    descriptionEn: "A reporter follows a trail of missing evidence into the city that raised her.",
    descriptionTh: "นักข่าวสาวติดตามร่องรอยหลักฐานที่หายไปสู่ใจกลางเมืองที่หล่อหลอมชีวิตของเธอ",
    image: "bangkok-after-dark.png",
    isFeature: true,
    isPressReleases: true,
    publishedDaysAgo: 1,
    slug: "bangkok-after-dark",
    titleEn: "Bangkok After Dark",
    titleTh: "กรุงเทพฯ หลังแสงดับ",
  },
  {
    category: "drama",
    descriptionEn: "The acclaimed city mystery returns with a new investigation.",
    descriptionTh: "เรื่องลึกลับกลางเมืองกลับมาพร้อมการสืบสวนครั้งใหม่",
    image: "bangkok-after-dark.png",
    isNewEpisodes: true,
    publishedDaysAgo: 3,
    slug: "bangkok-after-dark-new-investigation",
    titleEn: "Bangkok After Dark: New Investigation",
    titleTh: "กรุงเทพฯ หลังแสงดับ ตอนใหม่",
  },
  {
    category: "drama",
    comingSoon: true,
    descriptionEn: "A family secret crosses three generations and one unforgettable summer.",
    descriptionTh: "ความลับของครอบครัวที่เชื่อมโยงสามรุ่นผ่านฤดูร้อนที่ไม่มีวันลืม",
    image: "forest-rescue.png",
    isFeature: true,
    publishedDaysAgo: 5,
    slug: "the-long-summer",
    titleEn: "The Long Summer",
    titleTh: "ฤดูร้อนอันยาวนาน",
  },
  {
    category: "junior",
    descriptionEn: "Four friends find their own rhythm after school.",
    descriptionTh: "เพื่อนสี่คนออกตามหาจังหวะของตัวเองหลังเลิกเรียน",
    image: "sound-of-us.png",
    isFeature: true,
    publishedDaysAgo: 2,
    slug: "the-sound-club",
    titleEn: "The Sound Club",
    titleTh: "ชมรมเสียงสนุก",
  },
  {
    category: "junior",
    descriptionEn: "The club welcomes a new musician and a surprising challenge.",
    descriptionTh: "ชมรมต้อนรับนักดนตรีคนใหม่พร้อมความท้าทายที่คาดไม่ถึง",
    image: "sound-of-us.png",
    isNewEpisodes: true,
    publishedDaysAgo: 4,
    slug: "the-sound-club-new-stage",
    titleEn: "The Sound Club: New Stage",
    titleTh: "ชมรมเสียงสนุก เวทีใหม่",
  },
  {
    category: "junior",
    comingSoon: true,
    descriptionEn: "Young explorers protect the river they call home.",
    descriptionTh: "นักสำรวจรุ่นเยาว์ร่วมกันปกป้องสายน้ำที่พวกเขาเรียกว่าบ้าน",
    image: "river-of-life.png",
    publishedDaysAgo: 6,
    slug: "river-rangers",
    titleEn: "River Rangers",
    titleTh: "ผู้พิทักษ์สายน้ำ",
  },
  {
    category: "unscripted",
    descriptionEn: "A cinematic journey along the waterways connecting people, food, and memory.",
    descriptionTh: "การเดินทางผ่านสายน้ำที่เชื่อมโยงผู้คน อาหาร และความทรงจำ",
    image: "river-of-life.png",
    isFeature: true,
    isMarketsAndEvents: true,
    publishedDaysAgo: 1,
    slug: "river-of-life",
    titleEn: "River of Life",
    titleTh: "สายน้ำแห่งชีวิต",
  },
  {
    category: "unscripted",
    descriptionEn: "Wildlife teams continue their race against the monsoon.",
    descriptionTh: "ทีมอนุรักษ์สัตว์ป่ายังคงแข่งกับเวลาและฤดูมรสุม",
    image: "forest-rescue.png",
    isNewEpisodes: true,
    publishedDaysAgo: 3,
    slug: "night-passage-new-episodes",
    titleEn: "Night Passage: New Episodes",
    titleTh: "ทางผ่านยามค่ำ ตอนใหม่",
  },
  {
    category: "unscripted",
    comingSoon: true,
    descriptionEn: "A new factual series follows the sounds and makers reshaping Thai music.",
    descriptionTh: "สารคดีชุดใหม่ติดตามเสียงและผู้สร้างที่กำลังเปลี่ยนโฉมดนตรีไทย",
    image: "sound-of-us.png",
    isMarketsAndEvents: true,
    isPressReleases: true,
    publishedDaysAgo: 7,
    slug: "new-folk",
    titleEn: "New Folk",
    titleTh: "เสียงพื้นบ้านใหม่",
  },
];

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number): string {
  return daysFromNow(-days);
}

function richText(
  text: string,
  extras?: { gallery: number[]; includeShowcaseBlocks: boolean },
): ColumnArticle["contentTh"] {
  const showcaseNodes = extras?.includeShowcaseBlocks
    ? [
        {
          fields: {
            blockName: "Studios image gallery",
            blockType: "columnArticleImageGroup",
            caption: "A selection of images from the Thai PBS Studios catalogue.",
            displayWidth: "large",
            imageFit: "cover",
            images: extras.gallery.slice(0, 3).map((image, index) => ({ image, alt: `Studios gallery image ${index + 1}` })),
            layout: "three",
          },
          format: "center",
          type: "block",
          version: 2,
        },
        {
          fields: {
            blockName: "Studios video",
            blockType: "columnArticleEmbed",
            caption: "Embedded social video example.",
            platform: "youtube",
            title: "Thai PBS Studios video",
            type: "social",
            url: "https://www.youtube.com/watch?v=M7lc1UVf-VE",
          },
          format: "center",
          type: "block",
          version: 2,
        },
      ]
    : [];

  return {
    root: {
      children: [
        {
          children: [{ detail: 0, format: 0, mode: "normal", style: "", text, type: "text", version: 1 }],
          direction: null,
          format: "",
          indent: 0,
          textFormat: 0,
          textStyle: "",
          type: "paragraph",
          version: 1,
        },
        ...showcaseNodes,
      ],
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

async function upsertMedia(payload: Payload, filename: string, alt: string): Promise<number> {
  const existing = await payload.find({
    collection: "column-media",
    limit: 1,
    overrideAccess: true,
    where: { filename: { equals: filename } },
  });
  const existingDocument = existing.docs[0];
  if (existingDocument) return existingDocument.id;

  const document = await payload.create({
    collection: "column-media",
    data: { alt, caption: "Studios demo content" },
    filePath: path.join(studiosAssetDirectory, filename),
    overrideAccess: true,
  });

  return document.id;
}

async function upsertCategory(
  payload: Payload,
  category: SeedCategory,
  coverImage: number,
  sortOrder: number,
): Promise<number> {
  const existing = await payload.find({
    collection: "column-categories",
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: category.slug } },
  });
  const data = {
    coverImage,
    nameEn: category.nameEn,
    nameTh: category.nameTh,
    pageStyle: "full-image-cta" as const,
    showInNavigation: true,
    slug: category.slug,
    sortOrder,
  };
  const existingDocument = existing.docs[0];

  if (existingDocument) {
    const updated = await payload.update({ collection: "column-categories", data, id: existingDocument.id, overrideAccess: true });
    return updated.id;
  }

  const created = await payload.create({ collection: "column-categories", data, overrideAccess: true });
  return created.id;
}

async function upsertAuthor(payload: Payload, avatar: number): Promise<number> {
  const slug = "thai-pbs-studios-team";
  const existing = await payload.find({
    collection: "column-authors",
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: slug } },
  });
  const data = {
    avatar,
    bioEn: "The editorial team behind Thai PBS Studios demo content.",
    bioTh: "ทีมบรรณาธิการผู้สร้างเนื้อหาตัวอย่างสำหรับ Thai PBS Studios",
    nameEn: "Thai PBS Studios Team",
    nameTh: "ทีม Thai PBS Studios",
    slug,
  };
  const existingDocument = existing.docs[0];

  if (existingDocument) {
    const updated = await payload.update({ collection: "column-authors", data, id: existingDocument.id, overrideAccess: true });
    return updated.id;
  }

  const created = await payload.create({ collection: "column-authors", data, overrideAccess: true });
  return created.id;
}

async function upsertArticle(
  payload: Payload,
  article: SeedArticle,
  author: number,
  category: number,
  image: number,
  gallery: number[],
): Promise<void> {
  const existing = await payload.find({
    collection: "column-articles",
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: article.slug } },
  });
  const data = {
    _status: "published" as const,
    author,
    categories: [category],
    comingSoon: article.comingSoon || false,
    comingSoonDate: article.comingSoon ? daysFromNow(45) : null,
    contentEn: richText(article.descriptionEn, { gallery, includeShowcaseBlocks: article.slug === "bangkok-after-dark" }),
    contentTh: richText(article.descriptionTh),
    descriptionEn: article.descriptionEn,
    descriptionTh: article.descriptionTh,
    excerptEn: article.descriptionEn,
    excerptTh: article.descriptionTh,
    featureUntil: article.isFeature ? daysFromNow(90) : null,
    heroImages: {
      horizontal: [{ image }],
      vertical: [{ image }],
    },
    isFeature: article.isFeature || false,
    isMarketsAndEvents: article.isMarketsAndEvents || false,
    isNewEpisodes: article.isNewEpisodes || false,
    isPressReleases: article.isPressReleases || false,
    newEpisodesUntil: article.isNewEpisodes ? daysFromNow(30) : null,
    publishedDate: daysAgo(article.publishedDaysAgo),
    slug: article.slug,
    titleEn: article.titleEn,
    titleTh: article.titleTh,
  };
  const existingDocument = existing.docs[0];

  if (existingDocument) {
    await payload.update({ collection: "column-articles", data, draft: false, id: existingDocument.id, overrideAccess: true });
    return;
  }

  const created = await payload.create({ collection: "column-articles", data, draft: false, overrideAccess: true });
  await payload.update({
    collection: "column-articles",
    data: { publishedDate: data.publishedDate },
    draft: false,
    id: created.id,
    overrideAccess: true,
  });
}

async function seedStudios(): Promise<void> {
  const payload = await getPayload({ config });

  try {
    const mediaIds = new Map<string, number>();
    for (const category of categories) {
      mediaIds.set(category.image, await upsertMedia(payload, category.image, `${category.nameEn} demo artwork`));
    }
    mediaIds.set("forest-rescue.png", await upsertMedia(payload, "forest-rescue.png", "Forest rescue demo artwork"));

    const categoryIds = new Map<string, number>();
    for (const [index, category] of categories.entries()) {
      const coverImage = mediaIds.get(category.image);
      if (!coverImage) throw new Error(`Missing seeded media for ${category.image}`);
      categoryIds.set(category.slug, await upsertCategory(payload, category, coverImage, index + 1));
    }

    const avatar = mediaIds.get("sound-of-us.png");
    if (!avatar) throw new Error("Missing seeded author avatar");
    const author = await upsertAuthor(payload, avatar);

    for (const article of articles) {
      const category = categoryIds.get(article.category);
      const image = mediaIds.get(article.image);
      if (!category || !image) throw new Error(`Missing seeded relation for ${article.slug}`);
      await upsertArticle(payload, article, author, category, image, [...mediaIds.values()]);
    }

    payload.logger.info(`Studios seed complete: ${categories.length} categories and ${articles.length} articles.`);
  } finally {
    await payload.destroy();
  }
}

await seedStudios();
