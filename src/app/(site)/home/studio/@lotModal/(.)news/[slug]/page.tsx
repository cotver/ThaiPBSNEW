import LotArticlePage from "@/app/(site)/home/studio/news/[slug]/page";
import { StudioModal } from "@/components/studio/StudioModal";

export const dynamic = "force-dynamic";

/** Opened from the Studio Lot: the same page, over the gallery. */
export default function LotArticlePageModal(props: Parameters<typeof LotArticlePage>[0]) {
  return (
    <StudioModal title="Story">
      <LotArticlePage {...props} />
    </StudioModal>
  );
}
