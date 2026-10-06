import CategoryPage from "@/app/(site)/category/[slug]/page";
import { StudioModal } from "@/components/studio/StudioModal";

export const dynamic = "force-dynamic";

/** Opened from the Studio Lot: the same page, over the gallery. */
export default function CategoryPageModal(props: Parameters<typeof CategoryPage>[0]) {
  return (
    <StudioModal title="Category" variant="site">
      <CategoryPage {...props} />
    </StudioModal>
  );
}
