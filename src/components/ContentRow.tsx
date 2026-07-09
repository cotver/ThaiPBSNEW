"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { titleEyebrow, titleHref, titleInlineText, type Title } from "@/lib/content";
import { serializeWatchHistory, watchHistoryCookieName } from "@/lib/watch-history";
import { DiscontinuedBadge } from "./DiscontinuedBadge";
import { PosterCard, WideCard } from "./PosterCard";
import { SaveForLaterButton } from "./SaveForLaterButton";
import { TitlePreviewModal } from "./TitlePreviewModal";

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
  const firstSeasonTrailer = seasonsWithTrailer[0];
  const seasonTrailer = latestSeasonTrailer ?? firstSeasonTrailer;

  return { mimeType: seasonTrailer?.trailerMimeType, url: seasonTrailer?.trailerUrl ?? "" };
}

export function ContentRow({
  layout = "vertical",
  matchSourceTitles = [],
  titles,
  title,
  removable = false,
  viewAllHref,
  viewAllLabel = "View All",
}: {
  layout?: "poster" | "vertical" | "wide";
  matchSourceTitles?: Title[];
  removable?: boolean;
  titles: Title[];
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const didDragRef = useRef(false);
  const closePreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasScrollableOverflow, setHasScrollableOverflow] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activePreview, setActivePreview] = useState<ActivePreview | null>(null);
  const [modalTitle, setModalTitle] = useState<Title | null>(null);
  const [removedTitleSlugs, setRemovedTitleSlugs] = useState<Set<string>>(() => new Set());
  const visibleTitles = useMemo(
    () => titles.filter((item) => !removedTitleSlugs.has(item.slug)),
    [removedTitleSlugs, titles],
  );

  const clearPreviewTimer = useCallback(() => {
    if (closePreviewTimerRef.current) {
      clearTimeout(closePreviewTimerRef.current);
      closePreviewTimerRef.current = null;
    }
  }, []);

  const closePreview = useCallback(() => {
    clearPreviewTimer();
    closePreviewTimerRef.current = setTimeout(() => {
      setActivePreview(null);
      closePreviewTimerRef.current = null;
    }, 110);
  }, [clearPreviewTimer]);

  const openPreview = useCallback(
    (item: Title, element: HTMLElement) => {
      if (item.isDiscontinued) return;
      if (!rootRef.current || !railRef.current) return;

      clearPreviewTimer();
      const anchor = element.getBoundingClientRect();
      const root = rootRef.current.getBoundingClientRect();
      const rail = railRef.current.getBoundingClientRect();
      const safeMinLeft = Math.max(0, rail.left - root.left);
      const safeMaxRight = Math.min(root.width, rail.right - root.left);
      const requestedWidth =
        layout === "wide"
          ? anchor.width * 1.22
          : layout === "vertical"
            ? Math.max(anchor.width * 2.04, 332)
            : Math.max(anchor.width * 1.42, anchor.width + 88);
      const maxWidth = Math.max(anchor.width, safeMaxRight - safeMinLeft);
      const width = Math.min(Math.max(requestedWidth, anchor.width + 48), maxWidth);
      const anchorLeft = anchor.left - root.left;
      const anchorTop = anchor.top - root.top;
      const anchorCenter = anchorLeft + anchor.width / 2;
      const left = clamp(anchorCenter - width / 2, safeMinLeft, Math.max(safeMinLeft, safeMaxRight - width));
      const top = Math.max(anchorTop - 14, -4);
      const originPercent = width > 0 ? ((anchorCenter - left) / width) * 100 : 50;
      const originX = `${clamp(originPercent, 14, 86)}%`;

      setActivePreview({
        anchorHeight: anchor.height,
        anchorWidth: anchor.width,
        left,
        originX,
        safeLeft: safeMinLeft,
        safeRight: safeMaxRight,
        title: item,
        top,
        width,
      });
    },
    [clearPreviewTimer, layout],
  );

  function updateScrollState() {
    const rail = railRef.current;

    if (!rail) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      setHasScrollableOverflow(false);
      return;
    }

    const maxScroll = rail.scrollWidth - rail.clientWidth;

    setHasScrollableOverflow(maxScroll > 2);
    setCanScrollLeft(rail.scrollLeft > 2);
    setCanScrollRight(rail.scrollLeft < maxScroll - 2);
  }

  useEffect(() => {
    if (railRef.current) {
      railRef.current.scrollLeft = 0;
      updateScrollState();
    }
  }, [title, visibleTitles]);

  useEffect(() => {
    const rail = railRef.current;

    if (!rail) {
      return;
    }

    updateScrollState();

    const closeOnScroll = () => {
      updateScrollState();
      setActivePreview(null);
    };

    rail.addEventListener("scroll", closeOnScroll, { passive: true });
    window.addEventListener("resize", closeOnScroll);

    return () => {
      rail.removeEventListener("scroll", closeOnScroll);
      window.removeEventListener("resize", closeOnScroll);
    };
  }, [visibleTitles]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    function moveWindowDrag(event: MouseEvent) {
      const rail = railRef.current;

      if (!rail) {
        return;
      }

      const delta = event.clientX - dragStartXRef.current;

      if (Math.abs(delta) > 6) {
        didDragRef.current = true;
        setActivePreview(null);
      }

      rail.scrollLeft = dragStartScrollRef.current - delta;
      event.preventDefault();
    }

    function stopWindowDrag() {
      setIsDragging(false);
    }

    window.addEventListener("mousemove", moveWindowDrag);
    window.addEventListener("mouseup", stopWindowDrag);

    return () => {
      window.removeEventListener("mousemove", moveWindowDrag);
      window.removeEventListener("mouseup", stopWindowDrag);
    };
  }, [isDragging]);

  useEffect(() => {
    return () => clearPreviewTimer();
  }, [clearPreviewTimer]);

  function scrollRail(direction: "left" | "right") {
    const rail = railRef.current;

    if (!rail) {
      return;
    }

    setActivePreview(null);
    const distance = Math.max(rail.clientWidth * 0.82, 320);
    rail.scrollBy({
      behavior: "smooth",
      left: direction === "right" ? distance : -distance,
    });

    window.setTimeout(updateScrollState, 360);
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    const rail = railRef.current;

    if (!rail || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }

    setActivePreview(null);
    didDragRef.current = false;
    setIsDragging(true);
    dragStartXRef.current = event.clientX;
    dragStartScrollRef.current = rail.scrollLeft;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function startMouseDrag(event: React.MouseEvent<HTMLDivElement>) {
    const rail = railRef.current;

    if (!rail || event.button !== 0) {
      return;
    }

    setActivePreview(null);
    didDragRef.current = false;
    setIsDragging(true);
    dragStartXRef.current = event.clientX;
    dragStartScrollRef.current = rail.scrollLeft;
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    const rail = railRef.current;

    if (!rail || !isDragging) {
      return;
    }

    const delta = event.clientX - dragStartXRef.current;

    if (Math.abs(delta) > 6) {
      didDragRef.current = true;
      setActivePreview(null);
    }

    rail.scrollLeft = dragStartScrollRef.current - delta;
  }

  function stopDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (isDragging) {
      setIsDragging(false);
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function stopMouseDrag() {
    if (isDragging) {
      setIsDragging(false);
    }
  }

  function preventClickAfterDrag(event: React.MouseEvent<HTMLDivElement>) {
    if (didDragRef.current) {
      event.preventDefault();
      event.stopPropagation();
      didDragRef.current = false;
    }
  }

  function removeFromContinueWatching(item: Title) {
    const cookieValue = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(`${watchHistoryCookieName}=`))
      ?.slice(watchHistoryCookieName.length + 1);
    let slugs: string[] = [];

    if (cookieValue) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookieValue));
        slugs = Array.isArray(parsed) ? parsed.filter((slug): slug is string => typeof slug === "string") : [];
      } catch {
        slugs = [];
      }
    }

    const nextSlugs = slugs.filter((slug) => slug !== item.slug);
    document.cookie = `${watchHistoryCookieName}=${serializeWatchHistory(nextSlugs)}; path=/; max-age=15552000; samesite=lax`;
    setRemovedTitleSlugs((current) => new Set(current).add(item.slug));
    setActivePreview(null);
    setModalTitle(null);
  }

  if (visibleTitles.length === 0) {
    return null;
  }

  const usesSafeRail = layout === "poster" || layout === "vertical" || layout === "wide";
  const railSafeClass = usesSafeRail
    ? `md:pl-0 md:scroll-pl-0 ${
        hasScrollableOverflow ? "md:pr-16 md:scroll-pr-16" : "md:pr-0 md:scroll-pr-0"
      }`
    : "";

  return (
    <section className="relative">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-black md:text-xl">{title}</h2>
        {viewAllHref ? (
          <Link
            className="group inline-flex shrink-0 items-center gap-1 text-xs font-black uppercase text-white/58 transition hover:text-white md:text-sm"
            href={viewAllHref}
          >
            {viewAllLabel}
            <span className="translate-y-px text-base leading-none transition group-hover:translate-x-0.5">›</span>
          </Link>
        ) : null}
      </div>
      <div className="group/rail relative overflow-visible" ref={rootRef}>
        {canScrollLeft ? (
          <button
            aria-label={`Scroll ${title} left`}
            className="absolute bottom-3 left-0 top-0 z-[90] hidden w-12 place-items-center bg-gradient-to-r from-[#030714]/70 via-[#030714]/20 to-transparent text-white opacity-0 transition duration-200 hover:text-white group-hover/rail:opacity-100 md:grid"
            onClick={() => scrollRail("left")}
            type="button"
          >
            <Chevron direction="left" />
          </button>
        ) : null}
        <div
          className={`no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pt-2 ${railSafeClass} ${
            isDragging ? "cursor-grabbing scroll-auto select-none" : "cursor-grab scroll-smooth"
          }`}
          data-content-rail={title}
          onClickCapture={preventClickAfterDrag}
          onDragStart={(event) => event.preventDefault()}
          onMouseDown={startMouseDrag}
          onMouseLeave={stopMouseDrag}
          onMouseMove={(event) => {
            const rail = railRef.current;

            if (!rail || !isDragging) {
              return;
            }

            const delta = event.clientX - dragStartXRef.current;

            if (Math.abs(delta) > 6) {
              didDragRef.current = true;
              setActivePreview(null);
            }

            rail.scrollLeft = dragStartScrollRef.current - delta;
          }}
          onMouseUp={stopMouseDrag}
          onPointerCancel={stopDrag}
          onPointerDown={startDrag}
          onPointerLeave={stopDrag}
          onPointerMove={moveDrag}
          onPointerUp={stopDrag}
          ref={railRef}
        >
          {visibleTitles.map((item) =>
            layout === "wide" ? (
              <WideCard
                key={item.slug}
                onRemoveTitle={removable ? removeFromContinueWatching : undefined}
                onOpenTitle={setModalTitle}
                onPreviewEnd={closePreview}
                onPreviewStart={openPreview}
                title={item}
              />
            ) : (
              <PosterCard
                key={item.slug}
                onOpenTitle={setModalTitle}
                orientation={layout === "vertical" ? "portrait" : "landscape"}
                onRemoveTitle={removable ? removeFromContinueWatching : undefined}
                onPreviewEnd={closePreview}
                onPreviewStart={openPreview}
                rail
                title={item}
              />
            ),
          )}
        </div>
        {activePreview ? (
        <RowFloatingPreview
          active={activePreview}
          matchSourceTitles={matchSourceTitles}
          onClose={closePreview}
          onEnter={clearPreviewTimer}
          onOpenTitle={setModalTitle}
          onRemoveTitle={removable ? removeFromContinueWatching : undefined}
        />
        ) : null}
        {canScrollRight ? (
          <button
            aria-label={`Scroll ${title} right`}
            className="absolute bottom-3 right-0 top-0 z-[90] hidden w-12 place-items-center bg-gradient-to-l from-[#030714]/70 via-[#030714]/20 to-transparent text-white opacity-0 transition duration-200 hover:text-white group-hover/rail:opacity-100 md:grid"
            onClick={() => scrollRail("right")}
            type="button"
          >
            <Chevron direction="right" />
          </button>
        ) : null}
      </div>
      <TitlePreviewModal onClose={() => setModalTitle(null)} open={Boolean(modalTitle)} title={modalTitle} />
    </section>
  );
}

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
            {title.isDiscontinued ? (
              <span className="text-red-200">Discontinued</span>
            ) : null}
            {matchPercent ? (
              <span className="text-emerald-300">{matchPercent}% Match</span>
            ) : null}
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function calculateTitleMatch(title: Title, sourceTitles: Title[]) {
  const profile = buildPreferenceProfile(sourceTitles.filter((sourceTitle) => sourceTitle.slug !== title.slug));

  if (!profile) {
    return null;
  }

  const genreScore = scoreTokens(normalizeGenreTokens(title.genre), profile.genres);
  const categoryScore = scoreTokens(normalizeTokens([...(title.categoryNames ?? []), ...(title.categorySlugs ?? [])]), profile.categories);
  const typeSlugScore = scoreTokens(normalizeTokens(title.typeSlugs ?? []), profile.typeSlugs);
  const typeScore = profile.types.get(normalizeToken(title.type)) ?? 0;
  const flagScore = scoreTokens(getTitleFlags(title), profile.flags);

  const weightedScore =
    genreScore * 34 +
    categoryScore * 26 +
    typeScore * 22 +
    typeSlugScore * 12 +
    flagScore * 6;

  if (weightedScore < 24) {
    return null;
  }

  return Math.round(clamp(62 + weightedScore * 0.37, 70, 99));
}

