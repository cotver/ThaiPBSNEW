import LotShortlistPage from "@/app/(site)/home/studio/shortlist/page";
import { StudioModal } from "@/components/studio/StudioModal";

export const dynamic = "force-dynamic";

/** Opened from the Studio Lot: the same page, over the gallery. */
export default function LotShortlistPageModal() {
  return (
    <StudioModal title="Shortlist">
      <LotShortlistPage />
    </StudioModal>
  );
}
