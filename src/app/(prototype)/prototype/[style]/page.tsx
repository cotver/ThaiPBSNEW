import { notFound } from "next/navigation";
import { BlogPrototypeHome } from "@/components/prototype/blog/BlogPrototype";
import { parsePrototypeStyle, withPrototypeFallback } from "@/components/prototype/blog/blog-data";
import { getCatalogCollections, getCatalogTitles, getCategoryTiles } from "@/lib/payload-content";
import { parseSavedTitlesCookie, savedTitlesCookieName } from "@/lib/saved-titles";
import { parseWatchHistoryCookie, watchHistoryCookieName } from "@/lib/watch-history";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function StyleHomePage({ params }: { params: Promise<{ style: string }> }) {
  const { style: value } = await params;
  const style = parsePrototypeStyle(value);
  if (!style) notFound();
  const cookieStore = await cookies();
  const continueWatchingSlugs = parseWatchHistoryCookie(cookieStore.get(watchHistoryCookieName)?.value);
  const savedTitleSlugs = parseSavedTitlesCookie(cookieStore.get(savedTitlesCookieName)?.value);
  const [sourceTitles, categoryTiles, collections] = await Promise.all([
    getCatalogTitles(),
    getCategoryTiles(),
    getCatalogCollections(continueWatchingSlugs, savedTitleSlugs),
  ]);
  const titles = withPrototypeFallback(sourceTitles);
  return <BlogPrototypeHome categoryTiles={categoryTiles} collections={collections} style={style} titles={titles} />;
}
