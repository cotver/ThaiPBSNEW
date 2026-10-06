import { CinematicLoading } from "@/components/cinema/CinematicLoading";
import { StudioModal } from "@/components/studio/StudioModal";

/**
 * A page on its way: the modal opens at once and loads inside, over the gallery. Without this, the nearest
 * boundary would be the studio's full-screen loading screen, covering the gallery.
 */
export default function LotModalLoading() {
  return (
    <StudioModal title="Loading">
      <CinematicLoading />
    </StudioModal>
  );
}
