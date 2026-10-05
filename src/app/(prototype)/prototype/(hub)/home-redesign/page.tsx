import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import { getCatalogCollections, getCategoryTiles } from "@/lib/payload-content";
import { parseSavedTitlesCookie, savedTitlesCookieName } from "@/lib/saved-titles";
import { parseWatchHistoryCookie, watchHistoryCookieName } from "@/lib/watch-history";
import { HomeRedesign } from "./HomeRedesign";
import { PrototypeStudiosShowcase } from "./PrototypeStudiosShowcase";

const prototypeFont = localFont({
  src: [
    { path: "./fonts/IBMPlexSansThai-regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexSansThai-semibold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/IBMPlexSansThai-bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--prototype-font",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thai PBS — Home Redesign Prototype",
  description: "An isolated editorial redesign concept for the Thai PBS catalogue homepage.",
};

export default async function HomeRedesignPage() {
  const cookieStore = await cookies();
  const history = parseWatchHistoryCookie(cookieStore.get(watchHistoryCookieName)?.value);
  const saved = parseSavedTitlesCookie(cookieStore.get(savedTitlesCookieName)?.value);
  const [collections, categories] = await Promise.all([
    getCatalogCollections(history, saved),
    getCategoryTiles(),
  ]);
  return (
    <div className={prototypeFont.variable}>
      <HomeRedesign
        categories={categories}
        collections={collections}
        studiosShowcase={<PrototypeStudiosShowcase />}
      />
    </div>
  );
}
