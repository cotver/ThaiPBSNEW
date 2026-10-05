import { redirect } from "next/navigation";
import { lotGalleryHref } from "@/lib/studio/data";

/** The gallery itself is a view of /home; /home/studio only holds its pages. */
export default function StudioLotIndex() {
  redirect(lotGalleryHref);
}
