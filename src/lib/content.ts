export type Title = {
  slug: string;
  title: string;
  type: "Movie" | "Series" | "Original";
  genre: string;
  year: string;
  rating: string;
  duration: string;
  description: string;
  progress?: string;
  inWatchlist?: boolean;
  featured?: boolean;
  heroImage?: string;
  posterImage?: string;
  seasons?: TitleSeason[];
  tone: string;
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

export const navItems = [
  { label: "Home", href: "/home", icon: "home" },
  { label: "Search", href: "/search", icon: "search" },
  { label: "Watchlist", href: "/watchlist", icon: "plus" },
  { label: "Originals", href: "/originals", icon: "spark" },
  { label: "Movies", href: "/movies", icon: "film" },
  { label: "Series", href: "/series", icon: "screen" },
];
