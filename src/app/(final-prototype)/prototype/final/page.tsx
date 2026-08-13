import { FinalPrototype } from "@/components/final-prototype/FinalPrototype";
import { getCatalogCollections, getCategoryTiles } from "@/lib/payload-content";
import { parseSavedTitlesCookie, savedTitlesCookieName } from "@/lib/saved-titles";
import { parseWatchHistoryCookie, watchHistoryCookieName } from "@/lib/watch-history";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function FinalPrototypePage() {
  const cookieStore = await cookies();
  const continueWatchingSlugs = parseWatchHistoryCookie(cookieStore.get(watchHistoryCookieName)?.value);
  const savedTitleSlugs = parseSavedTitlesCookie(cookieStore.get(savedTitlesCookieName)?.value);
  const [collections, categories] = await Promise.all([
    getCatalogCollections(continueWatchingSlugs, savedTitleSlugs),
    getCategoryTiles(),
  ]);

  return <FinalPrototype categories={categories} collections={collections} />;
}
