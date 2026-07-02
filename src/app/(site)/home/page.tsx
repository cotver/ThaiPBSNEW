import Image from "next/image";
import { BrandTiles } from "@/components/BrandTiles";
import { ContentRow } from "@/components/ContentRow";
import { HeroCarousel } from "@/components/HeroCarousel";
import { getCatalogCollections, getCategoryTiles } from "@/lib/payload-content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [collections, categories] = await Promise.all([
    getCatalogCollections(),
    getCategoryTiles(),
  ]);

  return (
    <>


      <HeroCarousel titles={collections.heroes} />

      <section className="relative z-10 -mt-16 space-y-8 px-5 pb-16 sm:px-8 lg:px-10">
        <BrandTiles categories={categories} />
        <ContentRow layout="poster" title="Recommended For You" titles={collections.recommended} />
        <ContentRow layout="vertical" title="New Poster Mockups" titles={collections.posterMockups} />
        <ContentRow layout="wide" title="Continue Watching" titles={collections.continueWatching} />
        <ContentRow layout="vertical" title="Trending Movies" titles={collections.trending} />
        <ContentRow layout="vertical" title="Stream+ Originals" titles={collections.originals} />
      </section>
    </>
  );
}
