import { redirect } from "next/navigation";
import { HomePage } from "@/components/home/HomePage";
import { lotGalleryHref, lotListHref, lotView } from "@/lib/studio/data";

export const dynamic = "force-dynamic";

type HomeProps = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

/**
 * /home. The Studio Lot gallery used to be /home?view=studio|list; it now lives at /home/studio, so it can
 * open the pages /home links to as modals over itself. Old links land there.
 */
export default async function HomeRoute({ searchParams }: HomeProps) {
  const view = lotView((await searchParams).view);
  if (view) redirect(view === "list" ? lotListHref : lotGalleryHref);
  return <HomePage />;
}
