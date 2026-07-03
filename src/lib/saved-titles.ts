export const savedTitlesCookieName = "thaipbs_saved_titles";
export const savedTitlesLimit = 100;

export function parseSavedTitlesCookie(value: string | undefined): string[] {
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
          .slice(0, savedTitlesLimit)
      : [];
  } catch {
    return [];
  }
}

export function serializeSavedTitles(slugs: string[]) {
  return encodeURIComponent(JSON.stringify(slugs.slice(0, savedTitlesLimit)));
}
