import { LandingEntrance } from "@/components/LandingEntrance";
import { getLandingImageUrls } from "@/lib/payload-content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const imageUrls = await getLandingImageUrls();

  return <LandingEntrance imageUrls={imageUrls} />;
}
