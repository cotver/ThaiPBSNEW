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
        <ContentRow layout="poster" title="Recommended For You" titles={collections.recommended} viewAllHref="/browse?section=recommended&label=Recommended%20For%20You" />
        {collections.typeRows.map((row) => (
          <ContentRow
            key={row.type.id}
            layout="vertical"
            title={row.type.name}
            titles={row.titles}
            viewAllHref={`/browse?section=type&type=${encodeURIComponent(row.type.slug)}&label=${encodeURIComponent(row.type.name)}`}
          />
        ))}
        <ContentRow layout="wide" removable title="Continue Watching" titles={collections.continueWatching} viewAllHref="/browse?section=continue-watching&label=Continue%20Watching" />
        <ContentRow layout="vertical" title="Continue Programs" titles={collections.continuePrograms} viewAllHref="/browse?section=continue-programs&label=Continue%20Programs" />
        <ContentRow layout="vertical" title="Discontinued Programs" titles={collections.discontinuedPrograms} viewAllHref="/browse?section=discontinued-programs&label=Discontinued%20Programs" />
        {collections.yearRows.map((row) => (
          <ContentRow
            key={row.year}
            layout="vertical"
            title={`ThaiPBS Year ${row.year}`}
            titles={row.titles}
            viewAllHref={`/browse?section=year&year=${encodeURIComponent(String(row.year))}&label=${encodeURIComponent(`ThaiPBS Year ${row.year}`)}`}
          />
        ))}
        <ContentRow layout="vertical" title="Thai Programs" titles={collections.thaiPrograms} viewAllHref="/browse?section=thai&label=Thai%20Programs" />
        <ContentRow layout="vertical" title="International Programs" titles={collections.internationalPrograms} viewAllHref="/browse?section=international&label=International%20Programs" />
      </section>
    </>
  );
}