function buildPreferenceProfile(sourceTitles: Title[]) {
  const titles = sourceTitles.filter((title) => !title.isDiscontinued);

  if (titles.length === 0) {
    return null;
  }

  return {
    categories: buildTokenWeights(titles.flatMap((title) => normalizeTokens([...(title.categoryNames ?? []), ...(title.categorySlugs ?? [])]))),
    flags: buildTokenWeights(titles.flatMap(getTitleFlags)),
    genres: buildTokenWeights(titles.flatMap((title) => normalizeGenreTokens(title.genre))),
    types: buildTokenWeights(titles.map((title) => normalizeToken(title.type)).filter(Boolean)),
    typeSlugs: buildTokenWeights(titles.flatMap((title) => normalizeTokens(title.typeSlugs ?? []))),
  };
}

function buildTokenWeights(tokens: string[]) {
  const weights = new Map<string, number>();
  const cleanTokens = tokens.filter(Boolean);

  if (cleanTokens.length === 0) {
    return weights;
  }

  for (const token of cleanTokens) {
    weights.set(token, (weights.get(token) ?? 0) + 1);
  }

  for (const [token, count] of weights) {
    weights.set(token, count / cleanTokens.length);
  }

  return weights;
}

function scoreTokens(tokens: string[], weights: Map<string, number>) {
  if (tokens.length === 0 || weights.size === 0) {
    return 0;
  }

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
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.2"
      viewBox="0 0 24 24"
    >
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
  const [mediaState, setMediaState] = useState({
    ended: false,
    failed: false,
    ready: false,
    url: "",
  });
  const [mutedState, setMutedState] = useState({
    muted: true,
    url: "",
  });
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
    setMediaState((state) => ({
      ...state,
      failed: false,
      ready: true,
      url: trailerUrl,
    }));
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
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      markReady();
    }

    video.play()
      .then(markReady)
      .catch(() => {
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          markReady();
        }
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
        setMediaState((state) => ({
          ...state,
          ended: true,
          url: trailerUrl,
        }));
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
          onEnded={() => {
            setMediaState((state) => ({
              ...state,
              ended: true,
              url: trailerUrl,
            }));
          }}
          onError={() => {
            videoRef.current?.pause();
            setMediaState((state) => ({
              ...state,
              failed: true,
              ready: false,
              url: trailerUrl,
            }));
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
            setMutedState({
              muted: nextMuted,
              url: trailerUrl,
            });
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

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      className="size-9 drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.6"
      viewBox="0 0 24 24"
    >
      {direction === "left" ? <path d="m15 5-7 7 7 7" /> : <path d="m9 5 7 7-7 7" />}
    </svg>
  );
}
