import { ContentRow } from "@/components/ContentRow";
import { getCatalogCollections } from "@/lib/payload-content";

export const dynamic = "force-dynamic";

export default async function SeriesPage() {
  const collections = await getCatalogCollections();

  return (
    <section className="space-y-10 px-5 pb-16 sm:px-8 lg:px-10">
      <div className="max-w-3xl">
        <p className="text-sm font-bold uppercase text-cyan-200">Episodic adventures</p>
        <h1 className="mt-3 text-4xl font-black sm:text-6xl">Series</h1>
        <p className="mt-4 leading-7 text-white/68">
          Continue family comedies, nature journeys, and serial adventures across every screen.
        </p>
      </div>
      <ContentRow layout="vertical" title="Popular Series" titles={collections.series} />
      <ContentRow layout="vertical" title="Pick Up Where You Left Off" titles={collections.continueWatching} />
    </section>
  );
}
