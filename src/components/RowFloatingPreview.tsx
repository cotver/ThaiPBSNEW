"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { titleEyebrow, titleHref, titleInlineText, type Title } from "@/lib/content";
import { DiscontinuedBadge } from "./DiscontinuedBadge";
import { SaveForLaterButton } from "./SaveForLaterButton";

export type ActivePreview = {
  anchorHeight: number;
  anchorWidth: number;
  safeLeft: number;
  safeRight: number;
  left: number;
  originX: string;
  title: Title;
  top: number;
  width: number;
};

export function RowFloatingPreview({
  active,
  matchSourceTitles,
  onClose,
  onEnter,
  onOpenTitle,
  onRemoveTitle,
}: {
  active: ActivePreview;
  matchSourceTitles?: Title[];
  onClose: () => void;
  onEnter: () => void;
  onOpenTitle: (title: Title) => void;
  onRemoveTitle?: (title: Title) => void;
}) {
  const { title } = active;
  const imageSrc = title.heroImage || title.posterImage;
  const previewScaleX = Math.max(0.72, Math.min(1, active.anchorWidth / active.width));
  const matchPercent = calculateTitleMatch(title, matchSourceTitles ?? []);
  const displayTitle = titleInlineText(title);
  const trailerSource = getHoverTrailerSource(title);
  const trailerUrl = trailerSource.url;
  const trailerMimeType = trailerSource.mimeType;

  return (
    <div className="pointer-events-none absolute inset-0 z-[80] overflow-visible">
      <div
        className="pointer-events-auto absolute overflow-hidden rounded-[8px] bg-[#111827] text-white opacity-0 shadow-[0_26px_72px_rgba(0,0,0,0.72)] ring-1 ring-white/14 animate-[previewFloatIn_240ms_cubic-bezier(0.16,1,0.3,1)_forwards]"
        data-hover-preview-panel
        onMouseEnter={onEnter}
        onMouseLeave={onClose}
        style={{
          ["--preview-origin-x" as string]: active.originX,
          ["--preview-scale-x" as string]: previewScaleX,
          ["--preview-scale-y" as string]: 0.78,
          maxWidth: Math.max(active.anchorWidth, active.safeRight - active.safeLeft),
          left: active.left,
          top: active.top,
          transformOrigin: `${active.originX} 0%`,
          width: active.width,
        }}
      >
        {onRemoveTitle ? (
          <button
            aria-label={`Remove ${title.title} from Continue Watching`}
            className="absolute right-3 top-3 z-30 grid size-10 place-items-center rounded-full border border-white/18 bg-black/62 text-white/86 shadow-lg shadow-black/35 backdrop-blur transition hover:bg-white hover:text-[#030714] focus-visible:ring-2 focus-visible:ring-cyan-200"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRemoveTitle(title);
            }}
            type="button"
          >
            <EraserIcon />
          </button>
        ) : null}
        <div
          aria-label={`Open details for ${title.title}`}
          className="block w-full cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
          onClick={() => onOpenTitle(title)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpenTitle(title);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className={`relative aspect-video bg-gradient-to-br ${title.tone}`}>
            <HoverTrailerMedia
              imageSrc={imageSrc}
              isDiscontinued={Boolean(title.isDiscontinued)}
              tone={title.tone}
              trailerMimeType={trailerMimeType}
              trailerUrl={trailerUrl}
              width={active.width}
            />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(17,24,39,0.58),transparent_54%),radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.20),transparent_24%)]" />
            {title.isDiscontinued ? (
              <DiscontinuedBadge className="absolute left-4 top-4 z-10" />
            ) : null}
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/90">
                {titleEyebrow(title)}
              </p>
              <h3 className="mt-1 line-clamp-1 text-xl font-black leading-tight">{displayTitle}</h3>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <button
              aria-label={`Play ${title.title}`}
              className="grid size-10 place-items-center rounded-full bg-white text-[#030714] transition hover:scale-105 hover:bg-cyan-100"
              onClick={() => onOpenTitle(title)}
              type="button"
            >
              <PlayIcon />
            </button>
            <Link
              aria-label={`Open ${title.title} page`}
              className="grid size-10 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
              href={titleHref(title.slug)}
            >
              <InfoIcon />
            </Link>
            <SaveForLaterButton
              className="ml-auto grid size-10 place-items-center rounded-full border border-white/20 bg-white/10 text-2xl font-light text-white transition hover:bg-white/20"
              savedClassName="ml-auto grid size-10 place-items-center rounded-full border border-cyan-200/40 bg-cyan-200 text-lg font-black text-[#030714] transition hover:bg-white"
              title={title}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-bold text-white/66">
            {title.isDiscontinued ? <span className="text-red-200">Discontinued</span> : null}
            {matchPercent ? <span className="text-emerald-300">{matchPercent}% Match</span> : null}
            <span className="rounded border border-white/24 px-1.5 py-px text-[10px] text-white/84">
              {title.rating}
            </span>
            <span>{title.year}</span>
            <span>{title.duration}</span>
          </div>
          <p className="line-clamp-3 text-[13px] leading-5 text-white/72">{title.description}</p>
          <p className="line-clamp-1 text-[12px] font-semibold text-white/45">
            {title.type} | {title.genre}
          </p>
        </div>
      </div>
    </div>
  );
}

