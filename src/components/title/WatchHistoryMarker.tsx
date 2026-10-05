"use client";

import { useEffect } from "react";
import { serializeWatchHistory, watchHistoryCookieName, watchHistoryLimit } from "@/lib/watch-history";

export function WatchHistoryMarker({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) {
      return;
    }

    const cookieValue = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(`${watchHistoryCookieName}=`))
      ?.slice(watchHistoryCookieName.length + 1);
    let slugs: string[] = [];

    if (cookieValue) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookieValue));
        slugs = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
      } catch {
        slugs = [];
      }
    }

    const nextSlugs = [slug, ...slugs.filter((item) => item !== slug)].slice(0, watchHistoryLimit);
    document.cookie = `${watchHistoryCookieName}=${serializeWatchHistory(nextSlugs)}; path=/; max-age=15552000; samesite=lax`;
  }, [slug]);

  return null;
}
