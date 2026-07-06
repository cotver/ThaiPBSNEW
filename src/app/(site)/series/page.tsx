import { ContentRow } from "@/components/ContentRow";
import { getCatalogCollections } from "@/lib/payload-content";
import { parseWatchHistoryCookie, watchHistoryCookieName } from "@/lib/watch-history";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function SeriesPage() {
  const cookieStore = await cookies();
  const continueWatchingSlugs = parseWatchHistoryCookie(cookieStore.get(watchHistoryCookieName)?.value);
  const collections = await getCatalogCollections(continueWatchingSlugs);

  return (
    <section className="space-y-10 px-5 pb-16 sm:px-8 lg:px-10">
      <div className="max-w-3xl">
        <p className="text-sm font-bold uppercase text-cyan-200">Episodic adventures</p>
        <h1 className="mt-3 text-4xl font-black sm:text-6xl">Series</h1>
        <p className="mt-4 leading-7 text-white/68">
          Continue family comedies, nature journeys, and serial adventures across every screen.
        </p>
      </div>
      <ContentRow layout="vertical" matchSourceTitles={collections.continueWatching} title="Popular Series" titles={collections.series} />
      <ContentRow layout="vertical" matchSourceTitles={collections.continueWatching} title="Pick Up Where You Left Off" titles={collections.continueWatching} />
    </section>
  );
}
