import { ContentRow } from "@/components/ContentRow";
import { getCatalogCollections } from "@/lib/payload-content";
import { parseSavedTitlesCookie, savedTitlesCookieName } from "@/lib/saved-titles";
import { parseWatchHistoryCookie, watchHistoryCookieName } from "@/lib/watch-history";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const cookieStore = await cookies();
  const continueWatchingSlugs = parseWatchHistoryCookie(cookieStore.get(watchHistoryCookieName)?.value);
  const savedTitleSlugs = parseSavedTitlesCookie(cookieStore.get(savedTitlesCookieName)?.value);
  const collections = await getCatalogCollections(continueWatchingSlugs, savedTitleSlugs);

  return (
    <section className="space-y-10 px-5 pb-16 sm:px-8 lg:px-10">
      <div>
        <p className="text-sm font-bold uppercase text-cyan-200">Your saved titles</p>
        <h1 className="mt-3 text-4xl font-black sm:text-6xl">Watchlist</h1>
        <p className="mt-4 max-w-2xl leading-7 text-white/68">
          Jump back into saved movies, originals, and series from one place.
        </p>
      </div>
      <ContentRow layout="vertical" matchSourceTitles={collections.continueWatching} title="Saved For Later" titles={collections.watchlist} />
      <ContentRow layout="wide" matchSourceTitles={collections.continueWatching} title="Continue Watching" titles={collections.continueWatching} />
    </section>
  );
}