function toYouTubeEmbedUrl(rawUrl: string): string | null {
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

function isInternalVideoUrl(rawUrl: string): boolean {
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

function getHoverTrailerSource(title: Title): { mimeType?: string; url: string } {
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
  const seasonTrailer = latestSeasonTrailer ?? seasonsWithTrailer[0];

  return { mimeType: seasonTrailer?.trailerMimeType, url: seasonTrailer?.trailerUrl ?? "" };
}

function HoverTrailerMedia({
  imageSrc,
  isDiscontinued,
  tone,
  trailerMimeType,
  trailerUrl,
  width,
}: {
  imageSrc?: string;
  isDiscontinued: boolean;
  tone: string;
  trailerMimeType?: string;
  trailerUrl: string;
  width: number;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [mediaState, setMediaState] = useState({ ended: false, failed: false, ready: false, url: "" });
  const [mutedState, setMutedState] = useState({ muted: true, url: "" });
  const trailerEmbedUrl = trailerUrl ? toYouTubeEmbedUrl(trailerUrl) : null;
  const trailerIsInternal = trailerUrl ? isInternalVideoUrl(trailerUrl) : false;
  const isGifTrailer = trailerMimeType === "image/gif";
  const stateMatches = mediaState.url === trailerUrl;
  const trailerReady = stateMatches ? mediaState.ready : false;
  const trailerEnded = stateMatches ? mediaState.ended : false;
  const trailerFailed = stateMatches ? mediaState.failed : false;
  const muted = mutedState.url === trailerUrl ? mutedState.muted : true;
  const showInlineTrailer =
    Boolean(trailerUrl) &&
    !trailerEnded &&
    (isGifTrailer || Boolean(trailerEmbedUrl) || (trailerIsInternal && !trailerFailed)) &&
    trailerReady;
  const imageClassName = isDiscontinued ? "object-cover grayscale" : "object-cover";
  const mediaClassName = isDiscontinued
    ? "absolute inset-0 h-full w-full object-cover object-center grayscale"
    : "absolute inset-0 h-full w-full object-cover object-center";

  const markReady = useCallback(() => {
    setMediaState((state) => ({ ...state, failed: false, ready: true, url: trailerUrl }));
  }, [trailerUrl]);

  const postIframeCommand = useCallback((func: string, args: unknown[] = []) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    try {
      iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func, args }), "*");
    } catch {}
  }, []);

  const applyMuted = useCallback(
    (nextMuted: boolean) => {
      const video = videoRef.current;
      if (video) {
        video.muted = nextMuted;
        video.volume = nextMuted ? 0 : 1;
        video.play().catch(() => {});
      }

      postIframeCommand(nextMuted ? "mute" : "unMute");
      if (!nextMuted) {
        postIframeCommand("setVolume", [100]);
        postIframeCommand("playVideo");
      }
    },
    [postIframeCommand],
  );

  useEffect(() => {
    if (!trailerIsInternal || !trailerUrl || trailerFailed || trailerEnded) return;
    const video = videoRef.current;
    if (!video) return;

    video.muted = muted;
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) markReady();

    video.play().then(markReady).catch(() => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) markReady();
    });
  }, [markReady, muted, trailerEnded, trailerFailed, trailerIsInternal, trailerUrl]);

  useEffect(() => {
    if (!trailerEmbedUrl || trailerEnded) return;
    applyMuted(muted);
  }, [applyMuted, muted, trailerEmbedUrl, trailerEnded]);

  useEffect(() => {
    if (!trailerEmbedUrl || trailerEnded) return;
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    try {
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"] }),
        "*",
      );
    } catch {}

    function onMessage(event: MessageEvent) {
      const origin = event.origin.toLowerCase();
      if (!origin.includes("youtube")) return;

      let payload: unknown = event.data;
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload) as unknown;
        } catch {
          return;
        }
      }

      if (
        payload &&
        typeof payload === "object" &&
        "event" in payload &&
        "info" in payload &&
        payload.event === "onStateChange" &&
        payload.info === 0
      ) {
        setMediaState((state) => ({ ...state, ended: true, url: trailerUrl }));
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [trailerEmbedUrl, trailerEnded, trailerUrl]);

  return (
    <>
      {trailerEmbedUrl && !trailerEnded ? (
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full ${
            showInlineTrailer ? "opacity-100" : "opacity-0"
          } transition-opacity duration-500 ease-out`}
          onLoad={markReady}
          ref={iframeRef}
          referrerPolicy="strict-origin-when-cross-origin"
          src={`${trailerEmbedUrl}?autoplay=1&mute=1&playsinline=1&rel=0&controls=0&modestbranding=1&enablejsapi=1`}
          title="Trailer preview"
        />
      ) : trailerIsInternal && trailerUrl && !trailerFailed && !trailerEnded ? (
        <video
          aria-hidden="true"
          autoPlay
          className={`${mediaClassName} ${
            showInlineTrailer ? "opacity-100" : "opacity-0"
          } transition-opacity duration-500 ease-out`}
          disablePictureInPicture
          disableRemotePlayback
          draggable={false}
          muted={muted}
          onCanPlay={markReady}
          onContextMenu={(event) => event.preventDefault()}
          onEnded={() => setMediaState((state) => ({ ...state, ended: true, url: trailerUrl }))}
          onError={() => {
            videoRef.current?.pause();
            setMediaState((state) => ({ ...state, failed: true, ready: false, url: trailerUrl }));
          }}
          onLoadedData={() => {
            markReady();
            videoRef.current?.play().catch(() => {});
          }}
          onPlaying={markReady}
          playsInline
          poster={imageSrc}
          preload="auto"
          ref={videoRef}
          src={trailerUrl}
        />
      ) : isGifTrailer && trailerUrl && !trailerEnded ? (
        <Image
          alt=""
          className={`${mediaClassName} ${
            showInlineTrailer ? "opacity-100" : "opacity-0"
          } transition-opacity duration-500 ease-out`}
          fill
          onLoad={markReady}
          sizes={`${Math.ceil(width)}px`}
          src={trailerUrl}
        />
      ) : null}

      <div
        className={`absolute inset-0 ${
          showInlineTrailer ? "pointer-events-none opacity-0" : "opacity-100"
        } transition-opacity duration-500 ease-out`}
      >
        {imageSrc ? (
          <Image alt="" className={imageClassName} fill sizes={`${Math.ceil(width)}px`} src={imageSrc} />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${tone}`} />
        )}
      </div>
      {showInlineTrailer && !isGifTrailer ? (
        <button
          aria-label={muted ? "Unmute trailer" : "Mute trailer"}
          className="absolute bottom-2 right-2 z-20 grid size-8 place-items-center rounded-full bg-black/58 text-white ring-1 ring-white/16 transition hover:bg-black/74"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const nextMuted = !muted;
            setMutedState({ muted: nextMuted, url: trailerUrl });
            applyMuted(nextMuted);
          }}
          title={muted ? "Unmute" : "Mute"}
          type="button"
        >
          {muted ? <MutedIcon /> : <VolumeIcon />}
        </button>
      ) : null}
    </>
  );
}

