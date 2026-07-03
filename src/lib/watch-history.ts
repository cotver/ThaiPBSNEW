export const watchHistoryCookieName = "thaipbs_watch_history";
export const watchHistoryLimit = 24;

export function parseWatchHistoryCookie(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(value));

    return Array.isArray(parsed)
      ? parsed
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, watchHistoryLimit)
      : [];
  } catch {
    return [];
  }
}

export function serializeWatchHistory(slugs: string[]) {
  return encodeURIComponent(JSON.stringify(slugs.slice(0, watchHistoryLimit)));
}
