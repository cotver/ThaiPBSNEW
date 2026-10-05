"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Title } from "@/lib/content";
import { parseSavedTitlesCookie, savedTitlesCookieName, savedTitlesLimit, serializeSavedTitles } from "@/lib/saved-titles";

function readSavedTitles() {
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${savedTitlesCookieName}=`))
    ?.slice(savedTitlesCookieName.length + 1);
  return parseSavedTitlesCookie(value);
}

export function FinalSaveButton({ title }: { title: Title }) {
  const router = useRouter();
  const [saved, setSaved] = useState(Boolean(title.inWatchlist));

  useEffect(() => {
    const timer = window.setTimeout(() => setSaved(readSavedTitles().includes(title.slug)), 0);
    return () => window.clearTimeout(timer);
  }, [title.slug]);

  return (
    <button
      aria-label={`${saved ? "Remove" : "Save"} ${title.title} ${saved ? "from" : "to"} watchlist`}
      aria-pressed={saved}
      className="final-hero__save"
      onClick={() => {
        const current = readSavedTitles();
        const next = saved
          ? current.filter((slug) => slug !== title.slug)
          : [title.slug, ...current.filter((slug) => slug !== title.slug)].slice(0, savedTitlesLimit);
        document.cookie = `${savedTitlesCookieName}=${serializeSavedTitles(next)}; path=/; max-age=15552000; samesite=lax`;
        setSaved(!saved);
        router.refresh();
      }}
      type="button"
    >
      {saved ? "✓" : "+"}
    </button>
  );
}
