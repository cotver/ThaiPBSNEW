import { BrandTiles } from "@/components/BrandTiles";
import { ContentRow } from "@/components/ContentRow";
import { HeroCarousel } from "@/components/HeroCarousel";
import { getCatalogCollections, getCategoryTiles } from "@/lib/payload-content";
import { parseWatchHistoryCookie, watchHistoryCookieName } from "@/lib/watch-history";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  const continueWatchingSlugs = parseWatchHistoryCookie(cookieStore.get(watchHistoryCookieName)?.value);
  const [collections, categories] = await Promise.all([
    getCatalogCollections(continueWatchingSlugs),
    getCategoryTiles(),
  ]);

  return (
    <>


      <HeroCarousel titles={collections.heroes} />

      <section className="relative z-10 space-y-8 px-5 pb-16 sm:px-8 lg:px-10">
        <BrandTiles categories={categories} />
        <ContentRow layout="poster" title="Recommended For You" titles={collections.recommended} />
        {collections.typeRows.map((row) => (
          <ContentRow
            key={row.type.id}
            layout="vertical"
            title={row.type.name}
            titles={row.titles}
          />
        ))}
        <ContentRow layout="wide" title="Continue Watching" titles={collections.continueWatching} />
        {collections.yearRows.map((row) => (
          <ContentRow
            key={row.year}
            layout="vertical"
            title={`ThaiPBS Year ${row.year}`}
            titles={row.titles}
          />
        ))}
        <ContentRow layout="vertical" title="Thai Programs" titles={collections.thaiPrograms} />
        <ContentRow layout="vertical" title="International Programs" titles={collections.internationalPrograms} />
      </section>
    </>
  );
}
