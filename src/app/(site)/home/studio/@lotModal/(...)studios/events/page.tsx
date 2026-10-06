import MarketEventsPage from "@/app/(site)/studios/events/page";
import { StudioModal } from "@/components/studio/StudioModal";

export const dynamic = "force-dynamic";

/** Opened from the Studio Lot: the same page, over the gallery. */
export default function MarketEventsPageModal() {
  return (
    <StudioModal title="Market & Events" variant="site">
      <MarketEventsPage />
    </StudioModal>
  );
}
