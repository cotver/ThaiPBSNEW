import StudiosCategoryPage from "@/app/(site)/studios/[slug]/page";
import { StudioModal } from "@/components/studio/StudioModal";

export const dynamic = "force-dynamic";

/** Opened from the Studio Lot: the same page, over the gallery. */
export default function StudiosCategoryPageModal(props: Parameters<typeof StudiosCategoryPage>[0]) {
  return (
    <StudioModal title="Studios" variant="site">
      <StudiosCategoryPage {...props} />
    </StudioModal>
  );
}
