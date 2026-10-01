import type { Title } from "@/lib/content";
import type { FinalArticleCard } from "@/lib/payload-articles";

export const lotBase = "/prototype/studio-lot";

/** Gallery rooms mirror the /home sections, so ids are data-driven (e.g. "featured", "type-documentary"). */
export type LotSectionId = string;

export type LotProgram = {
  slug: string;
  title: string;
  type: Title["type"];
  genre: string;
  year: string;
  duration: string;
  rating: string;
  description: string;
  poster?: string;
  hero?: string;
  trailerUrl?: string;
  trailerMimeType?: string;
  categories: string[];
  typeSlugs: string[];
  isNew: boolean;
  seasons: number;
  episodes: number;
};

export type LotArticle = {
  slug: string;
  title: string;
  excerpt: string;
  image?: string;
  date: string;
  categories: string[];
  programTitle: string;
  author?: string;
};

export type LotShelf = { slug: string; name: string; programs: LotProgram[] };

export type LotCategory = { slug: string; name: string; image?: string };

/** How a room hangs its work — one per kind of /home section. */
export type LotRoomKind = "featured" | "row" | "links";

/** A linked piece of non-program content: a category tile, a Studios story, a market event, a company. */
export type LotLinkItem = {
  id: string;
  title: string;
  href: string;
  image?: string;
  meta?: string;
};

export type LotRoom = {
  id: LotSectionId;
  kind: LotRoomKind;
  /** Section title exactly as /home shows it. */
  title: string;
  thai: string;
  blurb: string;
  /** featured / row rooms. */
  programs: LotProgram[];
  /** links rooms. */
  items: LotLinkItem[];
  /**
   * links rooms, mirroring the /home markup:
   * hero = StudiosHero slider, tile = BrandTiles (16:9, 6 across), landscape = Studios catalog (16:9, 3 across),
   * press = press cards (square image + text), logo = Content Distribution cards, square = Market & Events.
   */
  itemShape?: "hero" | "tile" | "landscape" | "press" | "logo" | "square";
  /** row rooms: the ContentRow layout /home uses (poster = 16:9 cards, vertical = 2:3 posters, wide = 16:9 stills). */
  layout?: "poster" | "vertical" | "wide";
  viewAllHref?: string;
};

export type LotData = { rooms: LotRoom[] };

/** "Gallery 01", "Gallery 02"… */
export function roomNumber(index: number) {
  return `Gallery ${String(index + 1).padStart(2, "0")}`;
}

export function lotProgramHref(slug: string) {
  return `${lotBase}/programs/${encodeURIComponent(slug)}`;
}

export function lotArticleHref(slug: string) {
  return `${lotBase}/news/${encodeURIComponent(slug)}`;
}

export function toLotProgram(title: Title): LotProgram {
  const seasons = title.seasons ?? [];
  return {
    slug: title.slug,
    title: title.title.trim(),
    type: title.type,
    genre: title.genre,
    year: title.year,
    duration: title.duration,
    rating: title.rating,
    description: title.description,
    poster: title.posterImage || title.heroImage,
    hero: title.heroImage || title.posterImage,
    trailerUrl: title.trailerUrl || seasons.find((season) => season.trailerUrl)?.trailerUrl,
    trailerMimeType: title.trailerMimeType || seasons.find((season) => season.trailerUrl)?.trailerMimeType,
    categories: (title.categoryNames ?? []).filter(readableName),
    typeSlugs: title.typeSlugs ?? [],
    isNew: Boolean(title.isNew),
    seasons: seasons.length,
    episodes: seasons.reduce((total, season) => total + season.episodes.length, 0),
  };
}

export function toLotArticle(article: FinalArticleCard): LotArticle {
  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    image: article.imageUrl,
    date: article.publishedDate,
    categories: article.categoryNames,
    programTitle: article.programTitle,
    author: article.author,
  };
}

/** CMS test entries ("aaa", "x") should never reach the stage. */
export function readableName(value: string) {
  const name = value.trim();
  return name.length >= 3 && !/^(.)\1{2,}$/u.test(name);
}

export function readablePrograms(titles: Title[], includeDiscontinued = false): Title[] {
  const unique = new Map<string, Title>();
  for (const title of titles) {
    if ((title.isDiscontinued && !includeDiscontinued) || !readableName(title.title)) continue;
    if (!unique.has(title.slug)) unique.set(title.slug, title);
  }
  return [...unique.values()];
}

export function formatLotDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

/** Frame-accurate looking slate number derived from a slug, purely decorative. */
export function slateNumber(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `${String((hash % 89) + 10)}${String.fromCharCode(65 + (hash % 6))}`;
}
