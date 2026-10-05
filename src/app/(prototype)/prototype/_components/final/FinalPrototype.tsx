"use client";

import { useState } from "react";
import type { Title } from "@/lib/content";
import type { TitleCollections } from "@/lib/payload-content";
import { FinalHero } from "./FinalHero";
import { FinalHomeSections } from "./FinalHomeSections";

export function FinalPrototype({ collections }: { collections: TitleCollections }) {
  const [useMockData, setUseMockData] = useState(false);
  const displayedCollections = useMockData ? addMockArticles(collections) : collections;

  return (
    <main className="final-page">
      <button
        aria-pressed={useMockData}
        className="final-mock-data-toggle"
        onClick={() => setUseMockData((enabled) => !enabled)}
        type="button"
      >
        {useMockData ? "Use live data" : "Add 20 fake data"}
      </button>
      <FinalHero heroes={displayedCollections.heroes} />
      <FinalHomeSections collections={displayedCollections} />
    </main>
  );
}

function addMockArticles(collections: TitleCollections): TitleCollections {
  const artworkPool = uniqueTitles([
    ...collections.posterMockups,
    ...collections.heroes,
    ...collections.recommended,
    ...collections.continuePrograms,
    ...collections.continueWatching,
    ...collections.thaiPrograms,
    ...collections.internationalPrograms,
    ...collections.typeRows.flatMap((row) => row.titles),
    ...collections.yearRows.flatMap((row) => row.titles),
  ]);
  const fakeArticles = createFakeArticles(artworkPool, 20);
  const addFake = (titles: Title[]) => uniqueTitles([...titles, ...fakeArticles]);

  return {
    ...collections,
    heroes: addFake(collections.heroes),
    recommended: addFake(collections.recommended),
    continueWatching: addFake(collections.continueWatching),
    continuePrograms: addFake(collections.continuePrograms),
    discontinuedPrograms: addFake(collections.discontinuedPrograms).map((title) => ({
      ...title,
      isDiscontinued: true,
    })),
    thaiPrograms: addFake(collections.thaiPrograms),
    internationalPrograms: addFake(collections.internationalPrograms),
    typeRows: collections.typeRows.map((row) => ({ ...row, titles: addFake(row.titles) })),
    yearRows: collections.yearRows.map((row) => ({ ...row, titles: addFake(row.titles) })),
  };
}

function createFakeArticles(artworkPool: Title[], count: number): Title[] {
  const fallbackTones = [
    "from-indigo-950 via-sky-700 to-amber-300",
    "from-zinc-950 via-red-800 to-orange-300",
    "from-teal-950 via-emerald-600 to-cyan-300",
    "from-slate-950 via-violet-700 to-pink-300",
  ];

  return Array.from({ length: count }, (_, index) => {
    const artwork = artworkPool.length ? artworkPool[index % artworkPool.length] : undefined;
    const number = index + 1;

    return {
      slug: `final-mock-article-${String(number).padStart(2, "0")}`,
      title: number % 6 === 0
        ? `Mock Article ${number}: A Very Long Story Title for Responsive Layout Testing`
        : `Mock Article ${String(number).padStart(2, "0")}`,
      type: "Original",
      genre: ["Documentary", "Culture", "Drama", "Knowledge"][index % 4],
      year: String(2024 + (index % 4)),
      rating: "",
      duration: "",
      eyebrow: "Mock article",
      description: `Fake article record ${number}, generated only for testing the final prototype layout and interactions.`,
      featured: index < 8,
      heroImage: artwork?.heroImage || artwork?.posterImage,
      isContinue: false,
      isDiscontinued: false,
      isGlobalProgram: false,
      isNew: true,
      posterImage: artwork?.posterImage || artwork?.heroImage,
      showHeroActions: true,
      showHeroDetails: true,
      tone: artwork?.tone || fallbackTones[index % fallbackTones.length],
    } satisfies Title;
  });
}

function uniqueTitles(titles: Title[]): Title[] {
  return [...new Map(titles.map((title) => [title.slug, title])).values()];
}
