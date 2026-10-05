"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useSyncExternalStore } from "react";
import { parseSavedTitlesCookie, savedTitlesCookieName, savedTitlesLimit, serializeSavedTitles } from "@/lib/saved-titles";
import { cue } from "@/lib/studio/sound";
import pages from "@/components/studio/pages.module.css";

// Same cookie and event as the main site's SaveForLaterButton, so both stay in sync.
const savedTitlesChangedEvent = "thaipbs:saved-titles-changed";

function readSaved() {
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${savedTitlesCookieName}=`))
    ?.slice(savedTitlesCookieName.length + 1);
  return parseSavedTitlesCookie(value);
}

export function ShortlistButton({ slug, title, initiallySaved, variant = "primary" }: { slug: string; title: string; initiallySaved: boolean; variant?: "primary" | "remove" }) {
  const router = useRouter();
  const [pulse, setPulse] = useState(0);
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener(savedTitlesChangedEvent, onChange);
    return () => window.removeEventListener(savedTitlesChangedEvent, onChange);
  }, []);
  const saved = useSyncExternalStore(subscribe, () => readSaved().includes(slug), () => initiallySaved);

  const toggle = () => {
    const current = readSaved();
    const next = saved ? current.filter((value) => value !== slug) : [slug, ...current.filter((value) => value !== slug)].slice(0, savedTitlesLimit);
    document.cookie = `${savedTitlesCookieName}=${serializeSavedTitles(next)}; path=/; max-age=15552000; samesite=lax`;
    setPulse((value) => value + 1);
    cue(saved ? "back" : "select");
    window.dispatchEvent(new Event(savedTitlesChangedEvent));
    router.refresh();
  };

  if (variant === "remove") {
    return (
      <button aria-label={`Remove ${title} from shortlist`} className={pages.removeButton} data-cursor="Remove" onClick={toggle} type="button">
        {saved ? "Remove" : "Removed — undo"}
      </button>
    );
  }

  return (
    <button aria-pressed={saved} className={pages.saveButton} data-cursor={saved ? "Remove from shortlist" : "Add to shortlist"} data-saved={saved || undefined} onClick={toggle} type="button">
      <span aria-hidden="true" className={pages.saveIcon} key={pulse}>
        {saved ? "✓" : "+"}
      </span>
      {saved ? "On your shortlist" : "Add to shortlist"}
    </button>
  );
}
