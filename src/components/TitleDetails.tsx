"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Title, TitleEpisode, TitleSeason } from "@/lib/content";
import { DiscontinuedBadge } from "./DiscontinuedBadge";

type DetailTab = "episodes" | "details";
type PlayingEpisode = {
  embedUrl?: string;
  episode?: TitleEpisode;
  isYouTube?: boolean;
  title: string;
  url: string;
};

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

function isVideoLikeUrl(rawUrl: string): boolean {
  const input = rawUrl.trim();
  return Boolean(input) && /\.(mp4|m4v|webm|mov|m3u8)(\?.*)?$/i.test(input);
}

export function TitleDetails({
  compact = false,
  episodeLayout = "default",
  onSelectedSeasonChange,
  selectedSeasonId: controlledSelectedSeasonId,
  title,
}: {
  compact?: boolean;
  episodeLayout?: "default" | "legacy";
  onSelectedSeasonChange?: (id: string) => void;
  selectedSeasonId?: string;
  title: Title;
}) {
  const seasons = useMemo(() => title.seasons ?? [], [title.seasons]);
  const [activeTabState, setActiveTabState] = useState<{ slug: string; tab: DetailTab }>({
    slug: title.slug,
    tab: "episodes",
  });
  const [playingEpisode, setPlayingEpisode] = useState<PlayingEpisode | null>(null);
  const [internalSeasonSelection, setInternalSeasonSelection] = useState<{ slug: string; id: string }>({
    slug: title.slug,
    id: seasons[0]?.id ?? "",
  });
  const activeTab = activeTabState.slug === title.slug ? activeTabState.tab : "episodes";
  const internalSelectedSeasonId =
    internalSeasonSelection.slug === title.slug ? internalSeasonSelection.id : seasons[0]?.id ?? "";
  const selectedSeasonId = controlledSelectedSeasonId ?? internalSelectedSeasonId;
  const selectedSeason = useMemo(
    () => seasons.find((season) => season.id === selectedSeasonId) ?? seasons[0],
    [seasons, selectedSeasonId],
  );
  const hasEpisodes = Boolean(selectedSeason && selectedSeason.episodes.length > 0);
  const setSelectedSeasonId = (id: string) => {
    setInternalSeasonSelection({ slug: title.slug, id });
    onSelectedSeasonChange?.(id);
  };
  const playEpisode = useCallback((episode: TitleEpisode) => {
    const url = episode.videoUrl?.trim();
    if (!url) return;

    const embedUrl = toYouTubeEmbedUrl(url);
    if (embedUrl) {
      setPlayingEpisode({ embedUrl, episode, isYouTube: true, title: episode.title, url });
      return;
    }

    if (isInternalVideoUrl(url) || isVideoLikeUrl(url)) {
      setPlayingEpisode({ episode, title: episode.title, url });
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <>
      <div className={compact ? "space-y-7 px-5 py-6 sm:px-9" : "space-y-8 px-5 py-7 sm:px-9 lg:px-10"}>
        <div className="flex gap-7 border-b border-white/10 text-sm font-black uppercase tracking-[0.16em] text-white/42">
          <TabButton active={activeTab === "episodes"} onClick={() => setActiveTabState({ slug: title.slug, tab: "episodes" })}>
            Episodes
          </TabButton>
          <TabButton active={activeTab === "details"} onClick={() => setActiveTabState({ slug: title.slug, tab: "details" })}>
            Details
          </TabButton>
        </div>

        {activeTab === "episodes" ? (
          <EpisodesPanel
            compact={compact}
            episodeLayout={episodeLayout}
            hasEpisodes={hasEpisodes}
            onPlayEpisode={playEpisode}
            seasons={seasons}
            selectedSeason={selectedSeason}
            selectedSeasonId={selectedSeason?.id ?? ""}
            setSelectedSeasonId={setSelectedSeasonId}
            title={title}
          />
        ) : null}

        {activeTab === "details" ? <DetailsPanel title={title} /> : null}
      </div>
      <EpisodeVideoPlayer
        playingEpisode={playingEpisode}
        onClose={() => setPlayingEpisode(null)}
        onPlayEpisode={playEpisode}
        playableEpisodes={selectedSeason?.episodes.filter((episode) => Boolean(episode.videoUrl)) ?? []}
      />
    </>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`border-b-2 pb-3 transition ${
        active ? "border-white text-white" : "border-transparent text-white/42 hover:text-white/78"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function EpisodesPanel({
  compact,
  episodeLayout,
  hasEpisodes,
  onPlayEpisode,
  seasons,
  selectedSeason,
  selectedSeasonId,
  setSelectedSeasonId,
  title,
}: {
  compact: boolean;
  episodeLayout: "default" | "legacy";
  hasEpisodes: boolean;
  onPlayEpisode: (episode: TitleEpisode) => void;
  seasons: TitleSeason[];
  selectedSeason: TitleSeason | undefined;
  selectedSeasonId: string;
  setSelectedSeasonId: (id: string) => void;
  title: Title;
}) {
  if (seasons.length === 0) {
    return (
      <section className="rounded-[8px] border border-white/10 bg-white/[0.04] p-6">
        <h2 className={compact ? "text-xl font-black" : "text-2xl font-black"}>Episodes</h2>
        <p className="mt-2 text-sm leading-6 text-white/62">
          Season and episode details will appear here when they are added in Payload.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className={compact ? "text-xl font-black" : "text-2xl font-black"}>Episodes</h2>
          <p className="mt-1 text-sm font-semibold text-white/52">
            {seasons.length} season available
          </p>
          {selectedSeason ? (
            <p className="mt-1 text-sm font-semibold text-white/52">
              {seasonSummaryLabel(selectedSeason)} | {selectedSeason.episodes.length} episode
            </p>
          ) : null}
        </div>
        <select
          aria-label="Select season"
          className="h-11 rounded-[6px] border border-white/14 bg-white/10 px-4 text-sm font-black text-white outline-none transition hover:bg-white/16 focus:border-white/50"
          onChange={(event) => setSelectedSeasonId(event.target.value)}
          value={selectedSeasonId}
        >
          {seasons.map((season) => (
            <option className="bg-[#111827] text-white" key={season.id} value={season.id}>
              {seasonLabel(season)}
            </option>
          ))}
        </select>
      </div>

      {selectedSeason?.description ? (
        <p className="max-w-3xl text-sm leading-6 text-white/64">{selectedSeason.description}</p>
      ) : null}

      {selectedSeason && hasEpisodes && episodeLayout === "legacy" ? (
        <div className="divide-y divide-white/10 overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.03]">
          {selectedSeason.episodes.map((episode) => {
            const hasVideo = Boolean(episode.videoUrl);
            const imageSrc = episode.image || selectedSeason.image || title.heroImage || title.posterImage;

            return (
              <article
                className={`grid gap-4 p-3 transition sm:grid-cols-[168px_1fr] sm:p-4 ${
                  hasVideo ? "group cursor-pointer hover:bg-white/[0.06]" : ""
                }`}
                key={episode.id}
                onClick={hasVideo ? () => onPlayEpisode(episode) : undefined}
                onKeyDown={hasVideo ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onPlayEpisode(episode);
                  }
                } : undefined}
                role={hasVideo ? "button" : undefined}
                tabIndex={hasVideo ? 0 : undefined}
              >
                <div className={`relative aspect-video overflow-hidden rounded-[6px] bg-gradient-to-br ${title.tone}`}>
                  {imageSrc ? (
                    <Image
                      alt=""
                      className="object-cover"
                      fill
                      sizes="168px"
                      src={imageSrc}
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-black/18" />
                  {hasVideo ? (
                    <div className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
                      <span className="grid size-11 place-items-center rounded-full bg-white text-[#030714]">
                        <PlayIcon />
                      </span>
                    </div>
                  ) : null}
                </div>
                <div className="min-w-0 py-1">
                  <div className="flex items-center gap-3">
                    {episode.episodeNumber ? (
                      <span className="text-sm font-black text-white/40">{episode.episodeNumber}</span>
                    ) : null}
                    <h3 className="line-clamp-1 text-base font-black">{episode.title}</h3>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/62">{episode.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      ) : selectedSeason && hasEpisodes ? (
        <ul className="list-none space-y-2">
          {selectedSeason.episodes.map((episode) => {
            const hasVideo = Boolean(episode.videoUrl);
            return (
              <li key={episode.id}>
                <article
                  className={`relative flex gap-3 overflow-hidden rounded-[8px] bg-white/10 ${
                    hasVideo ? "group cursor-pointer transition-colors hover:bg-white/15" : ""
                  }`}
                  onClick={hasVideo ? () => onPlayEpisode(episode) : undefined}
                  onKeyDown={hasVideo ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onPlayEpisode(episode);
                    }
                  } : undefined}
                  role={hasVideo ? "button" : undefined}
                  tabIndex={hasVideo ? 0 : undefined}
                >
              <div className="relative h-[8em] w-44 min-w-44 shrink-0 overflow-hidden bg-white/10">
                {episode.image ? (
                  <Image
                    alt=""
                    className="h-full w-full object-cover object-center"
                    height={128}
                    sizes="176px"
                    src={episode.image}
                    width={176}
                  />
                ) : null}
                {hasVideo ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                    <PlayIcon className="size-10 text-white" />
                  </div>
                ) : null}
              </div>
              <div className="min-w-0 flex-1 py-2 pr-3 text-sm text-white/95">
                <div className="flex min-w-0 items-center gap-2">
                  {episode.episodeNumber ? (
                    <span className="shrink-0 font-semibold">Episode {episode.episodeNumber}</span>
                  ) : null}
                  <h3 className="line-clamp-1 min-w-0 font-semibold">
                    {episode.episodeNumber ? `· ${episode.title}` : episode.title}
                  </h3>
                </div>
                {episode.releaseDate ? (
                  <p className="mt-1 text-[11px] leading-relaxed text-white/70">{episode.releaseDate}</p>
                ) : null}
                <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-white/80">{episode.description}</p>
              </div>
                </article>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-6 text-sm text-white/62">
          Episodes for this season will be available soon.
        </div>
      )}
    </section>
  );
}

function EpisodeVideoPlayer({
  onClose,
  onPlayEpisode,
  playingEpisode,
  playableEpisodes,
}: {
  onClose: () => void;
  onPlayEpisode: (episode: TitleEpisode) => void;
  playingEpisode: PlayingEpisode | null;
  playableEpisodes: TitleEpisode[];
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimeoutRef = useRef<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [nextCountdown, setNextCountdown] = useState<{ remaining: number; url: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [volume, setVolume] = useState(1);
  const nextEpisode =
    playingEpisode?.episode
      ? playableEpisodes[playableEpisodes.findIndex((episode) => episode.id === playingEpisode.episode?.id) + 1]
      : undefined;
  const activeNextCountdown =
    nextCountdown && nextCountdown.url === playingEpisode?.url ? nextCountdown.remaining : null;

  const scheduleHideControls = useCallback(() => {
    if (hideControlsTimeoutRef.current) {
      window.clearTimeout(hideControlsTimeoutRef.current);
    }

    hideControlsTimeoutRef.current = window.setTimeout(() => {
      setControlsVisible(false);
      setSpeedMenuOpen(false);
      hideControlsTimeoutRef.current = null;
    }, 2500);
  }, []);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  const hideControls = useCallback(() => {
    if (hideControlsTimeoutRef.current) {
      window.clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = null;
    }
    setControlsVisible(false);
    setSpeedMenuOpen(false);
  }, []);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
    showControls();
  }, [showControls]);

  const seekVideo = useCallback((value: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(value)) return;
    video.currentTime = Math.min(Math.max(value, 0), video.duration || value);
    setCurrentTime(video.currentTime);
    showControls();
  }, [showControls]);

  const setVideoVolume = useCallback((value: number) => {
    const video = videoRef.current;
    const next = Math.min(Math.max(value, 0), 1);
    setVolume(next);
    setMuted(next === 0);
    if (video) {
      video.volume = next;
      video.muted = next === 0;
    }
    showControls();
  }, [showControls]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setMuted(nextMuted);
    if (!nextMuted && video.volume === 0) {
      video.volume = 1;
      setVolume(1);
    }
    showControls();
  }, [showControls]);

  const setNativePlaybackRate = useCallback((value: number) => {
    const video = videoRef.current;
    const next = Number.isFinite(value) && value > 0 ? value : 1;
    setPlaybackRate(next);
    setSpeedMenuOpen(false);
    if (video) video.playbackRate = next;
    showControls();
  }, [showControls]);

  const togglePictureInPicture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !document.pictureInPictureEnabled) return;

    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    } else {
      video.requestPictureInPicture().catch(() => {});
    }
    showControls();
  }, [showControls]);

  const toggleFullscreen = useCallback(() => {
    const target = playerRef.current ?? videoRef.current;
    if (!target) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      target.requestFullscreen().catch(() => {});
    }
    showControls();
  }, [showControls]);

  const exitPictureInPicture = useCallback(() => {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    }
  }, []);

  const closePlayer = useCallback(() => {
    videoRef.current?.pause();
    exitPictureInPicture();
    onClose();
  }, [exitPictureInPicture, onClose]);

  const playNextEpisode = useCallback((episode: TitleEpisode) => {
    setNextCountdown(null);
    onPlayEpisode(episode);
  }, [onPlayEpisode]);

  const cancelNextCountdown = useCallback(() => {
    setNextCountdown(null);
    showControls();
  }, [showControls]);

  useEffect(() => {
    if (!playingEpisode) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePlayer();
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      if (hideControlsTimeoutRef.current) {
        window.clearTimeout(hideControlsTimeoutRef.current);
      }
      document.body.style.overflow = previousOverflow;
    };
  }, [closePlayer, playingEpisode]);

  useEffect(() => {
    if (activeNextCountdown == null || !nextEpisode) return;

    const timer = window.setTimeout(() => {
      if (activeNextCountdown <= 1) {
        playNextEpisode(nextEpisode);
        return;
      }

      setNextCountdown((countdown) => {
        if (!countdown || countdown.url !== playingEpisode?.url) {
          return countdown;
        }

        return { url: countdown.url, remaining: Math.max(0, countdown.remaining - 1) };
      });
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [activeNextCountdown, nextEpisode, playNextEpisode, playingEpisode?.url]);

  if (!playingEpisode || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-[99999] bg-black text-white ${
        controlsVisible ? "" : "cursor-none"
      }`}
      data-title-episode-player
      ref={playerRef}
      onClick={(event) => event.stopPropagation()}
      onMouseLeave={hideControls}
      onMouseMove={showControls}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0">
        {playingEpisode.isYouTube && playingEpisode.embedUrl ? (
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className={`h-full w-full ${controlsVisible ? "" : "cursor-none"}`}
            referrerPolicy="strict-origin-when-cross-origin"
            src={`${playingEpisode.embedUrl}?autoplay=1&playsinline=1&rel=0`}
            title="Episode player"
          />
        ) : (
          <video
            autoPlay
            className={`h-full w-full object-contain ${controlsVisible ? "" : "cursor-none"}`}
            disableRemotePlayback
            onClick={togglePlayback}
            onContextMenu={(event) => event.preventDefault()}
            onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
            onLoadedData={() => videoRef.current?.play().catch(() => {})}
            onLoadedMetadata={(event) => {
              const video = event.currentTarget;
              setDuration(video.duration || 0);
              setCurrentTime(video.currentTime || 0);
              setVolume(video.volume);
              setMuted(video.muted || video.volume === 0);
              video.playbackRate = playbackRate;
            }}
            onPause={() => setIsPlaying(false)}
            onPlay={() => {
              setIsPlaying(true);
              setNextCountdown(null);
              scheduleHideControls();
            }}
            onEnded={() => {
              setIsPlaying(false);
              setControlsVisible(true);
              if (nextEpisode) {
                setNextCountdown({ remaining: 10, url: playingEpisode.url });
              }
            }}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
            onVolumeChange={(event) => {
              setVolume(event.currentTarget.volume);
              setMuted(event.currentTarget.muted || event.currentTarget.volume === 0);
            }}
            playsInline
            ref={videoRef}
            src={playingEpisode.url}
          />
        )}
      </div>
      <header
        className={`absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/86 via-black/55 to-transparent px-4 pb-10 pt-4 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onMouseEnter={showControls}
      >
        <div className="flex items-center gap-3">
          <button
            aria-label="Close episode player"
            className="grid size-10 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/15"
            onClick={closePlayer}
            type="button"
          >
            <BackIcon />
          </button>
          <h2 className="min-w-0 flex-1 truncate text-base font-black text-white">
            {episodePlayerTitle(playingEpisode)}
          </h2>
          {nextEpisode ? (
            <button
              className="shrink-0 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-black transition hover:bg-white"
              onClick={() => playNextEpisode(nextEpisode)}
              type="button"
            >
              Next Episode
            </button>
          ) : null}
        </div>
      </header>
      {activeNextCountdown != null && nextEpisode ? (
        <div className="absolute bottom-28 right-4 z-20 w-[min(22rem,calc(100vw-2rem))] rounded-[8px] border border-white/12 bg-black/78 p-4 text-white shadow-2xl shadow-black/50 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/50">Up Next</p>
          <h3 className="mt-2 line-clamp-2 text-lg font-black">{episodePlayerTitle({ episode: nextEpisode, title: nextEpisode.title, url: nextEpisode.videoUrl ?? "" })}</h3>
          <p className="mt-2 text-sm font-semibold text-white/68">
            Playing in {activeNextCountdown}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              className="rounded-[6px] bg-white px-4 py-2 text-sm font-black text-[#030714] transition hover:bg-cyan-100"
              onClick={() => playNextEpisode(nextEpisode)}
              type="button"
            >
              Play Now
            </button>
            <button
              className="rounded-[6px] border border-white/16 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/18"
              onClick={cancelNextCountdown}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      {!playingEpisode.isYouTube ? (
        <div
          className={`absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/85 via-black/60 to-transparent px-4 pb-4 pt-10 text-white transition-opacity duration-300 ${
            controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={(event) => event.stopPropagation()}
          onMouseEnter={showControls}
        >
          <div className="flex w-full flex-col gap-3">
            <input
              aria-label="Video progress"
              className="h-1 w-full cursor-pointer accent-white"
              max={Math.max(duration, 0)}
              min={0}
              onChange={(event) => seekVideo(Number(event.currentTarget.value))}
              step="0.1"
              type="range"
              value={Math.min(currentTime, duration || currentTime || 0)}
            />
            <div className="flex items-center gap-3">
              <button
                aria-label={isPlaying ? "Pause" : "Play"}
                className="grid size-10 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/15"
                onClick={togglePlayback}
                type="button"
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
              <span className="min-w-[6.5rem] text-sm font-medium tabular-nums text-white/90">
                {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
              </span>
              <div className="ml-auto flex items-center gap-2">
              <div className="relative">
              <button
                aria-expanded={speedMenuOpen}
                aria-label="Playback speed"
                className="flex h-10 min-w-10 shrink-0 items-center justify-center gap-1 rounded-full px-2 text-white transition hover:bg-white/15"
                onClick={(event) => {
                  event.stopPropagation();
                  setSpeedMenuOpen((open) => !open);
                  showControls();
                }}
                type="button"
              >
                <SpeedIcon />
                <span className="text-xs font-bold tabular-nums">{playbackRate}x</span>
              </button>
              {speedMenuOpen ? (
                <div className="absolute bottom-12 right-0 grid min-w-28 overflow-hidden rounded-[6px] border border-white/15 bg-black/85 py-1 shadow-2xl backdrop-blur">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      className={`px-3 py-2 text-left text-sm font-semibold hover:bg-white/15 ${
                        playbackRate === rate ? "text-cyan-200" : "text-white"
                      }`}
                      key={rate}
                      onClick={() => setNativePlaybackRate(rate)}
                      type="button"
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button
              aria-label={muted ? "Unmute" : "Mute"}
              className="grid size-10 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/15"
              onClick={toggleMute}
              type="button"
            >
              {muted ? <MutedIcon /> : <VolumeIcon />}
            </button>
            <input
              aria-label="Volume"
              className="hidden h-1 w-24 cursor-pointer accent-white sm:block"
              max={1}
              min={0}
              onChange={(event) => setVideoVolume(Number(event.currentTarget.value))}
              step="0.05"
              type="range"
              value={muted ? 0 : volume}
            />
            <button
              aria-label="Picture in picture"
              className="grid size-10 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/15 disabled:pointer-events-none disabled:opacity-40"
              disabled={typeof document !== "undefined" && !document.pictureInPictureEnabled}
              onClick={togglePictureInPicture}
              type="button"
            >
              <PictureInPictureIcon />
            </button>
            <button
              aria-label="Fullscreen"
              className="grid size-10 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/15"
              onClick={toggleFullscreen}
              type="button"
            >
              <FullscreenIcon />
            </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
    ,
    document.body,
  );
}

function episodePlayerTitle(playingEpisode: PlayingEpisode) {
  const number = playingEpisode.episode?.episodeNumber;
  return number ? `Episode ${number}: ${playingEpisode.title}` : playingEpisode.title;
}

function formatVideoTime(secondsLike: number): string {
  if (!Number.isFinite(secondsLike) || secondsLike <= 0) return "0:00";
  const total = Math.floor(secondsLike);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

function DetailsPanel({ title }: { title: Title }) {
  return (
    <section className="grid gap-6 text-sm md:grid-cols-[1.4fr_1fr]">
      <div>
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white/42">About</h2>
        <p className="mt-3 leading-7 text-white/70">{title.description}</p>
      </div>
      <dl className="grid grid-cols-2 gap-x-5 gap-y-4 md:grid-cols-1">
        {title.isDiscontinued ? (
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.16em] text-white/34">Status</dt>
            <dd className="mt-2">
              <DiscontinuedBadge />
            </dd>
          </div>
        ) : null}
        <Meta label="Type" value={title.type} />
        <Meta label="Genre" value={title.genre} />
        <Meta label="Released" value={title.year} />
        <Meta label="Rating" value={title.rating} />
      </dl>
    </section>
  );
}

function seasonLabel(season: TitleSeason) {
  if (season.seasonNumber) {
    return season.title.toLowerCase().startsWith("season") ? season.title : `Season ${season.seasonNumber}: ${season.title}`;
  }

  return season.title;
}

function seasonSummaryLabel(season: TitleSeason) {
  if (season.seasonNumber) {
    return `season ${season.seasonNumber}`;
  }

  return season.title.toLowerCase();
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-[0.16em] text-white/34">{label}</dt>
      <dd className="mt-1 font-semibold text-white/78">{value}</dd>
    </div>
  );
}

function PlayIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5.14v13.72c0 .7.77 1.12 1.36.74l10.78-6.86a.88.88 0 0 0 0-1.48L9.36 4.4A.88.88 0 0 0 8 5.14Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function PictureInPictureIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <rect height="14" rx="2" width="18" x="3" y="5" />
      <rect height="5" rx="1" width="7" x="12" y="11" />
    </svg>
  );
}

function MutedIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="m22 9-6 6" />
      <path d="m16 9 6 6" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M16 3h3a2 2 0 0 1 2 2v3" />
      <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function SpeedIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
