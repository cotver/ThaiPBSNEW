import { ViewTransition } from "react";
import { CinematicLoading } from "@/components/cinema/CinematicLoading";

/** Shown while a page loads; fades out as the page arrives. */
export default function SiteLoading() {
  return (
    <ViewTransition default="none" exit="cine-loading-out">
      <CinematicLoading />
    </ViewTransition>
  );
}
