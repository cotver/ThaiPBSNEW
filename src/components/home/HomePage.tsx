import { cookies } from "next/headers";
import { cache } from "react";
import { CinematicIntro } from "@/components/cinema/CinematicIntro";
import { CinematicMotion } from "@/components/cinema/CinematicMotion";
import { cinematicIntroCookieName } from "@/components/cinema/intro-cookie";
import { HomeSections } from "@/components/home/HomeSections";
import { hiddenCatalogSectionsEnabled } from "@/lib/feature-flags";
import { getCatalogCollections, getCategoryTiles } from "@/lib/payload-content";
import { parseSavedTitlesCookie, savedTitlesCookieName } from "@/lib/saved-titles";
import { parseWatchHistoryCookie, watchHistoryCookieName } from "@/lib/watch-history";

/**
 * Everything the home page renders from, loaded once per request: /home and the Studio Lot (whose list
 * view is this same page, and whose gallery rooms mirror its sections) share the one fetch.
 */
export const getHomePageData = cache(async () => {
  const cookieStore = await cookies();
  const continueWatchingSlugs = parseWatchHistoryCookie(cookieStore.get(watchHistoryCookieName)?.value);
  const savedTitleSlugs = parseSavedTitlesCookie(cookieStore.get(savedTitlesCookieName)?.value);
  const [collections, categories] = await Promise.all([
    getCatalogCollections(continueWatchingSlugs, savedTitleSlugs),
    getCategoryTiles(),
  ]);
  return {
    categories,
    collections,
    showHiddenCatalogSections: hiddenCatalogSectionsEnabled(),
    showIntro: !cookieStore.has(cinematicIntroCookieName),
  };
});

/**
 * The home page itself: its sections and the cinematic layer around them. /home renders it, and so does
 * the Studio Lot's list view (/home?view=list), so a change here shows up in both.
 * `intro: false` leaves out the once-per-session title card, for places that bring their own entrance.
 */
export async function HomePage({ intro = true }: { intro?: boolean } = {}) {
  const { categories, collections, showHiddenCatalogSections, showIntro } = await getHomePageData();

  return (
    <>
      {intro && showIntro ? <CinematicIntro /> : null}
      <div aria-hidden="true" data-cine-progress />
      <div data-cinematic-home>
        <HomeSections categories={categories} collections={collections} showHiddenCatalogSections={showHiddenCatalogSections} />
      </div>
      <CinematicMotion />
    </>
  );
}
