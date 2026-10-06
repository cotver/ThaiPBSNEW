import BrowsePage from "@/app/(site)/browse/page";
import { StudioModal } from "@/components/studio/StudioModal";

export const dynamic = "force-dynamic";

/** Opened from the Studio Lot: the same page, over the gallery. */
export default function BrowsePageModal(props: Parameters<typeof BrowsePage>[0]) {
  return (
    <StudioModal title="Browse" variant="site">
      <BrowsePage {...props} />
    </StudioModal>
  );
}
