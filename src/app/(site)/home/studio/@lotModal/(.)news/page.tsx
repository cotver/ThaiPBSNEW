import LotNewsPage from "@/app/(site)/home/studio/news/page";
import { StudioModal } from "@/components/studio/StudioModal";

export const dynamic = "force-dynamic";

/** Opened from the Studio Lot: the same page, over the gallery. */
export default function LotNewsPageModal() {
  return (
    <StudioModal title="Newsroom">
      <LotNewsPage />
    </StudioModal>
  );
}
