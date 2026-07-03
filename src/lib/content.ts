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
  progress?: string;
  inWatchlist?: boolean;
  featured?: boolean;
  heroImage?: string;
  heroTitleLines?: string[];
  posterImage?: string;
  seasons?: TitleSeason[];
  showHeroActions?: boolean;
  showHeroDetails?: boolean;
  source?: "program" | "heroImage";
  tone: string;
  trailerMimeType?: string;
  trailerUrl?: string;
};

export type TitleEpisode = {
  id: string;
  description: string;
  duration?: string;
  episodeNumber?: number;
  image?: string;
  releaseDate?: string;
  title: string;
};

export type TitleSeason = {
  id: string;
  description?: string;
  episodes: TitleEpisode[];
  image?: string;
  seasonNumber?: number;
  title: string;
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
