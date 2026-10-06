import SearchPage from "@/app/(site)/search/page";
import { StudioModal } from "@/components/studio/StudioModal";

export const dynamic = "force-dynamic";

/** Opened from the Studio Lot: the same page, over the gallery. */
export default function SearchPageModal(props: Parameters<typeof SearchPage>[0]) {
  return (
    <StudioModal title="Search" variant="site">
      <SearchPage {...props} />
    </StudioModal>
  );
}
