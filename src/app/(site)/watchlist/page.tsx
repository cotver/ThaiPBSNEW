import { ContentRow } from "@/components/ContentRow";
import { getCatalogCollections } from "@/lib/payload-content";

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const collections = await getCatalogCollections();

  return (
    <section className="space-y-10 px-5 pb-16 sm:px-8 lg:px-10">
      <div>
        <p className="text-sm font-bold uppercase text-cyan-200">Your saved titles</p>
        <h1 className="mt-3 text-4xl font-black sm:text-6xl">Watchlist</h1>
        <p className="mt-4 max-w-2xl leading-7 text-white/68">
          Jump back into saved movies, originals, and series from one place.
        </p>
      </div>
      <ContentRow layout="vertical" title="Saved For Later" titles={collections.watchlist} />
      <ContentRow layout="wide" title="Continue Watching" titles={collections.continueWatching} />
    </section>
  );
}
