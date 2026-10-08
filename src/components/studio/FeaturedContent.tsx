"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PREFER_TRAILER_SOUND } from "@/lib/features";
import { playVideoWithSoundFallback, toYouTubeEmbedUrl, trailerKind as kindOf } from "@/lib/trailer-playback";
import { lotProgramHref, type LotLinkItem, type LotProgram } from "@/lib/studio/data";
import styles from "@/components/studio/studio-lot.module.css";
import { Artwork, EmptyNote, ProgramMeta } from "./LotSections";

/** Same hold as the hall's LED walls and /home's HeroCarousel. */
const AUTO_SLIDE_MS = 6500;

/**
 * A hall screen to follow and steer: which slide it shows, how to put another one up, and how to hold
 * it on the current slide while that slide's trailer plays here.
 */
export type HallScreen = {
  active: number;
  onActiveChange: (index: number) => void;
  onHold?: (held: boolean) => void;
  /** Mirror this panel's playing trailer video on the hall's wall (null hands the wall back). */
  onVideo?: (video: HTMLVideoElement | null) => void;
};

/**
 * Whether the hall can draw this video: WebGL can only take frames from a same-origin video (this one
 * has no CORS request, so it can still play here from anywhere).
 */
function sameOrigin(url: string) {
  try {
    return new URL(url, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

/** A slide's moving picture. `direct` plays any URL as a video file (StudiosHero), as on /home. */
type Trailer = { url: string; mimeType?: string; direct?: boolean };

/** `href` is left out for a slide with nothing to open; the screen then shows it without a link. */
type Slide = { key: string; title: string; image?: string; href?: string; cursor: string; copy: ReactNode; trailer?: Trailer };

/** How /home's HeroCarousel plays it: GIF, YouTube embed, video file, or a button that opens it. */
function trailerKind(trailer?: Trailer) {
  return kindOf(trailer?.url, trailer?.mimeType, trailer?.direct);
}

/**
 * The active slide's trailer over its art, like /home's HeroCarousel: plays with sound when the browser
 * allows it (falling back to muted), fades in once it has a frame, and reports when it ends or fails.
 */
function ScreenTrailer({ trailer, poster, muted, controls, onMutedChange, onMutedFallback, onEnded, onFailed, onVideo }: { trailer: Trailer; poster?: string; muted: boolean; controls: boolean; onMutedChange: (muted: boolean) => void; onMutedFallback: () => void; onEnded: () => void; onFailed: () => void; onVideo?: (video: HTMLVideoElement | null) => void }) {
  const kind = trailerKind(trailer);
  const embed = kind === "youtube" ? toYouTubeEmbedUrl(trailer.url) : null;
  const [loaded, setLoaded] = useState(false);
  // Fade in only once this slide's art has fully replaced the last one (.featureSlide's 700ms), so the
  // picture under the trailer is always this program's, never the previous slide's.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(true), 700);
    return () => window.clearTimeout(timer);
  }, []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // The embed opens in the mute state it started with; later toggles go through the player API, no reload.
  const [startMuted] = useState(muted);
  const callbacks = useRef({ onMutedChange, onMutedFallback, onEnded, onFailed, onVideo });
  useEffect(() => {
    callbacks.current = { onMutedChange, onMutedFallback, onEnded, onFailed, onVideo };
  });

  // Once this video is playing, the hall's wall shows the very same element — same frame, same time.
  // It is handed back when the trailer ends, fails, or the slide changes (this unmounts).
  const sharedVideo = useRef(false);
  const share = () => {
    const video = videoRef.current;
    if (!video || sharedVideo.current || !sameOrigin(trailer.url)) return;
    sharedVideo.current = true;
    callbacks.current.onVideo?.(video);
  };
  useEffect(
    () => () => {
      if (sharedVideo.current) callbacks.current.onVideo?.(null);
    },
    [],
  );

  // Video file, as HeroCarousel: (re)start with the current mute state, nudge it again while it buffers,
  // and pause while the tab is hidden.
  const playVideo = useRef(() => {});
  useEffect(() => {
    const video = videoRef.current;
    if (kind !== "video" || !video) return;
    const sync = () => {
      if (document.hidden) return video.pause();
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) setLoaded(true);
      void playVideoWithSoundFallback(video, muted, () => callbacks.current.onMutedFallback()).then((playing) => {
        if (playing || video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) setLoaded(true);
      });
    };
    playVideo.current = sync;
    const frame = window.requestAnimationFrame(sync);
    const timers = [window.setTimeout(sync, 250), window.setTimeout(sync, 900)];
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [kind, muted]);

  // YouTube: mute/unmute and play/pause through the iframe API, and hear when it ends.
  useEffect(() => {
    if (kind !== "youtube") return;
    const command = (func: string, args: unknown[] = []) => {
      try {
        iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
      } catch {}
    };
    const sync = () => {
      command(document.hidden ? "pauseVideo" : "playVideo");
      command(muted ? "mute" : "unMute");
      if (!muted) command("setVolume", [100]);
      command("addEventListener", ["onStateChange"]);
    };
    const onMessage = (event: MessageEvent) => {
      if (!event.origin.toLowerCase().includes("youtube")) return;
      let payload: unknown = event.data;
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }
      if (payload && typeof payload === "object" && "event" in payload && "info" in payload && payload.event === "onStateChange" && payload.info === 0) {
        callbacks.current.onEnded();
      }
    };
    sync();
    const iframe = iframeRef.current;
    iframe?.addEventListener("load", sync);
    window.addEventListener("message", onMessage);
    document.addEventListener("visibilitychange", sync);
    return () => {
      iframe?.removeEventListener("load", sync);
      window.removeEventListener("message", onMessage);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [kind, muted]);

  if (kind === "external") {
    return (
      <button className={styles.screenTrailerOut} onClick={() => window.open(trailer.url, "_blank", "noopener,noreferrer")} type="button">
        <span>Trailer</span>
      </button>
    );
  }
  const shown = (loaded && settled) || undefined;
  if (kind === "gif") {
    return <Image alt="" className={styles.screenTrailer} data-shown={shown} fill onLoad={() => setLoaded(true)} sizes="(max-width: 900px) 100vw, 580px" src={trailer.url} unoptimized />;
  }
  if (embed) {
    return (
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className={styles.screenTrailer}
        data-shown={shown}
        onLoad={() => setLoaded(true)}
        ref={iframeRef}
        referrerPolicy="strict-origin-when-cross-origin"
        src={`${embed}?autoplay=1&mute=${startMuted ? 1 : 0}&playsinline=1&rel=0&enablejsapi=1`}
        title="Trailer player"
      />
    );
  }
  return (
    <video
      aria-hidden={!controls}
      autoPlay
      className={styles.screenTrailer}
      // Full screen: a proper player (play/pause, seek, time, volume).
      controls={controls}
      controlsList="nodownload noremoteplayback"
      data-shown={shown}
      disablePictureInPicture
      disableRemotePlayback
      draggable={false}
      muted={muted}
      onCanPlay={() => playVideo.current()}
      onContextMenu={(event) => event.preventDefault()}
      onEnded={() => callbacks.current.onEnded()}
      onError={() => {
        videoRef.current?.pause();
        callbacks.current.onFailed();
      }}
      onLoadedData={() => playVideo.current()}
      onPlaying={() => {
        setLoaded(true);
        share();
      }}
      onStalled={() => callbacks.current.onFailed()}
      // The player's own mute/volume buttons drive the shared mute state, so the panel button agrees.
      onVolumeChange={(event) => {
        const video = event.currentTarget;
        const silent = video.muted || video.volume === 0;
        if (silent !== muted) callbacks.current.onMutedChange(silent);
      }}
      playsInline
      poster={poster}
      preload="auto"
      ref={videoRef}
      src={trailer.url}
    />
  );
}

/**
 * A screen room in the panel: the big 16:9 screen cycling its slides (as on the hall wall), and every
 * slide beneath it — pick one to put it on the screen, as on /home. A slide's trailer plays over its art
 * (with sound where allowed, and a mute toggle) and holds the slide until it ends. Given `screen`, it
 * follows and steers the hall's LED wall; without it, it runs its own clock.
 */
function ScreenContent({ slides, screen, badge, listLabel, empty }: { slides: Slide[]; screen?: HallScreen; badge: string; listLabel: string; empty: string }) {
  const [own, setOwn] = useState(0);
  const [pickKey, setPickKey] = useState(0);
  const following = screen !== undefined;
  const active = Math.min(Math.max(0, following ? screen.active : own), Math.max(0, slides.length - 1));
  const current = slides[active];
  // Sound on by default where the browser allows it; the choice carries over from slide to slide.
  const [muted, setMuted] = useState(!PREFER_TRAILER_SOUND);
  /** The slide whose trailer has ended or failed — it then sits on its art and the clock runs again. */
  const [doneKey, setDoneKey] = useState<string | null>(null);
  const kind = trailerKind(current?.trailer);
  // A playing video or embed holds the slide until it ends, as on /home; a GIF loops under the normal clock.
  const trailerRunning = Boolean(current) && (kind === "video" || kind === "youtube") && doneKey !== current?.key;

  // Our own clock only when nothing else drives the screen; the hall's LED wall keeps time otherwise.
  useEffect(() => {
    if (following || trailerRunning || slides.length < 2) return;
    const timer = window.setTimeout(() => setOwn((index) => (index + 1) % slides.length), AUTO_SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [following, trailerRunning, own, pickKey, slides.length]);

  // Hold the hall's screen on this slide while its trailer plays here; let it go when the panel closes.
  const onHold = useRef(screen?.onHold);
  useEffect(() => {
    onHold.current = screen?.onHold;
  });
  useEffect(() => {
    onHold.current?.(trailerRunning);
  }, [trailerRunning]);
  useEffect(() => () => onHold.current?.(false), []);

  // Full screen: the screen itself goes full screen (the same element, so the trailer plays on unbroken
  // and the hall's wall stays in sync), growing out of the panel with the screenFull animation.
  const artRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const art = artRef.current;
    const sync = () => {
      const element = document.fullscreenElement;
      // The video player's own full-screen button, pressed while the screen is already full screen, asks
      // for the video on top of it — read that as "leave full screen", like the same button on /home.
      if (art && element && element !== art && art.contains(element)) {
        void exitAllFullscreen();
        return;
      }
      setFullscreen(Boolean(art) && element === art);
    };
    document.addEventListener("fullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      // Closing the panel mid-trailer leaves full screen too.
      if (art && document.fullscreenElement && art.contains(document.fullscreenElement)) void exitAllFullscreen();
    };
  }, []);
  const toggleFullscreen = () => {
    const art = artRef.current;
    if (!art) return;
    if (document.fullscreenElement) {
      void exitAllFullscreen();
      return;
    }
    if (art.requestFullscreen) {
      void art.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
      return;
    }
    // iPhone Safari only lets a video itself go full screen.
    (art.querySelector("video") as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null)?.webkitEnterFullscreen?.();
  };

  if (!current) return <EmptyNote>{empty}</EmptyNote>;

  const pick = (index: number) => {
    setOwn(index);
    setPickKey((key) => key + 1);
    screen?.onActiveChange(index);
  };
  const trailer = doneKey !== current.key ? current.trailer : undefined;

  return (
    <div className={styles.premiere}>
      <div className={styles.premiereLead}>
        <div className={styles.premiereArt} data-fullscreen={fullscreen || undefined} ref={artRef}>
          {slides.map((slide, index) => (
            <span aria-hidden={index !== active} className={styles.featureSlide} data-active={index === active || undefined} key={slide.key}>
              <Artwork alt="" priority={index === active} sizes="(max-width: 900px) 100vw, 580px" src={slide.image} tone={index} />
            </span>
          ))}
          {trailer ? (
            <ScreenTrailer
              key={`${current.key}:${trailer.url}`}
              controls={fullscreen}
              muted={muted}
              onEnded={() => {
                setDoneKey(current.key);
                if (slides.length > 1) pick((active + 1) % slides.length);
              }}
              onFailed={() => setDoneKey(current.key)}
              onMutedChange={setMuted}
              onMutedFallback={() => setMuted(true)}
              onVideo={screen?.onVideo}
              poster={current.image}
              trailer={trailer}
            />
          ) : null}
          <span className={styles.premiereBadge}>
            <span className={styles.recDot} /> {badge} · {active + 1}/{slides.length}
          </span>
          {fullscreen ? (
            <span className={styles.screenFullTitle}>{current.title}</span>
          ) : null}
          <span className={styles.screenControls}>
            {trailerRunning && !fullscreen ? (
              <button
                aria-label={muted ? "Unmute trailer" : "Mute trailer"}
                className={styles.screenMute}
                data-cursor={muted ? "Unmute" : "Mute"}
                onClick={() => setMuted((value) => !value)}
                title={muted ? "Unmute" : "Mute"}
                type="button"
              >
                {muted ? <MutedIcon /> : <VolumeIcon />}
              </button>
            ) : null}
            {trailerRunning || fullscreen ? (
              <button
                aria-label={fullscreen ? "Exit full screen" : "Watch full screen"}
                className={styles.screenMute}
                data-cursor={fullscreen ? "Exit full screen" : "Full screen"}
                onClick={toggleFullscreen}
                title={fullscreen ? "Exit full screen" : "Full screen"}
                type="button"
              >
                {fullscreen ? <ShrinkIcon /> : <ExpandIcon />}
              </button>
            ) : null}
          </span>
        </div>
        {current.href ? (
          <Link prefetch={false} className={styles.premiereCopy} data-cursor={current.cursor} href={current.href}>
            {current.copy}
          </Link>
        ) : (
          <div className={styles.premiereCopy}>{current.copy}</div>
        )}
      </div>

      {/* Shown even for a single slide, so every screen room reads the same. */}
      {slides.length ? (
        <ol aria-label={listLabel} className={styles.featureList}>
          {slides.map((slide, index) => (
            <li key={slide.key}>
              <button
                aria-label={`Show ${slide.title}`}
                aria-pressed={index === active}
                className={styles.featurePick}
                data-cursor="Put it on the screen"
                onClick={() => {
                  // Picking a slide again replays its trailer.
                  if (index === active) setDoneKey(null);
                  pick(index);
                }}
                type="button"
              >
                <span className={styles.orderThumb}>
                  <Artwork alt="" sizes="(max-width: 700px) 45vw, 180px" src={slide.image} tone={index} />
                </span>
                <span className={styles.featurePickTitle}>{slide.title}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

/** Leave full screen completely, however many levels deep (the screen, then the video on top of it). */
async function exitAllFullscreen() {
  for (let level = 0; level < 3 && document.fullscreenElement; level += 1) {
    try {
      await document.exitFullscreen();
    } catch {
      return;
    }
  }
}

function ExpandIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" viewBox="0 0 24 24" width="18">
      <path d="M4 9V4h5" />
      <path d="M20 9V4h-5" />
      <path d="M4 15v5h5" />
      <path d="M20 15v5h-5" />
    </svg>
  );
}

function ShrinkIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" viewBox="0 0 24 24" width="18">
      <path d="M9 4v5H4" />
      <path d="M15 4v5h5" />
      <path d="M9 20v-5H4" />
      <path d="M15 20v-5h5" />
    </svg>
  );
}

function MutedIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeWidth="2.1" viewBox="0 0 24 24" width="20">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m17 9 4 6" />
      <path d="m21 9-4 6" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeWidth="2.1" viewBox="0 0 24 24" width="20">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a4 4 0 0 1 0 7" />
      <path d="M18 6a7 7 0 0 1 0 12" />
    </svg>
  );
}

/** HeroCarousel: the featured programmes. */
export function FeaturedContent({ programs, screen }: { programs: LotProgram[]; screen?: HallScreen }) {
  const slides = programs.map((program) => ({
    key: program.slug,
    title: program.title,
    image: program.hero,
    // Hero images and discontinued programs have no program page to open, as on /home.
    href: program.linkable ? lotProgramHref(program.slug) : undefined,
    cursor: "Enter the screening room",
    trailer: program.trailerUrl ? { url: program.trailerUrl, mimeType: program.trailerMimeType } : undefined,
    copy: (
      <>
        <ProgramMeta program={program} />
        <span className={styles.premiereTitle}>{program.title}</span>
        <span className={styles.premiereText}>{program.description}</span>
        {program.linkable ? <span className={styles.textLink}>Open the program →</span> : null}
      </>
    ),
  }));
  return <ScreenContent badge="Now screening" empty="No featured programs yet." listLabel="All featured programs" screen={screen} slides={slides} />;
}

/** StudiosHero (ThaiPBS Journal): the featured stories. */
export function StoryScreenContent({ items, screen, viewAllHref }: { items: LotLinkItem[]; screen?: HallScreen; viewAllHref?: string }) {
  const slides = items.map((item) => ({
    key: item.id,
    title: item.title,
    image: item.image,
    href: item.href,
    cursor: `Open ${item.title}`,
    trailer: item.video ? { url: item.video.url, mimeType: item.video.mimeType, direct: true } : undefined,
    copy: (
      <>
        {item.meta ? <span className={styles.meta}>{item.meta}</span> : null}
        <span className={styles.premiereTitle}>{item.title}</span>
        <span className={styles.textLink}>Read the story →</span>
      </>
    ),
  }));
  return (
    <div className={styles.shortlist}>
      <ScreenContent badge="On screen" empty="No stories yet." listLabel="All stories" screen={screen} slides={slides} />
      {viewAllHref ? (
        <Link prefetch={false} className={styles.primaryButton} href={viewAllHref}>
          View all
        </Link>
      ) : null}
    </div>
  );
}
