"use client";

import { useSyncExternalStore } from "react";
import { getMorphImage, subscribeMorphImage } from "./morph-store";

/**
 * Letterbox bars close in on a shimmering title. While an article image morph is in flight, the clicked
 * image waits in the hero frame so it can carry on into the article's hero once that page arrives.
 */
export function CinematicLoading() {
  const morphImage = useSyncExternalStore(subscribeMorphImage, getMorphImage, () => null);

  return (
    <div aria-busy="true" aria-label="Loading" className="cine-loading" role="status">
      {morphImage ? (
        <span aria-hidden="true" className="cine-loading__frame" data-cine-morph-loading>
          {/* eslint-disable-next-line @next/next/no-img-element -- the already-loaded optimised URL, shown as-is */}
          <img alt="" src={morphImage} />
        </span>
      ) : null}
      <p aria-hidden="true" className="cine-loading__title">Thai PBS</p>
      <span aria-hidden="true" className="cine-loading__line" />
    </div>
  );
}
