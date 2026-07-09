import { notFound } from "next/navigation";
import { TitlePageExperience } from "@/components/TitlePageExperience";
import { WatchHistoryMarker } from "@/components/WatchHistoryMarker";
import { getCatalogTitle } from "@/lib/payload-content";
import { parseSavedTitlesCookie, savedTitlesCookieName } from "@/lib/saved-titles";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function TitlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [loadedTitle, cookieStore] = await Promise.all([getCatalogTitle(slug), cookies()]);

  if (!loadedTitle || loadedTitle.isDiscontinued) {
    notFound();
  }

  const savedTitleSlugs = parseSavedTitlesCookie(cookieStore.get(savedTitlesCookieName)?.value);
  const title = {
    ...loadedTitle,
    inWatchlist: savedTitleSlugs.includes(loadedTitle.slug),
  };

  return (
    <>
      <WatchHistoryMarker slug={title.slug} />
      <TitlePageExperience title={title} />
    </>
  );
}
