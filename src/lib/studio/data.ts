import { titleHref, type Title } from "@/lib/content";
import { getHeroTrailerSource } from "@/lib/trailer-playback";
import type { MarketLogo } from "@/lib/market-logos";
import type { FinalArticleCard } from "@/lib/payload-articles";
import type { StudiosCatalogCategory } from "@/components/StudiosCatalog";
import type { StudiosAccordionCategory } from "@/components/StudiosCategoryAccordion";
import type { CategoryTile } from "@/lib/payload-content";

/** The gallery's own pages (programmes, newsroom, shortlist, partner logos) live under /home/studio. */
export const lotBase = "/home/studio";

/**
 * The gallery itself, walked in 3D or as its list. It links to the same pages /home does, and opens them
 * over itself as modals (app/(site)/home/studio/@lotModal), so the 3D walk stays loaded underneath.
 */
export const lotGalleryHref = lotBase;
export const lotListHref = `${lotBase}?view=list`;

/** ?view=… values: /home redirects these old gallery links to /home/studio. */
export type LotView = "studio" | "list";
export function lotView(value: string | string[] | undefined): LotView | null {
  const view = Array.isArray(value) ? value[0] : value;
  return view === "studio" || view === "list" ? view : null;
}

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
  /**
   * Whether it has a program page to open. False, as on /home's HeroCarousel, for CMS hero images
   * (not programs, no actions) and discontinued programs (actions disabled).
   */
  linkable: boolean;
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
  /** ThaiPBS Journal stories: the video /home's StudiosHero plays over the cover. */
  video?: { url: string; mimeType?: string };
  /** Content Distribution partners: the same logo treatment /home uses. */
  logo?: MarketLogo & { frame: { width: number; height: number } };
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
   * press = press cards (square image + text), logo = Content Distribution cards, square = Market & Events,
   * studios = Studios Categories (16:9, 5 across the whole wall).
   */
  itemShape?: "hero" | "tile" | "landscape" | "press" | "logo" | "square" | "studios";
  /** row rooms: the ContentRow layout /home uses (poster = 16:9 cards, vertical = 2:3 posters, wide = 16:9 stills). */
  layout?: "poster" | "vertical" | "wide";
  viewAllHref?: string;
  /** The Studios Categories room: its panel renders /home's Studios catalog, then "More Studios categories". */
  studios?: { categories: StudiosCatalogCategory[]; otherCategories: StudiosAccordionCategory[] };
  /** The Categories room: its panel renders /home's BrandTiles, hover video and all. */
  brandTiles?: CategoryTile[];
};

export type LotData = { rooms: LotRoom[] };

/** A programme opens where /home opens it: its title page. */
export function lotProgramHref(slug: string) {
  return titleHref(slug);
}

export function lotArticleHref(slug: string) {
  return `${lotBase}/news/${encodeURIComponent(slug)}`;
}

export function toLotProgram(title: Title): LotProgram {
  const seasons = title.seasons ?? [];
  const trailer = getHeroTrailerSource(title);
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
    // The trailer /home's HeroCarousel would play: programs only, own trailer else the latest season's.
    trailerUrl: trailer.url || undefined,
    trailerMimeType: trailer.mimeType,
    categories: (title.categoryNames ?? []).filter(readableName),
    typeSlugs: title.typeSlugs ?? [],
    isNew: Boolean(title.isNew),
    seasons: seasons.length,
    episodes: seasons.reduce((total, season) => total + season.episodes.length, 0),
    linkable: title.showHeroActions !== false && !title.isDiscontinued,
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
