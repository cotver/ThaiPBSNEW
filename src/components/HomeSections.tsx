import { BrandTiles } from "@/components/BrandTiles";
import { ContentRow } from "@/components/ContentRow";
import { HeroCarousel } from "@/components/HeroCarousel";
import { StudiosShowcase } from "@/components/StudiosShowcase";
import type { CategoryTile, TitleCollections } from "@/lib/payload-content";

/**
 * Every section of the home page, in order. Shared by /home and the Studio Lot prototype's list view,
 * so both always render the same sections with the same data, conditions and links.
 */
export function HomeSections({
  categories,
  collections,
  showHiddenCatalogSections,
}: {
  categories: CategoryTile[];
  collections: TitleCollections;
  showHiddenCatalogSections: boolean;
}) {
  return (
    <>
      <HeroCarousel titles={collections.heroes} />
      <StudiosShowcase showCurtain={false} />

      <section className="relative z-10 space-y-8 px-5 pb-16 sm:px-8 lg:px-10" data-home-content>
        <BrandTiles categories={categories} />
        <ContentRow layout="poster" matchSourceTitles={collections.continueWatching} title="Recommended For You" titles={collections.recommended} viewAllHref="/browse?section=recommended&label=Recommended%20For%20You" />
        {collections.typeRows.map((row) => (
          <ContentRow
            key={row.type.id}
            layout="vertical"
            matchSourceTitles={collections.continueWatching}
            title={row.type.name}
            titles={row.titles}
            viewAllHref={`/browse?section=type&type=${encodeURIComponent(row.type.slug)}&label=${encodeURIComponent(row.type.name)}`}
          />
        ))}
        {showHiddenCatalogSections ? (
          <>
            <ContentRow layout="wide" matchSourceTitles={collections.continueWatching} removable title="Continue Watching" titles={collections.continueWatching} viewAllHref="/browse?section=continue-watching&label=Continue%20Watching" />
            <ContentRow layout="vertical" matchSourceTitles={collections.continueWatching} title="Continue Programs" titles={collections.continuePrograms} viewAllHref="/browse?section=continue-programs&label=Continue%20Programs" />
            <ContentRow layout="vertical" matchSourceTitles={collections.continueWatching} title="Discontinued Programs" titles={collections.discontinuedPrograms} viewAllHref="/browse?section=discontinued-programs&label=Discontinued%20Programs" />
            {collections.yearRows.map((row) => (
              <ContentRow
                key={row.year}
                layout="vertical"
                matchSourceTitles={collections.continueWatching}
                title={`ThaiPBS Year ${row.year}`}
                titles={row.titles}
                viewAllHref={`/browse?section=year&year=${encodeURIComponent(String(row.year))}&label=${encodeURIComponent(`ThaiPBS Year ${row.year}`)}`}
              />
            ))}
            <ContentRow layout="vertical" matchSourceTitles={collections.continueWatching} title="Thai Programs" titles={collections.thaiPrograms} viewAllHref="/browse?section=thai&label=Thai%20Programs" />
            <ContentRow layout="vertical" matchSourceTitles={collections.continueWatching} title="International Programs" titles={collections.internationalPrograms} viewAllHref="/browse?section=international&label=International%20Programs" />
          </>
        ) : null}
      </section>
    </>
  );
}
