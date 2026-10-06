import TitlePage from "@/app/(site)/title/[slug]/page";
import { StudioModal } from "@/components/studio/StudioModal";

export const dynamic = "force-dynamic";

/** Opened from the Studio Lot: the same page, over the gallery. */
export default function TitlePageModal(props: Parameters<typeof TitlePage>[0]) {
  return (
    <StudioModal title="Program">
      <TitlePage {...props} />
    </StudioModal>
  );
}
