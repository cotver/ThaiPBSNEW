import { ViewTransition } from "react";

/**
 * Templates remount on every navigation, so this boundary's enter/exit fire on each page change and
 * play the cinematic cut defined in cinematic.css. Initial loads and same-page updates don't animate.
 */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition default="none" enter="cine-page-in" exit="cine-page-out">
      <div data-cine-page>{children}</div>
    </ViewTransition>
  );
}
