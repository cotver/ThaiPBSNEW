import LotProgramsPage from "@/app/(site)/home/studio/programs/page";
import { StudioModal } from "@/components/studio/StudioModal";

export const dynamic = "force-dynamic";

/** Opened from the Studio Lot: the same page, over the gallery. */
export default function LotProgramsPageModal(props: Parameters<typeof LotProgramsPage>[0]) {
  return (
    <StudioModal title="Archive Vault">
      <LotProgramsPage {...props} />
    </StudioModal>
  );
}
