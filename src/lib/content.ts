export type Title = {
  slug: string;
  title: string;
  type: "Movie" | "Series" | "Original";
  genre: string;
  year: string;
  rating: string;
  duration: string;
  eyebrow?: string;
  description: string;
  companyProduce?: string;
  producer?: string;
  director?: string;
  artist?: string;
  writer?: string;
  producers?: TitleCredit[];
  directors?: TitleCredit[];
  artists?: TitleCredit[];
  writers?: TitleCredit[];
  categoryNames?: string[];
  categorySlugs?: string[];
  progress?: string;
  inWatchlist?: boolean;
  featured?: boolean;
  heroImage?: string;
  heroTitleLines?: string[];
  homeYear?: number;
  isContinue?: boolean;
  isDiscontinued?: boolean;
  isGlobalProgram?: boolean;
  isNew?: boolean;
  isScheduled?: boolean;
  posterImage?: string;
  seasons?: TitleSeason[];
  showHeroActions?: boolean;
  showHeroDetails?: boolean;
  source?: "program" | "heroImage";
  tone: string;
  trailerMimeType?: string;
  trailerUrl?: string;
  typeSlugs?: string[];
};

export type TitleCredit = {
  image?: string;
  name: string;
};

export type TitleEpisode = {
  id: string;
  description: string;
  duration?: string;
  episodeNumber?: number;
  image?: string;
  releaseDate?: string;
  title: string;
  videoMimeType?: string;
  videoUrl?: string;
};

export type TitleSeason = {
  id: string;
  description?: string;
  episodes: TitleEpisode[];
  image?: string;
  seasonNumber?: number;
  title: string;
  trailerMimeType?: string;
  trailerUrl?: string;
};

export type NavItem = {
  href: string;
  icon: string;
  label: string;
};

export const navItems = [
  { label: "Home", href: "/home", icon: "home" },
  { label: "Search", href: "/search", icon: "search" },
  { label: "Watchlist", href: "/watchlist", icon: "plus" },
] satisfies NavItem[];

export function titleHref(slug: string) {
  return `/title/${encodeURIComponent(slug)}`;
}

export function finalArticleHref(slug: string) {
  return `/prototype/final/article/${encodeURIComponent(slug)}`;
}

export function columnArticleHref(slug: string) {
  return `/article/${encodeURIComponent(slug)}`;
}

export function titleEyebrow(title: Title) {
  if (title.eyebrow) {
    return title.eyebrow;
  }

  if (title.type === "Original") {
    const category = title.categoryNames?.find(Boolean);

    return category ? `ThaiPBS ${category}` : "ThaiPBS";
  }

  return title.type;
}

export function titleDisplayLines(title: Pick<Title, "heroTitleLines" | "title">) {
  const sourceLines = title.heroTitleLines?.length
    ? title.heroTitleLines
    : [title.title];
  const lines = sourceLines.flatMap((line) => line.split(/\\n|\r?\n/));

  return lines.map((line) => line.trim()).filter(Boolean);
}

export function titleDisplayText(title: Pick<Title, "heroTitleLines" | "title">) {
  return titleDisplayLines(title).join("\n");
}

export function titleInlineText(title: Pick<Title, "title">) {
  return title.title.replace(/\\n|\r?\n/g, " ").replace(/\s+/g, " ").trim();
}

export function titleSeasonEpisodeLabel(title: Pick<Title, "seasons">): string | null {
  const seasons = title.seasons ?? [];
  if (seasons.length === 0) return null;

  const episodeCount = Math.max(...seasons.map((season) => season.episodes.length));
  if (episodeCount === 0) return null;

  const seasonLabel = `${seasons.length} ${seasons.length === 1 ? "Season" : "Seasons"}`;
  const episodeLabel = `${episodeCount} ${episodeCount === 1 ? "Episode" : "Episodes"}`;
  return `${seasonLabel} · ${episodeLabel}`;
}
