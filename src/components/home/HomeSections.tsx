import { BrandTiles } from "@/components/home/BrandTiles";
import { ContentRow } from "@/components/ContentRow";
import { HeroCarousel } from "@/components/HeroCarousel";
import { SectionContactLink } from "@/components/SectionContacts";
import { StudiosShowcase } from "@/components/StudiosShowcase";
import { SHOW_HERO_CAROUSEL } from "@/lib/features";
import type { Title } from "@/lib/content";
import type { CategoryTile, TitleCollections, TypeProgramRow, YearProgramRow } from "@/lib/payload-content";

/**
 * Every section of the home page, in order. Shared by /home and the Studio Lot prototype's list view,
 * so both always render the same sections with the same data, conditions and links.
 * Each section's "Contact Information" link only shows once contacts are added for it in the CMS.
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
      <StudiosShowcase showCurtain={false} />
      {SHOW_HERO_CAROUSEL ? (
        <>
          <HeroCarousel titles={collections.heroes} />
          {collections.heroes.length ? <SectionContactLink className="px-5 sm:px-8 lg:px-10" section="hero-carousel" /> : null}
        </>
      ) : null}

      <section className="relative z-10 space-y-8 px-5 pb-16 sm:px-8 lg:px-10" data-home-content>
        <BrandTiles categories={categories} />
        {categories.length ? <SectionContactLink section="brand-tiles" /> : null}
        <ContentRow layout="poster" matchSourceTitles={collections.continueWatching} title="Recommended For You" titles={collections.recommended} viewAllHref="/browse?section=recommended&label=Recommended%20For%20You" />
        {collections.recommended.length ? <SectionContactLink section="recommended" /> : null}
        {collections.typeRows.map((row) => (
          <TypeRow key={row.type.id} row={row} continueWatching={collections.continueWatching} />
        ))}
        {showHiddenCatalogSections ? (
          <>
            <ContentRow layout="wide" matchSourceTitles={collections.continueWatching} removable title="Continue Watching" titles={collections.continueWatching} viewAllHref="/browse?section=continue-watching&label=Continue%20Watching" />
            {collections.continueWatching.length ? <SectionContactLink section="continue-watching" /> : null}
            <ContentRow layout="vertical" matchSourceTitles={collections.continueWatching} title="Continue Programs" titles={collections.continuePrograms} viewAllHref="/browse?section=continue-programs&label=Continue%20Programs" />
            {collections.continuePrograms.length ? <SectionContactLink section="continue-programs" /> : null}
            <ContentRow layout="vertical" matchSourceTitles={collections.continueWatching} title="Discontinued Programs" titles={collections.discontinuedPrograms} viewAllHref="/browse?section=discontinued-programs&label=Discontinued%20Programs" />
            {collections.discontinuedPrograms.length ? <SectionContactLink section="discontinued-programs" /> : null}
            {collections.yearRows.map((row) => (
              <YearRow key={row.year} row={row} continueWatching={collections.continueWatching} />
            ))}
            <ContentRow layout="vertical" matchSourceTitles={collections.continueWatching} title="Thai Programs" titles={collections.thaiPrograms} viewAllHref="/browse?section=thai&label=Thai%20Programs" />
            {collections.thaiPrograms.length ? <SectionContactLink section="thai-programs" /> : null}
            <ContentRow layout="vertical" matchSourceTitles={collections.continueWatching} title="International Programs" titles={collections.internationalPrograms} viewAllHref="/browse?section=international&label=International%20Programs" />
            {collections.internationalPrograms.length ? <SectionContactLink section="international-programs" /> : null}
          </>
        ) : null}
      </section>
    </>
  );
}

function TypeRow({ row, continueWatching }: { row: TypeProgramRow; continueWatching: Title[] }) {
  return (
    <>
      <ContentRow
        layout="vertical"
        matchSourceTitles={continueWatching}
        title={row.type.name}
        titles={row.titles}
        viewAllHref={`/browse?section=type&type=${encodeURIComponent(row.type.slug)}&label=${encodeURIComponent(row.type.name)}`}
      />
      {row.titles.length ? <SectionContactLink section={{ type: row.type.slug }} /> : null}
    </>
  );
}

function YearRow({ row, continueWatching }: { row: YearProgramRow; continueWatching: Title[] }) {
  return (
    <>
      <ContentRow
        layout="vertical"
        matchSourceTitles={continueWatching}
        title={`ThaiPBS Year ${row.year}`}
        titles={row.titles}
        viewAllHref={`/browse?section=year&year=${encodeURIComponent(String(row.year))}&label=${encodeURIComponent(`ThaiPBS Year ${row.year}`)}`}
      />
      {row.titles.length ? <SectionContactLink section={{ year: row.year }} /> : null}
    </>
  );
}
