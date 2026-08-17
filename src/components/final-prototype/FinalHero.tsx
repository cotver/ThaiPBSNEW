"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { finalArticleHref, titleDisplayLines, titleEyebrow, titleInlineText, type Title } from "@/lib/content";
import { FinalSaveButton } from "./FinalSaveButton";

const ROTATION_INTERVAL_MS = 10000;
const DRAG_STEP_PX = 42;

function toYouTubeEmbedUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl.trim());
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.replace(/^\/+/, "").split("/")[0] || null;
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname.startsWith("/watch")) id = url.searchParams.get("v");
      else if (url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2] || null;
    }
    return id && /^[A-Za-z0-9_-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

function isInternalVideoUrl(rawUrl: string) {
  const input = rawUrl.trim();
  if (input.startsWith("/api/videos/file") || input.startsWith("/api/airflow/video")) return true;
  try {
    const url = new URL(input);
    return url.pathname.startsWith("/api/videos/file") || url.pathname.startsWith("/api/airflow/video");
  } catch {
    return false;
  }
}

function getTrailerSource(title: Title | undefined): { mimeType?: string; url: string } {
  if (!title || title.source !== "program") return { url: "" };
  if (title.trailerUrl) return { mimeType: title.trailerMimeType, url: title.trailerUrl };

  const seasons = title.seasons?.filter((season) => season.trailerUrl) ?? [];
  const numbered = seasons.filter((season) => typeof season.seasonNumber === "number");
  const latest = numbered.length
    ? numbered.reduce((current, season) => (season.seasonNumber ?? -1) > (current.seasonNumber ?? -1) ? season : current)
    : seasons.at(-1);
  const selected = latest ?? seasons[0];
  return { mimeType: selected?.trailerMimeType, url: selected?.trailerUrl ?? "" };
}

export function FinalHero({ heroes }: { heroes: Title[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [heroInView, setHeroInView] = useState(true);
  const [isDraggingCards, setIsDraggingCards] = useState(false);
  const [rotationKey, setRotationKey] = useState(0);
  const [trailerPlayback, setTrailerPlayback] = useState({ ended: false, failed: false, loaded: false, muted: true, url: "" });
  const cardRailRef = useRef<HTMLDivElement>(null);
  const dragActiveRef = useRef(false);
  const didDragCardsRef = useRef(false);
  const dragStartIndexRef = useRef<number | null>(null);
  const dragLastXRef = useRef(0);
  const dragRemainderRef = useRef(0);
  const isDraggingCardsRef = useRef(false);
  const wheelRemainderRef = useRef(0);
  const wheelResetTimerRef = useRef<number | null>(null);
  const dragStartXRef = useRef(0);
  const heroRef = useRef<HTMLElement>(null);
  const trailerIframeRef = useRef<HTMLIFrameElement>(null);
  const trailerVideoRef = useRef<HTMLVideoElement>(null);
  const visibleHeroes = heroes;
  const heroCount = heroes.length;
  const orbitItemCount = Math.min(heroCount, 5);
  const activeHero = visibleHeroes[activeIndex] ?? visibleHeroes[0];
  const trailerSource = getTrailerSource(activeHero);
  const trailerUrl = trailerSource.url;
  const trailerEmbedUrl = trailerUrl ? toYouTubeEmbedUrl(trailerUrl) : null;
  const trailerIsInternal = trailerUrl ? isInternalVideoUrl(trailerUrl) : false;
  const trailerIsGif = trailerSource.mimeType === "image/gif";
  const playbackMatches = trailerPlayback.url === trailerUrl;
  const trailerEnded = playbackMatches && trailerPlayback.ended;
  const trailerFailed = playbackMatches && trailerPlayback.failed;
  const trailerLoaded = playbackMatches && trailerPlayback.loaded;
  const trailerMuted = playbackMatches ? trailerPlayback.muted : true;
  const canRenderTrailer = Boolean(trailerUrl) && !trailerEnded && (trailerIsGif || Boolean(trailerEmbedUrl) || (trailerIsInternal && !trailerFailed));
  const hasExternalTrailer = Boolean(trailerUrl) && !trailerIsGif && !trailerEmbedUrl && !trailerIsInternal;
  const showTrailer = canRenderTrailer && heroInView && trailerLoaded;
  const isAutoRotationActive = visibleHeroes.length > 1 && !isDraggingCards && (!canRenderTrailer || trailerIsGif || trailerEnded);

  const advanceHero = useCallback(() => {
    if (isDraggingCardsRef.current) return;
    setActiveIndex((index) => heroCount ? (index + 1) % heroCount : 0);
  }, [heroCount]);

  const markTrailerLoaded = useCallback((url: string) => {
    setTrailerPlayback((playback) => ({ ...playback, failed: false, loaded: true, url }));
  }, []);

  useEffect(() => {
    if (visibleHeroes.length < 2 || isDraggingCards) return;

    if (canRenderTrailer && !trailerIsGif && !trailerEnded) return;
    const timer = window.setTimeout(advanceHero, ROTATION_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [activeIndex, advanceHero, canRenderTrailer, isDraggingCards, trailerEnded, trailerIsGif, visibleHeroes.length]);

  useEffect(() => () => {
    if (wheelResetTimerRef.current !== null) window.clearTimeout(wheelResetTimerRef.current);
  }, []);

  useEffect(() => {
    if (!trailerUrl) return;
    const timer = window.setTimeout(() => {
      setTrailerPlayback((playback) => ({ ended: false, failed: false, loaded: false, muted: playback.muted, url: trailerUrl }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeIndex, trailerUrl]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => {
      setHeroInView(Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.5));
    }, { threshold: [0, 0.5, 1] });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!trailerUrl || !trailerIsInternal || trailerFailed) return;
    const frame = window.requestAnimationFrame(() => {
      const video = trailerVideoRef.current;
      if (!video) return;
      video.muted = trailerMuted;
      if (!heroInView || trailerEnded) {
        video.pause();
        return;
      }
      video.play().then(() => markTrailerLoaded(trailerUrl)).catch(() => undefined);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [heroInView, markTrailerLoaded, trailerEnded, trailerFailed, trailerIsInternal, trailerMuted, trailerUrl]);

  useEffect(() => {
    const iframe = trailerIframeRef.current;
    if (!iframe?.contentWindow) return;
    try {
      iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: heroInView && !trailerEnded ? "playVideo" : "pauseVideo", args: [] }), "*");
      iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: trailerMuted ? "mute" : "unMute", args: [] }), "*");
    } catch {}
  }, [heroInView, trailerEnded, trailerMuted, trailerUrl]);

  useEffect(() => {
    if (!trailerEmbedUrl || trailerEnded) return;
    const onMessage = (event: MessageEvent) => {
      if (!event.origin.toLowerCase().includes("youtube")) return;
      let payload: unknown = event.data;
      if (typeof payload === "string") {
        try { payload = JSON.parse(payload) as unknown; } catch { return; }
      }
      if (payload && typeof payload === "object" && "event" in payload && "info" in payload && payload.event === "onStateChange" && payload.info === 0) {
        setTrailerPlayback((playback) => ({ ...playback, ended: true, url: trailerUrl }));
        advanceHero();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [advanceHero, trailerEmbedUrl, trailerEnded, trailerUrl]);

  function startCardDrag(event: React.PointerEvent<HTMLDivElement>) {
    const rail = cardRailRef.current;
    if (!rail || (event.pointerType === "mouse" && event.button !== 0)) return;
    didDragCardsRef.current = false;
    const pressedButton = event.target instanceof Element ? event.target.closest<HTMLButtonElement>(".final-hero-card") : null;
    const pressedIndex = Number(pressedButton?.dataset.index);
    dragStartIndexRef.current = Number.isInteger(pressedIndex) ? pressedIndex : null;
    dragStartXRef.current = event.clientX;
    dragLastXRef.current = event.clientX;
    dragRemainderRef.current = 0;
    dragActiveRef.current = true;
    isDraggingCardsRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDraggingCards(true);
  }

  function moveCardDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!cardRailRef.current || !dragActiveRef.current) return;
    const delta = event.clientX - dragStartXRef.current;
    if (Math.abs(delta) > 6) {
      didDragCardsRef.current = true;
      dragRemainderRef.current += event.clientX - dragLastXRef.current;
      dragLastXRef.current = event.clientX;
      const dragSteps = Math.trunc(dragRemainderRef.current / DRAG_STEP_PX);
      if (!dragSteps || heroCount < 2) return;

      dragRemainderRef.current -= dragSteps * DRAG_STEP_PX;
      setActiveIndex((index) => (index + dragSteps % heroCount + heroCount) % heroCount);
    }
  }

  function finishCardDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragActiveRef.current) return;
    const delta = event.clientX - dragStartXRef.current;
    const didMove = Math.abs(delta) > 6;
    const selectedIndex = dragStartIndexRef.current;
    if (!didMove && selectedIndex !== null && selectedIndex >= 0 && selectedIndex < heroCount) {
      setActiveIndex(selectedIndex);
    }
    didDragCardsRef.current = didMove || selectedIndex !== null;
    dragActiveRef.current = false;
    isDraggingCardsRef.current = false;
    dragStartIndexRef.current = null;
    dragRemainderRef.current = 0;
    setIsDraggingCards(false);
    setRotationKey((key) => key + 1);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    window.setTimeout(() => { didDragCardsRef.current = false; }, 0);
  }

  function preventClickAfterDrag(event: React.MouseEvent<HTMLDivElement>) {
    if (!didDragCardsRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    didDragCardsRef.current = false;
  }

  function spinCardsWithWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (heroCount < 2) return;
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (!delta) return;

    event.preventDefault();
    wheelRemainderRef.current += delta;
    if (wheelResetTimerRef.current !== null) window.clearTimeout(wheelResetTimerRef.current);
    wheelResetTimerRef.current = window.setTimeout(() => { wheelRemainderRef.current = 0; }, 140);

    const steps = Math.trunc(wheelRemainderRef.current / 80);
    if (!steps) return;

    wheelRemainderRef.current -= steps * 80;
    setActiveIndex((index) => (index + steps % heroCount + heroCount) % heroCount);
  }

  function cancelCardDrag(event: React.PointerEvent<HTMLDivElement>) {
    dragActiveRef.current = false;
    isDraggingCardsRef.current = false;
    dragStartIndexRef.current = null;
    dragRemainderRef.current = 0;
    didDragCardsRef.current = false;
    setIsDraggingCards(false);
    setRotationKey((key) => key + 1);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  if (!activeHero) {
    return (
      <section className="final-hero final-hero--empty">
        <p>No published hero records yet.</p>
      </section>
    );
  }

  return (
    <section className="final-hero" aria-label="Featured Thai PBS stories" ref={heroRef}>
      <div className="final-hero__backgrounds" aria-hidden="true">
        {visibleHeroes.map((hero, index) => {
          const image = hero.heroImage || hero.posterImage;
          const isActive = index === activeIndex;
          const showDetails = hero.showHeroDetails !== false;
          const useFullImage = hero.source === "heroImage" && !showDetails;
          return (
            <div className="final-hero-background" data-active={isActive} data-discontinued={hero.isDiscontinued} key={`${hero.slug}-background`}>
              <div className={showTrailer && isActive ? "final-hero-background__poster is-hidden" : "final-hero-background__poster"}>
                {image ? (
                  <div className={useFullImage ? "final-hero-background__image-frame is-full" : "final-hero-background__image-align"}>
                    <div className={useFullImage ? "final-hero-background__image-inner is-full" : "final-hero-background__image-inner"}>
                      <Image
                        alt=""
                        fetchPriority={index === 0 ? "high" : "auto"}
                        fill
                        loading="eager"
                        sizes="100vw"
                        src={image}
                      />
                      {showDetails && <><span className="final-hero-background__image-left-fade" /><span className="final-hero-background__image-bottom-fade" /></>}
                    </div>
                  </div>
                ) : (
                  <span className={`final-hero-background__fallback bg-gradient-to-br ${hero.tone}`} />
                )}
              </div>

              {isActive && trailerEmbedUrl && canRenderTrailer && (
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  aria-hidden="true"
                  className={showTrailer ? "final-hero-background__trailer is-visible" : "final-hero-background__trailer"}
                  onLoad={() => {
                    markTrailerLoaded(trailerUrl);
                    try {
                      trailerIframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"] }), "*");
                    } catch {}
                  }}
                  ref={trailerIframeRef}
                  referrerPolicy="strict-origin-when-cross-origin"
                  src={`${trailerEmbedUrl}?autoplay=1&mute=${trailerMuted ? 1 : 0}&playsinline=1&rel=0&enablejsapi=1`}
                  title="Trailer player"
                />
              )}

              {isActive && canRenderTrailer && trailerIsGif && (
                <Image
                  alt=""
                  className={showTrailer ? "final-hero-background__trailer is-visible" : "final-hero-background__trailer"}
                  fill
                  loading="eager"
                  onLoad={() => markTrailerLoaded(trailerUrl)}
                  sizes="100vw"
                  src={trailerUrl}
                  unoptimized
                />
              )}

              {isActive && canRenderTrailer && trailerIsInternal && !trailerIsGif && (
                <video
                  aria-hidden="true"
                  autoPlay
                  className={showTrailer ? "final-hero-background__trailer is-visible" : "final-hero-background__trailer"}
                  disablePictureInPicture
                  disableRemotePlayback
                  muted={trailerMuted}
                  onCanPlay={(event) => {
                    event.currentTarget.muted = trailerMuted;
                    markTrailerLoaded(trailerUrl);
                    if (heroInView && !trailerEnded) event.currentTarget.play().catch(() => undefined);
                  }}
                  onEnded={() => { setTrailerPlayback((playback) => ({ ...playback, ended: true, url: trailerUrl })); advanceHero(); }}
                  onError={() => setTrailerPlayback((playback) => ({ ...playback, ended: true, failed: true, loaded: false, url: trailerUrl }))}
                  onPlaying={() => markTrailerLoaded(trailerUrl)}
                  playsInline
                  poster={image}
                  preload="auto"
                  ref={trailerVideoRef}
                  src={trailerUrl}
                />
              )}

              {showDetails && <div className="final-hero-background__detail-shadow" />}
            </div>
          );
        })}
        <div className="final-hero__background-shade" />
      </div>
      {activeHero.showHeroDetails !== false && <div className="final-hero__intro">
        <p>{titleEyebrow(activeHero)}</p>
        <h1>{titleDisplayLines(activeHero).map((line) => <span key={line}>{line}</span>)}</h1>
        {[activeHero.year, activeHero.rating, activeHero.duration].filter(Boolean).length > 0 && (
          <small>{[activeHero.year, activeHero.rating, activeHero.duration].filter(Boolean).join(" | ")}</small>
        )}
        {activeHero.description && <span>{activeHero.description}</span>}
        {activeHero.genre && <em>{activeHero.genre}</em>}
        {activeHero.showHeroActions !== false && (
          <div className="final-hero__actions">
            {activeHero.isDiscontinued ? (
              <><span className="final-hero__play is-disabled">Play</span><span className="final-hero__details is-disabled">Details</span></>
            ) : (
            <><Link className="final-hero__play" href={finalArticleHref(activeHero.slug)}>Play</Link><Link className="final-hero__details" href={`${finalArticleHref(activeHero.slug)}#episodes`}>Details</Link></>
            )}
            <FinalSaveButton title={activeHero} />
          </div>
        )}
      </div>}

      {hasExternalTrailer && (
        <button className="final-hero__external-trailer" onClick={() => window.open(trailerUrl, "_blank", "noopener,noreferrer")} type="button">
          Open trailer
        </button>
      )}

      {showTrailer && !trailerIsGif && (
        <button
          aria-label={trailerMuted ? "Unmute trailer" : "Mute trailer"}
          className="final-hero__mute"
          onClick={() => {
            setTrailerPlayback((playback) => ({ ...playback, muted: playbackMatches ? !playback.muted : false, url: trailerUrl }));
            trailerVideoRef.current?.play().catch(() => undefined);
          }}
          type="button"
        >
          {trailerMuted ? <MutedIcon /> : <VolumeIcon />}
        </button>
      )}

      <div className="final-hero__carousel">
        <div
          className="final-hero__cards"
          data-auto-rotating={isAutoRotationActive}
          data-dragging={isDraggingCards}
          onClickCapture={preventClickAfterDrag}
          onDragStart={(event) => event.preventDefault()}
          onPointerCancel={cancelCardDrag}
          onPointerDown={startCardDrag}
          onPointerMove={moveCardDrag}
          onPointerUp={finishCardDrag}
          onWheel={spinCardsWithWheel}
          ref={cardRailRef}
        >
          {visibleHeroes.map((hero, index) => {
            const position = (index - activeIndex + visibleHeroes.length) % visibleHeroes.length;
            const signedPosition = position > visibleHeroes.length / 2 ? position - visibleHeroes.length : position;
            const isOrbitVisible = visibleHeroes.length <= orbitItemCount || Math.abs(signedPosition) <= Math.floor(orbitItemCount / 2);
            const image = hero.heroImage || hero.posterImage;
            const semiCircleStep = orbitItemCount <= 2 ? 90 : 180 / (orbitItemCount - 1);
            const angle = 180 + signedPosition * semiCircleStep;
            const cardStyle = {
              "--final-hero-card-angle": `${angle}deg`,
              "--final-hero-card-counter-angle": `${-angle}deg`,
            } as CSSProperties;

            return (
              <button
                aria-hidden={!isOrbitVisible || undefined}
                aria-label={`Show ${titleInlineText(hero)} in the hero`}
                aria-pressed={index === activeIndex}
                className="final-hero-card"
                data-active={position === 0}
                data-index={index}
                data-position={position}
                data-visible={isOrbitVisible}
                key={`${hero.source ?? "program"}-${hero.slug}`}
                onClick={() => setActiveIndex(index)}
                style={cardStyle}
                tabIndex={isOrbitVisible ? 0 : -1}
                type="button"
              >
                <div className="final-hero-card__image">
                  {image ? (
                    <Image
                      alt=""
                      fill
                      fetchPriority={index === 0 ? "high" : "auto"}
                      loading="eager"
                      sizes="96px"
                      src={image}
                    />
                  ) : (
                    <span className={`final-hero-card__fallback bg-gradient-to-br ${hero.tone}`} />
                  )}
                </div>
                <span className="final-hero-card__progress" key={`${hero.slug}-${rotationKey}`}>
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" pathLength="100" r="10" />
                  </svg>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MutedIcon() {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m17 9 4 6M21 9l-4 6" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12" />
    </svg>
  );
}
