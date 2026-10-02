"use client";

import { HeroCarousel, type HeroCarouselItem } from "./HeroCarousel";

export type StudiosHeroItem = {
  description?: string;
  eyebrow?: string;
  id: number;
  href: string;
  imageAlt: string;
  imageUrl: string;
  title: string;
  videoAlt?: string;
  videoMimeType?: string;
  videoUrl?: string;
};

export function StudiosHero({ items, showActions = true, showSelectors = true }: {
  items: StudiosHeroItem[];
  showActions?: boolean;
  showSelectors?: boolean;
}) {
  if (!items.length) return null;

  const titles: HeroCarouselItem[] = items.map((item) => ({
    slug: `article-${item.id}`,
    title: item.title,
    type: "Original",
    genre: "",
    year: "",
    rating: "",
    duration: "",
    eyebrow: item.eyebrow,
    description: item.description ?? "",
    heroImage: item.imageUrl,
    tone: "from-[#030714] to-[#111827]",
    href: item.href,
    actionLabel: "Read",
    showHeroActions: showActions,
    hideWatchlist: true,
    directVideo: Boolean(item.videoUrl),
    trailerUrl: item.videoUrl,
    trailerMimeType: item.videoMimeType,
  }));

  return <HeroCarousel titles={titles} showSelectors={showSelectors} />;
}
