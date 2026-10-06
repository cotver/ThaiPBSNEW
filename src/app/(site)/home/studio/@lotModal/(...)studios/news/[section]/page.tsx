import StudiosNewsPage from "@/app/(site)/studios/news/[section]/page";
import { StudioModal } from "@/components/studio/StudioModal";

export const dynamic = "force-dynamic";

/** Opened from the Studio Lot: the same page, over the gallery. */
export default function StudiosNewsPageModal(props: Parameters<typeof StudiosNewsPage>[0]) {
  return (
    <StudioModal title="Studios News" variant="site">
      <StudiosNewsPage {...props} />
    </StudioModal>
  );
}
