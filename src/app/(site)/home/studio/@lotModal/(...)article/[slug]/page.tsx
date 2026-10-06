import ColumnArticlePage from "@/app/(site)/article/[slug]/page";
import { StudioModal } from "@/components/studio/StudioModal";

export const dynamic = "force-dynamic";

/** Opened from the Studio Lot: the same page, over the gallery. */
export default function ColumnArticlePageModal(props: Parameters<typeof ColumnArticlePage>[0]) {
  return (
    <StudioModal title="Story" variant="site">
      <ColumnArticlePage {...props} />
    </StudioModal>
  );
}