function calculateTitleMatch(title: Title, sourceTitles: Title[]) {
  const profile = buildPreferenceProfile(sourceTitles.filter((sourceTitle) => sourceTitle.slug !== title.slug));
  if (!profile) return null;

  const genreScore = scoreTokens(normalizeGenreTokens(title.genre), profile.genres);
  const categoryScore = scoreTokens(
    normalizeTokens([...(title.categoryNames ?? []), ...(title.categorySlugs ?? [])]),
    profile.categories,
  );
  const typeSlugScore = scoreTokens(normalizeTokens(title.typeSlugs ?? []), profile.typeSlugs);
  const typeScore = profile.types.get(normalizeToken(title.type)) ?? 0;
  const flagScore = scoreTokens(getTitleFlags(title), profile.flags);
  const weightedScore = genreScore * 34 + categoryScore * 26 + typeScore * 22 + typeSlugScore * 12 + flagScore * 6;

  if (weightedScore < 24) return null;
  return Math.round(clamp(62 + weightedScore * 0.37, 70, 99));
}

function buildPreferenceProfile(sourceTitles: Title[]) {
  const titles = sourceTitles.filter((title) => !title.isDiscontinued);
  if (titles.length === 0) return null;

  return {
    categories: buildTokenWeights(
      titles.flatMap((title) =>
        normalizeTokens([...(title.categoryNames ?? []), ...(title.categorySlugs ?? [])]),
      ),
    ),
    flags: buildTokenWeights(titles.flatMap(getTitleFlags)),
    genres: buildTokenWeights(titles.flatMap((title) => normalizeGenreTokens(title.genre))),
    types: buildTokenWeights(titles.map((title) => normalizeToken(title.type)).filter(Boolean)),
    typeSlugs: buildTokenWeights(titles.flatMap((title) => normalizeTokens(title.typeSlugs ?? []))),
  };
}

