import type { Metadata } from "next";
import { getCatalogCollections, getCatalogTitles, getCategoryTiles } from "@/lib/payload-content";
import { LotFooter } from "../_components/LotSections";
import { ProgramArchive } from "../_components/ProgramArchive";
import { readableName, readablePrograms, toLotProgram } from "../_lib/data";
import pages from "../pages.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Archive Vault" };

export default async function LotProgramsPage({ searchParams }: { searchParams: Promise<{ type?: string; category?: string }> }) {
  const [{ type, category }, titles, collections, categoryTiles] = await Promise.all([searchParams, getCatalogTitles(), getCatalogCollections(), getCategoryTiles()]);
  const programs = readablePrograms(titles).map(toLotProgram);
  const types = collections.typeRows
    .filter((row) => row.titles.length && readableName(row.type.name))
    .map((row) => ({ slug: row.type.slug, name: row.type.name }));
  const typeSlugs = new Set(types.map((item) => item.slug));
  const categories = [...new Map(categoryTiles.map((tile) => [tile.slug, { slug: tile.slug, name: tile.name, image: tile.imageUrl }])).values()].filter(
    (tile) => !typeSlugs.has(tile.slug) && readableName(tile.name) && programs.some((program) => program.typeSlugs.includes(tile.slug)),
  );

  return (
    <main className={pages.page}>
      <header className={pages.pageHero}>
        <p className={pages.kicker}>คลังรายการ</p>
        <h1 className={pages.pageTitle}>
          Archive <em>Vault</em>
        </h1>
        <p className={pages.lede}>Every program on the lot, shelved by format. Rest on a slate to roll its trailer; open it to step into the screening room.</p>
        <dl className={pages.heroStats}>
          <div>
            <dt>Titles</dt>
            <dd>{programs.length}</dd>
          </div>
          <div>
            <dt>Formats</dt>
            <dd>{types.length}</dd>
          </div>
          <div>
            <dt>With trailers</dt>
            <dd>{programs.filter((program) => program.trailerUrl).length}</dd>
          </div>
        </dl>
      </header>
      <ProgramArchive categories={categories} initialCategory={category} initialType={type} programs={programs} types={types} />
      <LotFooter />
    </main>
  );
}
