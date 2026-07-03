"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Title } from "@/lib/content";
import {
  parseSavedTitlesCookie,
  savedTitlesCookieName,
  savedTitlesLimit,
  serializeSavedTitles,
} from "@/lib/saved-titles";

const savedTitlesChangedEvent = "thaipbs:saved-titles-changed";

function readSavedSlugs() {
  if (typeof document === "undefined") {
    return [];
  }

  const cookieValue = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${savedTitlesCookieName}=`))
    ?.slice(savedTitlesCookieName.length + 1);

  return parseSavedTitlesCookie(cookieValue);
}

export function SaveForLaterButton({
  className,
  savedClassName,
  title,
}: {
  className: string;
  savedClassName?: string;
  title: Title;
}) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(Boolean(title.inWatchlist));

  const syncSavedState = useCallback(() => {
    setIsSaved(readSavedSlugs().includes(title.slug));
  }, [title.slug]);

  useEffect(() => {
    syncSavedState();
    window.addEventListener(savedTitlesChangedEvent, syncSavedState);

    return () => {
      window.removeEventListener(savedTitlesChangedEvent, syncSavedState);
    };
  }, [syncSavedState]);

  return (
    <button
      aria-label={`${isSaved ? "Remove" : "Save"} ${title.title} ${isSaved ? "from" : "to"} watchlist`}
      aria-pressed={isSaved}
      className={isSaved && savedClassName ? savedClassName : className}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();

        const currentSlugs = readSavedSlugs();
        const nextSlugs = isSaved
          ? currentSlugs.filter((slug) => slug !== title.slug)
          : [title.slug, ...currentSlugs.filter((slug) => slug !== title.slug)].slice(0, savedTitlesLimit);

        document.cookie = `${savedTitlesCookieName}=${serializeSavedTitles(nextSlugs)}; path=/; max-age=15552000; samesite=lax`;
        setIsSaved(!isSaved);
        window.dispatchEvent(new Event(savedTitlesChangedEvent));
        router.refresh();
      }}
      type="button"
    >
      {isSaved ? "✓" : "+"}
    </button>
  );
}
