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
        <ContentRow layout="poster" title="Recommended For You" titles={collections.recommended} viewAllHref="/search?q=New" />
        {collections.typeRows.map((row) => (
          <ContentRow
            key={row.type.id}
            layout="vertical"
            title={row.type.name}
            titles={row.titles}
            viewAllHref={row.type.link || `/type/${encodeURIComponent(row.type.slug)}`}
          />
        ))}
        <ContentRow layout="wide" title="Continue Watching" titles={collections.continueWatching} viewAllHref="/watchlist" />
        {collections.yearRows.map((row) => (
          <ContentRow
            key={row.year}
            layout="vertical"
            title={`ThaiPBS Year ${row.year}`}
            titles={row.titles}
            viewAllHref={`/search?q=${encodeURIComponent(String(row.year))}`}
          />
        ))}
        <ContentRow layout="vertical" title="Thai Programs" titles={collections.thaiPrograms} viewAllHref="/search?q=Thai" />
        <ContentRow layout="vertical" title="International Programs" titles={collections.internationalPrograms} viewAllHref="/search?q=International" />
      </section>
    </>
  );
}
