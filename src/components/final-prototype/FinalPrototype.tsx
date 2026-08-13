import type { CategoryTile, TitleCollections } from "@/lib/payload-content";
import { FinalHero } from "./FinalHero";
import { FinalHomeSections } from "./FinalHomeSections";

export function FinalPrototype({ categories, collections }: { categories: CategoryTile[]; collections: TitleCollections }) {
  return (
    <main className="final-page">
      <FinalHero heroes={collections.heroes.slice(0, 3)} />
      <FinalHomeSections categories={categories} collections={collections} />
    </main>
  );
}