function buildTokenWeights(tokens: string[]) {
  const weights = new Map<string, number>();
  const cleanTokens = tokens.filter(Boolean);
  if (cleanTokens.length === 0) return weights;

  for (const token of cleanTokens) weights.set(token, (weights.get(token) ?? 0) + 1);
  for (const [token, count] of weights) weights.set(token, count / cleanTokens.length);
  return weights;
}

function scoreTokens(tokens: string[], weights: Map<string, number>) {
  if (tokens.length === 0 || weights.size === 0) return 0;
  return Math.min(1, tokens.reduce((score, token) => score + (weights.get(token) ?? 0), 0));
}

function normalizeGenreTokens(genre: string) {
  return normalizeTokens(genre.split(/[,/&|]+/));
}

function normalizeTokens(values: string[]) {
  return values.map(normalizeToken).filter(Boolean);
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getTitleFlags(title: Title) {
  return [
    title.featured ? "featured" : "",
    title.inWatchlist ? "watchlist" : "",
    title.isContinue ? "continue" : "",
    title.isGlobalProgram ? "global" : "",
    title.isNew ? "new" : "",
    title.source ? `source:${title.source}` : "",
  ].filter(Boolean);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5.14v13.72c0 .7.77 1.12 1.36.74l10.78-6.86a.88.88 0 0 0 0-1.48L9.36 4.4A.88.88 0 0 0 8 5.14Z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <path d="M12 7h.01" />
    </svg>
  );
}

function EraserIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
      <path d="m7 21-4-4L14.5 5.5a2.8 2.8 0 0 1 4 0 2.8 2.8 0 0 1 0 4L7 21Z" />
      <path d="m12 8 4 4" />
      <path d="M7 21h14" />
    </svg>
  );
}

function MutedIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.1" viewBox="0 0 24 24">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m17 9 4 6" />
      <path d="m21 9-4 6" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.1" viewBox="0 0 24 24">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a4 4 0 0 1 0 7" />
      <path d="M18 6a7 7 0 0 1 0 12" />
    </svg>
  );
}
