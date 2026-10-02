import { HomeSections } from "@/components/HomeSections";
import { hiddenCatalogSectionsEnabled } from "@/lib/feature-flags";
import { getCatalogCollections, getCategoryTiles } from "@/lib/payload-content";
import { parseSavedTitlesCookie, savedTitlesCookieName } from "@/lib/saved-titles";
import { parseWatchHistoryCookie, watchHistoryCookieName } from "@/lib/watch-history";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const showHiddenCatalogSections = hiddenCatalogSectionsEnabled();
  const cookieStore = await cookies();
  const continueWatchingSlugs = parseWatchHistoryCookie(cookieStore.get(watchHistoryCookieName)?.value);
  const savedTitleSlugs = parseSavedTitlesCookie(cookieStore.get(savedTitlesCookieName)?.value);
  const [collections, categories] = await Promise.all([
    getCatalogCollections(continueWatchingSlugs, savedTitleSlugs),
    getCategoryTiles(),
  ]);

  return <HomeSections categories={categories} collections={collections} showHiddenCatalogSections={showHiddenCatalogSections} />;
}
