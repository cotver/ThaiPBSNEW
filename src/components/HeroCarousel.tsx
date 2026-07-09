"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { titleDisplayLines, titleEyebrow, titleHref, type Title } from "@/lib/content";
import { SaveForLaterButton } from "./SaveForLaterButton";

const AUTO_SLIDE_MS = 6500;

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

function getHeroTrailerSource(title: Title | undefined): { mimeType?: string; url: string } {
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

export function HeroCarousel({ titles }: { titles: Title[] }) {
  const [active, setActive] = useState(0);
  const current = titles[active];
  const activeThumbRef = useRef<HTMLButtonElement | null>(null);
  const didDragRef = useRef(false);
  const dragStartScrollRef = useRef(0);
  const dragStartXRef = useRef(0);
  const heroRef = useRef<HTMLElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const trailerIframeRef = useRef<HTMLIFrameElement | null>(null);
  const trailerVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isDraggingThumbs, setIsDraggingThumbs] = useState(false);
  const [heroInView, setHeroInView] = useState(true);
  const [manualAdvanceKey, setManualAdvanceKey] = useState(0);
  const [trailerPlayback, setTrailerPlayback] = useState({
    ended: false,
    failed: false,
    loaded: false,
    muted: true,
    url: "",
  });
  const activeTrailerSource = getHeroTrailerSource(current);
  const activeTrailerUrl = activeTrailerSource.url;
  const activeTrailerEmbedUrl = activeTrailerUrl ? toYouTubeEmbedUrl(activeTrailerUrl) : null;
  const activeTrailerIsInternal = activeTrailerUrl ? isInternalVideoUrl(activeTrailerUrl) : false;
  const activeTrailerIsGif = activeTrailerSource.mimeType === "image/gif";
  const trailerPlaybackMatches = trailerPlayback.url === activeTrailerUrl;
  const trailerEnded = trailerPlaybackMatches ? trailerPlayback.ended : false;
  const trailerFailed = trailerPlaybackMatches ? trailerPlayback.failed : false;
  const trailerMuted = trailerPlaybackMatches ? trailerPlayback.muted : true;
  const activeHasInlineTrailer =
    Boolean(activeTrailerUrl) &&
    (activeTrailerIsGif || Boolean(activeTrailerEmbedUrl) || (activeTrailerIsInternal && !trailerFailed));

  const advanceHero = useCallback(() => {
    setActive((index) => (titles.length > 0 ? (index + 1) % titles.length : 0));
  }, [titles.length]);

  const selectHero = useCallback((index: number) => {
    setActive(index);
    setManualAdvanceKey((key) => key + 1);
  }, []);

  const markTrailerLoaded = useCallback((url: string) => {
    setTrailerPlayback((playback) => ({
      ...playback,
      failed: false,
      loaded: true,
      url,
    }));
  }, []);

  useEffect(() => {
    if (titles.length === 0 || !heroInView) {
      return;
    }

    if (activeHasInlineTrailer && !activeTrailerIsGif && !trailerEnded) {
      return;
    }

    const timer = window.setTimeout(advanceHero, AUTO_SLIDE_MS);

    return () => window.clearTimeout(timer);
  }, [active, activeHasInlineTrailer, activeTrailerIsGif, advanceHero, heroInView, manualAdvanceKey, titles.length, trailerEnded]);

  useEffect(() => {
    if (!activeTrailerUrl) {
      return;
    }

    const timer = window.setTimeout(() => {
      setTrailerPlayback((playback) => ({
        ended: false,
        failed: false,
        loaded: false,
        muted: playback.muted,
        url: activeTrailerUrl,
      }));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [active, activeTrailerUrl]);

  const playTrailerVideo = useCallback(
    () => {
      const video = trailerVideoRef.current;
      if (!video) return;

      video.muted = trailerMuted;
      if (!heroInView || trailerEnded || trailerFailed) {
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
    if (!activeTrailerUrl || !heroInView || !activeTrailerIsInternal || trailerFailed) return;

    const frame = window.requestAnimationFrame(() => playTrailerVideo());
    const timers = [
      window.setTimeout(() => playTrailerVideo(), 250),
      window.setTimeout(() => playTrailerVideo(), 900),
    ];

    function retryWhenActive() {
      if (document.hidden) return;
      playTrailerVideo();
    }

    window.addEventListener("focus", retryWhenActive);
    document.addEventListener("visibilitychange", retryWhenActive);

    return () => {
      window.cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("focus", retryWhenActive);
      document.removeEventListener("visibilitychange", retryWhenActive);
    };
  }, [activeTrailerIsInternal, activeTrailerUrl, heroInView, playTrailerVideo, trailerFailed]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setHeroInView(entry.isIntersecting && entry.intersectionRatio >= 0.5);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    observer.observe(hero);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const iframe = trailerIframeRef.current;
    if (!iframe?.contentWindow) return;

    try {
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: heroInView && !trailerEnded ? "playVideo" : "pauseVideo", args: [] }),
        "*",
      );
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
  }, [activeTrailerUrl, heroInView, trailerEnded, trailerMuted]);

  useEffect(() => {
    if (!activeTrailerUrl || trailerEnded) return;
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
        advanceHero();
      }
    }

    window.addEventListener("message", onMessage);

    return () => window.removeEventListener("message", onMessage);
  }, [activeTrailerUrl, advanceHero, trailerEnded]);

  useEffect(() => {
    const activeThumb = activeThumbRef.current;
    const rail = railRef.current;

    if (!activeThumb || !rail) {
      return;
    }

    const left = activeThumb.offsetLeft - (rail.clientWidth - activeThumb.clientWidth) / 2;

    rail.scrollTo({
      behavior: "smooth",
      left: Math.max(0, left),
    });
  }, [active]);

  function startThumbDrag(event: React.PointerEvent<HTMLDivElement>) {
    const rail = railRef.current;

    if (!rail || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }

    didDragRef.current = false;
    dragStartXRef.current = event.clientX;
    dragStartScrollRef.current = rail.scrollLeft;
    setIsDraggingThumbs(true);
  }

  function moveThumbDrag(event: React.PointerEvent<HTMLDivElement>) {
    const rail = railRef.current;

    if (!rail || !isDraggingThumbs) {
      return;
    }

    const delta = event.clientX - dragStartXRef.current;

    if (Math.abs(delta) > 5) {
      didDragRef.current = true;
    }

    rail.scrollLeft = dragStartScrollRef.current - delta;
  }

  function stopThumbDrag() {
    if (isDraggingThumbs) {
      setIsDraggingThumbs(false);
    }
  }

  function preventThumbClickAfterDrag(event: React.MouseEvent<HTMLDivElement>) {
    if (!didDragRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    didDragRef.current = false;
  }

  if (!current) {
    return (
      <section className="relative min-h-[560px] px-5 pb-24 sm:px-8 lg:min-h-[620px] lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_28%,rgba(255,255,255,0.12),transparent_24%),linear-gradient(135deg,#030714,#111827_48%,#0f766e)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#030714_0%,rgba(3,7,20,0.88)_54%,#030714_100%)]" />
        <div className="relative z-10 flex min-h-[440px] max-w-3xl flex-col justify-end lg:min-h-[500px]">
          <p className="mb-3 text-xs font-black uppercase text-cyan-200">Payload catalog</p>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.98] sm:text-6xl lg:text-7xl">
            No programs yet
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/74 sm:text-base">
            Add or publish programs in Payload CMS to show real homepage content here.
          </p>
        </div>
      </section>
    );
  }

  const currentIsDisabled = current.isDiscontinued;

  return (
    <section ref={heroRef} className="relative h-[clamp(620px,min(56.25vw,100vh),2160px)] overflow-hidden px-5 pb-24 sm:px-8 lg:px-10">
      {titles.map((title, index) => {
        const heroAsset = title.heroImage || title.posterImage;
        const mediaClassName = title.isDiscontinued ? "absolute inset-0 h-full w-full object-cover object-center grayscale" : "absolute inset-0 h-full w-full object-cover object-center";
        const imageClassName = title.isDiscontinued ? "object-fill grayscale" : "object-fill";
        const showImageFade = title.showHeroDetails !== false;
        const useFullImage = title.source === "heroImage" && title.showHeroDetails === false;
        const isActive = index === active;
        const trailerSource = getHeroTrailerSource(title);
        const trailerUrl = trailerSource.url;
        const trailerEmbedUrl = isActive && trailerUrl ? toYouTubeEmbedUrl(trailerUrl) : null;
        const trailerIsInternal = isActive && trailerUrl ? isInternalVideoUrl(trailerUrl) : false;
        const isGifTrailer = trailerSource.mimeType === "image/gif";
        const slidePlaybackMatches = isActive && trailerPlayback.url === trailerUrl;
        const slideTrailerLoaded = slidePlaybackMatches ? trailerPlayback.loaded : false;
        const slideTrailerEnded = slidePlaybackMatches ? trailerPlayback.ended : false;
        const slideTrailerFailed = slidePlaybackMatches ? trailerPlayback.failed : false;
        const keepTrailerMounted =
          isActive &&
          Boolean(trailerUrl) &&
          !slideTrailerEnded &&
          (isGifTrailer || Boolean(trailerEmbedUrl) || (trailerIsInternal && !slideTrailerFailed));
        const showInlineTrailer = keepTrailerMounted && heroInView && slideTrailerLoaded;
        const hasExternalTrailerFallback =
          isActive && Boolean(trailerUrl) && !isGifTrailer && !trailerEmbedUrl && !trailerIsInternal;

        return (
          <div
            aria-hidden={index !== active}
            className={`absolute inset-0 bg-[#030714] transition-opacity duration-700 ${
              index === active ? "opacity-100" : "opacity-0"
            }`}
            key={title.slug}
          >
            {trailerEmbedUrl && keepTrailerMounted ? (
              <iframe
                key={trailerEmbedUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                aria-hidden="true"
                className={`absolute inset-0 h-full w-full ${
                  showInlineTrailer ? "opacity-100" : "opacity-0"
                } transition-opacity duration-700 ease-out`}
                onLoad={() => markTrailerLoaded(trailerUrl)}
                ref={trailerIframeRef}
                referrerPolicy="strict-origin-when-cross-origin"
                src={`${trailerEmbedUrl}?autoplay=1&mute=${trailerMuted ? 1 : 0}&playsinline=1&rel=0&enablejsapi=1`}
                title="Trailer player"
              />
            ) : keepTrailerMounted && isGifTrailer ? (
              <Image
                alt=""
                className={`${mediaClassName} ${
                  showInlineTrailer ? "opacity-100" : "opacity-0"
                } transition-opacity duration-700 ease-out`}
                fill
                onLoad={() => markTrailerLoaded(trailerUrl)}
                sizes="100vw"
                src={trailerUrl}
              />
            ) : keepTrailerMounted && trailerIsInternal ? (
              <video
                key={trailerUrl}
                aria-hidden="true"
                autoPlay={trailerMuted}
                className={`${mediaClassName} ${
                  showInlineTrailer ? "opacity-100" : "opacity-0"
                } transition-opacity duration-700 ease-out`}
                disablePictureInPicture
                disableRemotePlayback
                draggable={false}
                muted={trailerMuted}
                onCanPlay={() => {
                  markTrailerLoaded(trailerUrl);
                  playTrailerVideo();
                }}
                onContextMenu={(event) => event.preventDefault()}
                onEnded={() => {
                  setTrailerPlayback((playback) => ({
                    ...playback,
                    ended: true,
                    url: trailerUrl,
                  }));
                  advanceHero();
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
                  playTrailerVideo();
                }}
                onPlaying={() => markTrailerLoaded(trailerUrl)}
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
                      priority={index === 0}
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
                  <span className="rounded-full bg-white/90 px-5 py-2.5 text-sm font-black uppercase text-[#030714] transition hover:bg-white">
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
            {title.showHeroDetails !== false && (
              <div className={`absolute inset-0 ${getHeroDetailShadowClass(title)}`} />
            )}
          </div>
        );
      })}
      <div className="absolute inset-x-0 bottom-0 h-50 bg-gradient-to-t from-[#030714] via-[#030714]/40 to-transparent" />

      {current.showHeroDetails !== false && (
        <div className="absolute bottom-20 left-5 z-10 max-w-3xl sm:left-8 lg:bottom-24 lg:left-10">
          <p className="mb-3 text-xs font-black uppercase text-cyan-200">
            {titleEyebrow(current)}
          </p>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.98] sm:text-6xl lg:text-7xl">
            {titleDisplayLines(current).map((line) => (
              <span className="block" key={line}>
                {line}
              </span>
            ))}
          </h1>
          {[current.year, current.rating, current.duration].filter(Boolean).length > 0 && (
            <p className="mt-4 text-sm font-bold text-white/72">
              {[current.year, current.rating, current.duration].filter(Boolean).join(" | ")}
            </p>
          )}
          {current.description && (
            <p className="mt-5 max-w-md text-sm leading-7 text-white/74 sm:text-base">
              {current.description}
            </p>
          )}
          {current.genre && (
            <p className="mt-4 max-w-2xl text-xs font-bold uppercase text-white/58 sm:text-sm">
              {current.genre}
            </p>
          )}
          {current.showHeroActions !== false && (
            <div className="mt-8 flex flex-wrap gap-3">
              {currentIsDisabled ? (
                <>
                  <span
                    aria-disabled="true"
                    className="cursor-not-allowed rounded-[6px] bg-white/45 px-9 py-3 text-sm font-black uppercase text-[#030714]/62"
                  >
                    Play
                  </span>
                  <span
                    aria-disabled="true"
                    className="cursor-not-allowed rounded-[6px] border border-white/12 bg-white/8 px-8 py-3 text-sm font-black uppercase text-white/42 backdrop-blur"
                  >
                    Details
                  </span>
                </>
              ) : (
                <>
                  <Link
                    className="rounded-[6px] bg-white px-9 py-3 text-sm font-black uppercase text-[#030714] transition hover:bg-cyan-100"
                    href={titleHref(current.slug)}
                  >
                    Play
                  </Link>
                  <Link
                    className="rounded-[6px] border border-white/16 bg-white/12 px-8 py-3 text-sm font-black uppercase text-white backdrop-blur transition hover:bg-white/20"
                    href={`${titleHref(current.slug)}#episodes`}
                  >
                    Details
                  </Link>
                </>
              )}
              <SaveForLaterButton
                className="grid size-12 place-items-center rounded-full border border-white/18 bg-black/35 text-2xl transition hover:bg-white/18"
                savedClassName="grid size-12 place-items-center rounded-full border border-cyan-200/40 bg-cyan-200 text-lg font-black text-[#030714] transition hover:bg-white"
                title={current}
              />
            </div>
          )}
          <div className="mt-8 flex items-center gap-2 lg:hidden">
            {titles.map((title, index) => (
              <button
                aria-label={`Show ${title.title}`}
                className={`h-1.5 rounded-full transition-all ${
                  index === active ? "w-9 bg-white" : "w-4 bg-white/34 hover:bg-white/70"
                }`}
                key={title.slug}
                onClick={() => selectHero(index)}
                type="button"
              />
            ))}
          </div>
        </div>
      )}

      {current.showHeroDetails === false && (
        <div className="absolute bottom-20 left-5 z-20 flex items-center gap-2 sm:left-8 lg:hidden">
          {titles.map((title, index) => (
            <button
              aria-label={`Show ${title.title}`}
              className={`h-1.5 rounded-full transition-all ${
                index === active ? "w-9 bg-white" : "w-4 bg-white/34 hover:bg-white/70"
              }`}
              key={title.slug}
              onClick={() => selectHero(index)}
              type="button"
            />
          ))}
        </div>
      )}

      <div className="absolute bottom-10 right-8 z-20 hidden w-[min(34rem,38vw)] lg:block">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-[#030714]/55 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-gradient-to-l from-[#030714]/55 to-transparent" />
        <div
          className={`no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 ${
            isDraggingThumbs ? "cursor-grabbing select-none" : "cursor-grab"
          }`}
          onClickCapture={preventThumbClickAfterDrag}
          onDragStart={(event) => event.preventDefault()}
          onPointerCancel={stopThumbDrag}
          onPointerDown={startThumbDrag}
          onPointerLeave={stopThumbDrag}
          onPointerMove={moveThumbDrag}
          onPointerUp={stopThumbDrag}
          ref={railRef}
        >
        {titles.map((title, index) => {
          const thumbnailClassName = title.isDiscontinued ? "object-cover grayscale" : "object-cover";

          return (
            <button
              aria-label={`Show ${title.title}`}
              className={`group w-20 shrink-0 snap-end overflow-hidden rounded-[5px] border bg-black/35 shadow-2xl shadow-black/30 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-white/70 xl:w-24 ${
                index === active ? "border-white/80" : "border-white/14"
              }`}
              key={title.slug}
              onClick={() => selectHero(index)}
              ref={index === active ? activeThumbRef : null}
              type="button"
            >
              <div className={`relative aspect-video bg-gradient-to-br ${title.tone}`}>
                {title.heroImage || title.posterImage ? (
                  <Image
                    alt=""
                    className={thumbnailClassName}
                    fill
                    sizes="96px"
                    src={title.heroImage || title.posterImage || ""}
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_28%,rgba(255,255,255,0.24),transparent_26%),linear-gradient(0deg,rgba(0,0,0,0.42),transparent_55%)]" />
                )}
                <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/0" />
              </div>
              <div className="h-0.5 bg-white/12">
                <div
                  className={`h-full rounded-r-full transition-all ${
                    index === active ? "w-full bg-white" : "w-0 bg-white/0"
                  }`}
                />
              </div>
            </button>
          );
        })}
        </div>
      </div>
    </section>
  );
}

function getHeroDetailShadowClass(title: Title) {
  if (title.source === "program" && title.trailerUrl) {
    return "bg-[linear-gradient(90deg,#030714_0%,rgba(3,7,20,0.96)_10%,rgba(3,7,20,0.7)_20%,rgba(3,7,20,0.22)_30%,transparent_78%)]";
  }

  if (title.source === "heroImage") {
    return "bg-[linear-gradient(90deg,#030714_0%,rgba(3,7,20,0.96)_10%,rgba(3,7,20,0.7)_20%,rgba(3,7,20,0.22)_30%,transparent_78%)]";
  }

  return "bg-[linear-gradient(90deg,#030714_0%,rgba(3,7,20,0.96)_10%,rgba(3,7,20,0.7)_20%,rgba(3,7,20,0.22)_30%,transparent_78%)]";
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
