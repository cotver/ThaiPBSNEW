import type { CategoryTile, TitleCollections } from "@/lib/payload-content";
import { FinalCategoryTiles } from "./FinalCategoryTiles";
import { FinalContinueFeatured } from "./FinalContinueFeatured";
import { FinalContentRow } from "./FinalContentRow";
import { FinalProgramJournal } from "./FinalProgramJournal";
import { FinalProgramBand } from "./FinalProgramBand";
import { FinalRecommendedSpotlight } from "./FinalRecommendedSpotlight";
import { FinalYearMotion } from "./FinalYearMotion";

export function FinalHomeSections({ categories, collections }: { categories: CategoryTile[]; collections: TitleCollections }) {
  return (
    <section className="final-home-sections">
      <FinalCategoryTiles categories={categories} />

      <FinalRecommendedSpotlight titles={collections.recommended} />

      {collections.typeRows.map((row) => (
        <FinalProgramBand
          key={row.type.id}
          title={row.type.name}
          titles={row.titles}
          viewAllHref={`/browse?section=type&type=${encodeURIComponent(row.type.slug)}&label=${encodeURIComponent(row.type.name)}`}
        />
      ))}

      <FinalContinueFeatured
        titles={collections.continueWatching}
        viewAllHref="/browse?section=continue-watching&label=Continue%20Watching"
      />
      <FinalContentRow
        layout="portrait"
        title="Continue Programs"
        titles={collections.continuePrograms}
        viewAllHref="/browse?section=continue-programs&label=Continue%20Programs"
      />
      {collections.yearRows.map((row) => (
        <FinalYearMotion
          key={row.year}
          titles={row.titles}
          viewAllHref={`/browse?section=year&year=${encodeURIComponent(String(row.year))}&label=${encodeURIComponent(`ThaiPBS Year ${row.year}`)}`}
          year={row.year}
        />
      ))}

      <FinalProgramJournal title="Thai Programs" titles={collections.thaiPrograms} viewAllHref="/browse?section=thai&label=Thai%20Programs" />
      <FinalProgramJournal title="International Programs" titles={collections.internationalPrograms} viewAllHref="/browse?section=international&label=International%20Programs" />
      <FinalContentRow
        layout="portrait"
        title="Discontinued Programs"
        titles={collections.discontinuedPrograms}
        viewAllHref="/browse?section=discontinued-programs&label=Discontinued%20Programs"
      />
    </section>
  );
}
