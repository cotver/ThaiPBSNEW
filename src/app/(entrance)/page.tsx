import { LandingEntrance } from "@/components/LandingEntrance";
import { getLandingGalleryItems } from "@/lib/payload-content";

export const dynamic = "force-dynamic";

export default async function EntrancePage() {
  const items = await getLandingGalleryItems();

  return <LandingEntrance items={items} />;
}
