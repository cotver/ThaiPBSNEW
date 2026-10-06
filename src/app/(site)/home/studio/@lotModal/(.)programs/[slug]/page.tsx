import LotProgramPage from "@/app/(site)/home/studio/programs/[slug]/page";
import { StudioModal } from "@/components/studio/StudioModal";

export const dynamic = "force-dynamic";

/** Opened from the Studio Lot: the same page, over the gallery. */
export default function LotProgramPageModal(props: Parameters<typeof LotProgramPage>[0]) {
  return (
    <StudioModal title="Screening room">
      <LotProgramPage {...props} />
    </StudioModal>
  );
}
