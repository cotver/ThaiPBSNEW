"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DiscontinuedBadge } from "@/components/DiscontinuedBadge";
import { SaveForLaterButton } from "@/components/SaveForLaterButton";
import { TitleDetails } from "@/components/TitleDetails";
import { titleDisplayLines, titleEyebrow, titleHref, type Title } from "@/lib/content";

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
    return (
      typeof window !== "undefined" &&
      url.origin === window.location.origin &&
      (url.pathname.startsWith("/api/videos/file") || url.pathname.startsWith("/api/airflow/video"))
    );
  } catch {
    return false;
  }
}

function getLatestSeasonTrailer(seasons: NonNullable<Title["seasons"]>) {
  const seasonsWithTrailer = seasons.filter((season) => season.trailerUrl);
  const numberedSeasons = seasonsWithTrailer.filter((season) => typeof season.seasonNumber === "number");

  if (numberedSeasons.length > 0) {
    return numberedSeasons.reduce((latest, season) =>
      (season.seasonNumber ?? Number.NEGATIVE_INFINITY) >
      (latest.seasonNumber ?? Number.NEGATIVE_INFINITY)
        ? season
        : latest,
    );
  }

  return seasonsWithTrailer[seasonsWithTrailer.length - 1];
}

export function TitlePageExperience({ title }: { title: Title }) {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const trailerIframeRef = useRef<HTMLIFrameElement | null>(null);
  const trailerVideoRef = useRef<HTMLVideoElement | null>(null);
  const seasons = useMemo(() => title.seasons ?? [], [title.seasons]);
  const [seasonSelection, setSeasonSelection] = useState({ slug: "", id: "" });
  const selectedSeasonId = seasonSelection.slug === title.slug ? seasonSelection.id : seasons[0]?.id ?? "";
  const selectedSeason = seasons.find((season) => season.id === selectedSeasonId) ?? seasons[0];
  const latestSeasonTrailer = getLatestSeasonTrailer(seasons);
  const firstSeasonTrailer = seasons.find((season) => season.trailerUrl);
  const fallbackSeasonTrailer = latestSeasonTrailer ?? firstSeasonTrailer;
  const activeTrailerUrl = selectedSeason?.trailerUrl || title.trailerUrl || fallbackSeasonTrailer?.trailerUrl || "";
  const [trailerPlayback, setTrailerPlayback] = useState({
    ended: false,
    failed: false,
    loaded: false,
    muted: true,
    url: "",
  });
  const trailerPlaybackMatches = trailerPlayback.url === activeTrailerUrl;
  const trailerEnded = trailerPlaybackMatches ? trailerPlayback.ended : false;
  const trailerFailed = trailerPlaybackMatches ? trailerPlayback.failed : false;
  const trailerLoaded = trailerPlaybackMatches ? trailerPlayback.loaded : false;
  const trailerMuted = trailerPlaybackMatches ? trailerPlayback.muted : true;
  const [heroInView, setHeroInView] = useState(true);

  const markTrailerLoaded = useCallback((url: string) => {
    setTrailerPlayback((playback) => ({
      ...playback,
      failed: false,
      loaded: true,
      url,
    }));
  }, []);

  const playTrailerVideo = useCallback(
    (force = false) => {
      const video = trailerVideoRef.current;
      if (!video) return;

      video.muted = trailerMuted;
      if (!force && (!heroInView || trailerEnded || trailerFailed)) {
        video.pause();
        return;
      }

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        markTrailerLoaded(activeTrailerUrl);
      }

      video.play()
        .then(() => markTrailerLoaded(activeTrailerUrl))
        .catch(() => {
          if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            markTrailerLoaded(activeTrailerUrl);
          }
        });
    },
    [activeTrailerUrl, heroInView, markTrailerLoaded, trailerEnded, trailerFailed, trailerMuted],
  );

  useEffect(() => {
    playTrailerVideo();
  }, [playTrailerVideo]);

  useEffect(() => {
    if (!activeTrailerUrl || !isInternalVideoUrl(activeTrailerUrl) || trailerFailed) return;

    const frame = window.requestAnimationFrame(() => playTrailerVideo(true));
    const timers = [
      window.setTimeout(() => playTrailerVideo(true), 250),
      window.setTimeout(() => playTrailerVideo(true), 900),
    ];

    function retryWhenActive() {
      if (document.hidden) return;
      playTrailerVideo(true);
    }

    window.addEventListener("focus", retryWhenActive);
    document.addEventListener("visibilitychange", retryWhenActive);

    return () => {
      window.cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("focus", retryWhenActive);
      document.removeEventListener("visibilitychange", retryWhenActive);
    };
  }, [activeTrailerUrl, playTrailerVideo, trailerFailed]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setHeroInView(entry.isIntersecting);
      },
      { threshold: [0, 0.01, 0.2, 0.5, 1] },
    );

    observer.observe(hero);

    return () => observer.disconnect();
  }, [title.slug]);

  useEffect(() => {
    const iframe = trailerIframeRef.current;
    if (!iframe?.contentWindow) return;

    try {
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: trailerMuted ? "mute" : "unMute", args: [] }),
        "*",
      );
      if (!trailerMuted) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "setVolume", args: [100] }),
          "*",
        );
      }
    } catch {}
  }, [activeTrailerUrl, trailerMuted]);

  useEffect(() => {
    if (trailerEnded) return;
    const iframe = trailerIframeRef.current;
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
        setTrailerPlayback((playback) => ({
          ...playback,
          ended: true,
          url: activeTrailerUrl,
        }));
      }
    }

    window.addEventListener("message", onMessage);

    return () => window.removeEventListener("message", onMessage);
  }, [activeTrailerUrl, trailerEnded]);

  const heroAsset = title.heroImage || title.posterImage;
  const effectiveTrailerUrl = selectedSeason?.trailerUrl || title.trailerUrl || fallbackSeasonTrailer?.trailerUrl;
  const effectiveTrailerMimeType = selectedSeason?.trailerUrl
    ? selectedSeason.trailerMimeType
    : title.trailerUrl
      ? title.trailerMimeType
      : fallbackSeasonTrailer?.trailerMimeType;
  const hasTrailer = title.source === "program" && Boolean(effectiveTrailerUrl);
  const trailerUrl = effectiveTrailerUrl ?? "";
  const trailerEmbedUrl = hasTrailer ? toYouTubeEmbedUrl(trailerUrl) : null;
  const trailerIsInternal = hasTrailer ? isInternalVideoUrl(trailerUrl) : false;
  const imageClassName = title.isDiscontinued ? "object-fill grayscale" : "object-fill";
  const isGifTrailer = effectiveTrailerMimeType === "image/gif";
  const hasInlineTrailer = hasTrailer && (isGifTrailer || Boolean(trailerEmbedUrl) || (trailerIsInternal && !trailerFailed));
  const keepTrailerMounted = hasInlineTrailer && !trailerEnded;
  const showInlineTrailer = keepTrailerMounted && trailerLoaded;
  const hasExternalTrailerFallback = hasTrailer && !isGifTrailer && !trailerEmbedUrl && !trailerIsInternal;
  const showImageFade = title.showHeroDetails !== false;
  const useFullImage = title.source === "heroImage" && title.showHeroDetails === false;
  const titleLines = titleDisplayLines(title);
  const meta = [title.year, title.rating, title.duration].filter(Boolean);

  return (
    <>
      <section ref={heroRef} className="relative h-[clamp(390px,56.25vw,100vh)] overflow-hidden bg-black text-white">
        <div className="absolute inset-0 bg-[#030714]">
          {trailerEmbedUrl && keepTrailerMounted ? (
            <iframe
              key={trailerEmbedUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              aria-hidden="true"
              className={`absolute inset-0 h-full w-full ${
                showInlineTrailer ? "opacity-100" : "opacity-0"
              } transition-opacity duration-700 ease-out`}
              onLoad={() => {
                setTrailerPlayback((playback) => ({
                  ...playback,
                  loaded: true,
                  url: trailerUrl,
                }));
              }}
              ref={trailerIframeRef}
              referrerPolicy="strict-origin-when-cross-origin"
              src={`${trailerEmbedUrl}?autoplay=1&mute=${trailerMuted ? 1 : 0}&playsinline=1&rel=0&enablejsapi=1`}
              title="Trailer player"
            />
          ) : keepTrailerMounted && isGifTrailer ? (
            <Image
              alt=""
              className={`absolute inset-0 h-full w-full object-cover object-center ${
                showInlineTrailer ? "opacity-100" : "opacity-0"
              } transition-opacity duration-700 ease-out`}
              fill
              onLoad={() => markTrailerLoaded(trailerUrl)}
              sizes="100vw"
              src={trailerUrl}
              unoptimized
            />
          ) : trailerIsInternal && trailerUrl && !trailerFailed ? (
            <video
              key={trailerUrl}
              aria-hidden="true"
              autoPlay={trailerMuted}
              className={`absolute inset-0 h-full w-full object-cover object-center ${
                showInlineTrailer ? "opacity-100" : "opacity-0"
              } transition-opacity duration-700 ease-out`}
              disablePictureInPicture
              disableRemotePlayback
              draggable={false}
              muted={trailerMuted}
              onContextMenu={(event) => event.preventDefault()}
              onEnded={() => {
                setTrailerPlayback((playback) => ({
                  ...playback,
                  ended: true,
                  url: trailerUrl,
                }));
              }}
              onError={() => {
                trailerVideoRef.current?.pause();
                setTrailerPlayback((playback) => ({
                  ...playback,
                  ended: true,
                  failed: true,
                  loaded: false,
                  url: trailerUrl,
                }));
              }}
              onLoadedData={() => {
                const video = trailerVideoRef.current;
                if (!video) return;
                video.muted = trailerMuted;
                markTrailerLoaded(trailerUrl);
                playTrailerVideo(true);
              }}
              onCanPlay={() => {
                markTrailerLoaded(trailerUrl);
                playTrailerVideo(true);
              }}
              onPlaying={() => {
                markTrailerLoaded(trailerUrl);
              }}
              onStalled={() => {
                setTrailerPlayback((playback) => ({
                  ...playback,
                  failed: true,
                  loaded: false,
                  url: trailerUrl,
                }));
              }}
              playsInline
              poster={heroAsset}
              preload="auto"
              ref={trailerVideoRef}
              src={trailerUrl}
            />
          ) : null}

          <div
            className={`absolute inset-0 ${
              showInlineTrailer ? "pointer-events-none opacity-0" : "opacity-100"
            } transition-opacity duration-700 ease-out`}
          >
            {heroAsset ? (
              <div className={useFullImage ? "absolute inset-0" : "absolute inset-0 flex items-start justify-end"}>
                <div className={useFullImage ? "absolute inset-0" : "relative aspect-video w-[min(100%,calc(100vh*16/9))] max-h-full"}>
                  <Image
                    alt=""
                    className={imageClassName}
                    fill
                    priority
                    sizes="100vw"
                    src={heroAsset}
                  />
                  {showImageFade && (
                    <>
                      <div className="absolute inset-y-0 left-0 w-[10%] bg-gradient-to-r from-[#030714] via-[#030714]/70 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 h-[20%] bg-gradient-to-t from-[#030714]/90 via-[#030714]/45 to-transparent" />
                    </>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className={`absolute inset-0 bg-gradient-to-br ${title.tone}`} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_28%,rgba(255,255,255,0.22),transparent_22%),radial-gradient(circle_at_55%_68%,rgba(34,211,238,0.18),transparent_28%)]" />
              </>
            )}
            {hasExternalTrailerFallback ? (
              <button
                className="absolute inset-0 z-10 flex items-center justify-center bg-black/35 text-white"
                onClick={() => window.open(trailerUrl, "_blank", "noopener,noreferrer")}
                type="button"
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-5 py-2.5 text-sm font-black uppercase text-[#030714] transition hover:bg-white">
                  <PlayIcon />
                  Trailer
                </span>
              </button>
            ) : null}
          </div>

          {showInlineTrailer && !isGifTrailer ? (
            <>
              <div
                aria-hidden
                className="absolute inset-0 z-[1]"
                onContextMenu={(event) => event.preventDefault()}
                onDragStart={(event) => event.preventDefault()}
              />
              <button
                aria-label={trailerMuted ? "Unmute trailer" : "Mute trailer"}
                className="absolute bottom-4 right-4 z-20 grid size-10 place-items-center rounded-full bg-black/55 text-white ring-1 ring-white/16 transition hover:bg-black/72"
                onClick={() => {
                  setTrailerPlayback((playback) => ({
                    ...playback,
                    muted: trailerPlaybackMatches ? !playback.muted : false,
                    url: trailerUrl,
                  }));
                  trailerVideoRef.current?.play().catch(() => {});
                }}
                title={trailerMuted ? "Unmute" : "Mute"}
                type="button"
              >
                {trailerMuted ? <MutedIcon /> : <VolumeIcon />}
              </button>
            </>
          ) : null}

          {title.showHeroDetails !== false ? (
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#030714_0%,rgba(3,7,20,0.96)_10%,rgba(3,7,20,0.7)_20%,rgba(3,7,20,0.22)_30%,transparent_78%)]" />
          ) : null}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-50 bg-gradient-to-t from-[#030714] via-[#030714]/40 to-transparent" />

        {title.showHeroDetails !== false ? (
          <div className="absolute bottom-8 left-5 z-10 max-w-2xl sm:bottom-10 sm:left-9">
            <p className="mb-3 text-xs font-black uppercase text-cyan-200">
              {titleEyebrow(title)}
            </p>
            {title.isDiscontinued ? (
              <DiscontinuedBadge className="mb-4" />
            ) : null}
            <h1 className="max-w-3xl text-4xl font-black leading-[0.98] sm:text-6xl">
              {titleLines.map((line) => (
                <span className="block" key={line}>
                  {line}
                </span>
              ))}
            </h1>
            {meta.length > 0 ? (
              <p className="mt-4 text-sm font-bold text-white/72">
                {meta.join(" | ")}
              </p>
            ) : null}
            {title.description ? (
              <p className="mt-5 max-w-md text-sm leading-7 text-white/74 sm:text-base">
                {title.description}
              </p>
            ) : null}
            {title.genre ? (
              <p className="mt-4 max-w-2xl text-xs font-bold uppercase text-white/58 sm:text-sm">
                {title.genre}
              </p>
            ) : null}
            {title.showHeroActions !== false ? (
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  className="inline-flex h-12 items-center gap-2 rounded-[6px] bg-white px-7 text-sm font-black uppercase text-[#030714] transition hover:bg-cyan-100"
                  href={titleHref(title.slug)}
                >
                  <PlayIcon />
                  Play
                </Link>
                <a
                  className="inline-flex h-12 items-center rounded-[6px] border border-white/16 bg-white/12 px-6 text-sm font-black uppercase text-white backdrop-blur transition hover:bg-white/20"
                  href="#episodes"
                >
                  Details
                </a>
                <SaveForLaterButton
                  className="grid size-12 place-items-center rounded-full border border-white/18 bg-black/35 text-2xl font-light transition hover:bg-white/18"
                  savedClassName="grid size-12 place-items-center rounded-full border border-cyan-200/40 bg-cyan-200 text-lg font-black text-[#030714] transition hover:bg-white"
                  title={title}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="relative z-10 scroll-mt-6 bg-[#030714] px-5 pb-16 pt-2 text-white sm:px-8 lg:px-10" id="episodes">
        <TitleDetails
          onSelectedSeasonChange={(id) => setSeasonSelection({ slug: title.slug, id })}
          selectedSeasonId={selectedSeason?.id ?? ""}
          title={title}
        />
      </section>
    </>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5.14v13.72c0 .7.77 1.12 1.36.74l10.78-6.86a.88.88 0 0 0 0-1.48L9.36 4.4A.88.88 0 0 0 8 5.14Z" />
    </svg>
  );
}

function MutedIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.1" viewBox="0 0 24 24">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m17 9 4 6" />
      <path d="m21 9-4 6" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.1" viewBox="0 0 24 24">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a4 4 0 0 1 0 7" />
      <path d="M18 6a7 7 0 0 1 0 12" />
    </svg>
  );
}
