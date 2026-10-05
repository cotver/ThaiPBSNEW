import type { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";
import { StudioLot } from "@/components/studio/StudioLot";
import { lotView } from "@/lib/studio/data";

export const dynamic = "force-dynamic";

type HomeProps = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

export async function generateMetadata({ searchParams }: HomeProps): Promise<Metadata> {
  if (!lotView((await searchParams).view)) return {};
  return {
    title: "Studio Lot — Thai PBS Programme Market",
    description: "Walk the Thai PBS catalogue as a gallery: every home page section, hung room by room.",
  };
}

/**
 * /home, or with ?view=studio (the 3D Studio Lot) / ?view=list (its list view) the Studio Lot gallery.
 * The page itself lives in HomePage, which the list view renders too, so the two never drift apart.
 */
export default async function HomeRoute({ searchParams }: HomeProps) {
  if (lotView((await searchParams).view)) return <StudioLot />;
  return <HomePage />;
}
