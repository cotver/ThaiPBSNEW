import type { Title } from "@/lib/content";

export type PrototypeStyle = "style-1" | "style-2" | "style-3" | "style-4" | "style-5" | "style-8" | "style-9" | "style-10" | "style-11";

export type PrototypeCategory = {
  label: string;
  slug: string;
};

export type EditorialSection = {
  id: string;
  title: string;
  titles: Title[];
};

export const styleDetails: Record<PrototypeStyle, { label: string; name: string; note: string }> = {
  "style-1": {
    label: "Style 1",
    name: "Field Notes",
    note: "Warm, cinematic and human",
  },
  "style-2": {
    label: "Style 2",
    name: "Signal",
    note: "Bold, optimistic and digital",
  },
  "style-3": {
    label: "Style 3",
    name: "Daily Grid",
    note: "Crisp, graphic and news-led",
  },
  "style-4": {
    label: "Style 4",
    name: "Afterimage",
    note: "Immersive, kinetic and cinematic",
  },
  "style-5": {
    label: "Style 5",
    name: "Edition",
    note: "Editorial, image-led and fashion-forward",
  },
  "style-8": {
    label: "Style 8",
    name: "Patchwork",
    note: "Friendly, playful and lifestyle-editorial",
  },
  "style-9": {
    label: "Style 9",
    name: "Trail Journal",
    note: "Spacious, personal and image-led",
  },
  "style-10": {
    label: "Style 10",
    name: "Playroom",
    note: "Video-first, relaxed and creator-led",
  },
  "style-11": {
    label: "Style 11",
    name: "Margin Notes",
    note: "Calm, human and thoughtfully editorial",
  },
};

export function parsePrototypeStyle(value: string): PrototypeStyle | undefined {
  return value === "style-1" || value === "style-2" || value === "style-3" || value === "style-4" || value === "style-5" || value === "style-8" || value === "style-9" || value === "style-10" || value === "style-11" ? value : undefined;
}

export function categorySlug(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("th")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "stories";
}

export function titleCategories(title: Title): PrototypeCategory[] {
  const names = title.categoryNames?.filter(Boolean) ?? [];
  if (names.length) {
    return names.map((label, index) => ({
      label,
      slug: title.categorySlugs?.[index] || categorySlug(label),
    }));
  }

  return [{ label: title.genre || "Stories", slug: categorySlug(title.genre || "Stories") }];
}

export function getPrototypeCategories(titles: Title[]) {
  const categories = new Map<string, PrototypeCategory>();
  for (const title of titles) {
    for (const category of titleCategories(title)) categories.set(category.slug, category);
  }
  return [...categories.values()].slice(0, 8);
}

export function titleMatchesCategory(title: Title, slug: string) {
  return titleCategories(title).some((category) => category.slug === slug);
}

export function getEditorialSections(titles: Title[]): EditorialSection[] {
  const available = titles.filter((title) => !title.isDiscontinued);
  const featured = available.filter((title) => title.featured);
  const fresh = available.filter((title) => title.isNew);
  const sections: EditorialSection[] = [];

  if (featured.length) {
    sections.push({
      id: "featured",
      title: "Featured",
      titles: uniqueTitles([...featured, ...available]).slice(0, 5),
    });
  }

  if (fresh.length) {
    sections.push({ id: "new", title: "New & Recommended", titles: fresh.slice(0, 8) });
  }

  sections.push({ id: "latest", title: "Latest Stories", titles: available.slice(0, 12) });

  const byCategory = new Map<string, { label: string; titles: Title[] }>();
  for (const title of available) {
    for (const category of titleCategories(title)) {
      const current = byCategory.get(category.slug) ?? { label: category.label, titles: [] };
      current.titles.push(title);
      byCategory.set(category.slug, current);
    }
  }

  for (const [slug, group] of [...byCategory.entries()].filter(([, group]) => group.titles.length >= 2).slice(0, 4)) {
    sections.push({ id: `category-${slug}`, title: group.label, titles: uniqueTitles(group.titles).slice(0, 8) });
  }

  const international = available.filter((title) => title.isGlobalProgram);
  if (international.length >= 2) sections.push({ id: "international", title: "International", titles: international.slice(0, 8) });

  return sections.filter((section) => section.titles.length);
}

function uniqueTitles(titles: Title[]) {
  return [...new Map(titles.map((title) => [title.slug, title])).values()];
}

export const fallbackTitles: Title[] = [
  {
    slug: "river-people",
    title: "ชีวิตริมสายน้ำ",
    type: "Original",
    genre: "Documentary",
    year: "2026",
    rating: "G",
    duration: "8 min read",
    description: "Meet the communities adapting, creating and caring for Thailand's waterways.",
    categoryNames: ["People & Planet"],
    categorySlugs: ["people-planet"],
    featured: true,
    isNew: true,
    tone: "from-amber-800 via-orange-500 to-sky-300",
  },
  {
    slug: "new-thai-table",
    title: "The New Thai Table",
    type: "Series",
    genre: "Food",
    year: "2026",
    rating: "G",
    duration: "6 min read",
    description: "Young cooks bring regional memory and new ideas to the same table.",
    categoryNames: ["Food & Culture"],
    categorySlugs: ["food-culture"],
    isNew: true,
    tone: "from-lime-700 via-emerald-500 to-yellow-200",
  },
  {
    slug: "city-after-rain",
    title: "เมืองหลังฝน",
    type: "Original",
    genre: "Environment",
    year: "2026",
    rating: "G",
    duration: "7 min read",
    description: "A visual report on how Bangkok neighborhoods are preparing for a wetter future.",
    categoryNames: ["Climate"],
    categorySlugs: ["climate"],
    tone: "from-blue-950 via-cyan-600 to-lime-200",
  },
  {
    slug: "small-school-big-future",
    title: "Small School, Big Future",
    type: "Original",
    genre: "Education",
    year: "2026",
    rating: "G",
    duration: "5 min read",
    description: "Teachers and students reinvent learning in a school far from the city.",
    categoryNames: ["Learning"],
    categorySlugs: ["learning"],
    tone: "from-violet-900 via-fuchsia-600 to-orange-200",
  },
  {
    slug: "weekend-chiang-rai",
    title: "48 Hours in Chiang Rai",
    type: "Series",
    genre: "Travel",
    year: "2026",
    rating: "G",
    duration: "9 min read",
    description: "Artists, coffee growers and quiet roads shape a slower northern weekend.",
    categoryNames: ["Travel"],
    categorySlugs: ["travel"],
    tone: "from-rose-800 via-orange-500 to-amber-100",
  },
  {
    slug: "voices-next-door",
    title: "Voices Next Door",
    type: "Original",
    genre: "Society",
    year: "2026",
    rating: "G",
    duration: "10 min read",
    description: "Six everyday conversations reveal a changing city and the people holding it together.",
    categoryNames: ["Society"],
    categorySlugs: ["society"],
    tone: "from-slate-950 via-red-700 to-pink-200",
  },
];

export function withPrototypeFallback(titles: Title[]) {
  const available = titles.filter((title) => !title.isDiscontinued);
  return available.length ? available : fallbackTitles;
}
