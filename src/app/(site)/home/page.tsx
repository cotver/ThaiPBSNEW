import type { Metadata } from "next";
import { HomeSections } from "@/components/home/HomeSections";
import { StudioLot } from "@/components/studio/StudioLot";
import { hiddenCatalogSectionsEnabled } from "@/lib/feature-flags";
import { getCatalogCollections, getCategoryTiles } from "@/lib/payload-content";
import { parseSavedTitlesCookie, savedTitlesCookieName } from "@/lib/saved-titles";
import { lotView } from "@/lib/studio/data";
import { parseWatchHistoryCookie, watchHistoryCookieName } from "@/lib/watch-history";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type HomeProps = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

export async function generateMetadata({ searchParams }: HomeProps): Promise<Metadata> {
  if (!lotView((await searchParams).view)) return {};
  return {
    title: "Studio Lot — Thai PBS Programme Market",
    description: "Walk the Thai PBS catalogue as a gallery: every home page section, hung room by room.",
  };
}

/** /home, or with ?view=studio (the 3D Studio Lot) / ?view=list (its list view) the Studio Lot gallery. */
export default async function HomePage({ searchParams }: HomeProps) {
  if (lotView((await searchParams).view)) return <StudioLot />;

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
