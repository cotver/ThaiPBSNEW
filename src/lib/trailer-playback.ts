import type { Title } from "@/lib/content";

export async function playVideoWithSoundFallback(
  video: HTMLVideoElement,
  muted: boolean,
  onMutedFallback: () => void,
): Promise<boolean> {
  video.muted = muted;
  video.volume = muted ? 0 : 1;

  try {
    await video.play();
    return true;
  } catch {
    if (muted) return false;

    video.muted = true;
    video.volume = 0;
    onMutedFallback();

    try {
      await video.play();
      return true;
    } catch {
      return false;
    }
  }
}

export function isGifMedia(mimeType: string | undefined, rawUrl: string): boolean {
  if (mimeType?.trim().toLowerCase() === 'image/gif') return true;

  try {
    return new URL(rawUrl, 'http://localhost').pathname.toLowerCase().endsWith('.gif');
  } catch {
    return rawUrl.split(/[?#]/, 1)[0]?.toLowerCase().endsWith('.gif') ?? false;
  }
}

export function toYouTubeEmbedUrl(rawUrl: string): string | null {
  const input = rawUrl.trim();
  if (!input) return null;

  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    let id: string | null = null;

    if (host === "youtu.be") {
      id = url.pathname.replace(/^\/+/, "").split("/")[0] || null;
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname.startsWith("/watch")) id = url.searchParams.get("v");
      else if (url.pathname.startsWith("/embed/")) id = url.pathname.split("/")[2] || null;
      else if (url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2] || null;
    }

    return id && /^[A-Za-z0-9_-]{6,}$/.test(id)
      ? `https://www.youtube-nocookie.com/embed/${id}`
      : null;
  } catch {
    return null;
  }
}

export function isInternalVideoUrl(rawUrl: string): boolean {
  const input = rawUrl.trim();
  if (!input) return false;
  if (input.startsWith("/api/videos/file") || input.startsWith("/api/airflow/video")) return true;

  try {
    const url = new URL(input);
    return url.pathname.startsWith("/api/videos/file") || url.pathname.startsWith("/api/airflow/video");
  } catch {
    return false;
  }
}

/**
 * The trailer /home's HeroCarousel plays for a hero: its own video when it is a direct video (StudiosHero),
 * otherwise only programs have one — the program's trailer, else the latest season's.
 */
export function getHeroTrailerSource(
  title: (Pick<Title, "source" | "trailerUrl" | "trailerMimeType" | "seasons"> & { directVideo?: boolean }) | undefined,
): { mimeType?: string; url: string } {
  if (title?.directVideo && title.trailerUrl) {
    return { mimeType: title.trailerMimeType, url: title.trailerUrl };
  }
  if (!title || title.source !== "program") {
    return { url: "" };
  }

  if (title.trailerUrl) {
    return { mimeType: title.trailerMimeType, url: title.trailerUrl };
  }

  const seasonsWithTrailer = title.seasons?.filter((season) => season.trailerUrl) ?? [];
  const numberedSeasons = seasonsWithTrailer.filter((season) => typeof season.seasonNumber === "number");
  const latestSeasonTrailer =
    numberedSeasons.length > 0
      ? numberedSeasons.reduce((latest, season) =>
          (season.seasonNumber ?? Number.NEGATIVE_INFINITY) >
          (latest.seasonNumber ?? Number.NEGATIVE_INFINITY)
            ? season
            : latest,
        )
      : seasonsWithTrailer[seasonsWithTrailer.length - 1];
  const firstSeasonTrailer = seasonsWithTrailer[0];
  const seasonTrailer = latestSeasonTrailer ?? firstSeasonTrailer;

  return { mimeType: seasonTrailer?.trailerMimeType, url: seasonTrailer?.trailerUrl ?? "" };
}

export type TrailerKind = "gif" | "youtube" | "video" | "external";

/**
 * How /home's HeroCarousel plays a trailer: a GIF over the art, a YouTube embed, a video file (Thai PBS
 * video URLs, or any URL for a direct video), or — for anything else — a button that opens it.
 */
export function trailerKind(url: string | undefined, mimeType?: string, direct = false): TrailerKind | null {
  if (!url?.trim()) return null;
  if (isGifMedia(mimeType, url)) return "gif";
  if (toYouTubeEmbedUrl(url)) return "youtube";
  if (direct || isInternalVideoUrl(url)) return "video";
  return "external";
}
