"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { titleEyebrow, titleHref, type Title } from "@/lib/content";
import { serializeWatchHistory, watchHistoryCookieName } from "@/lib/watch-history";
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

export function ContentRow({
  layout = "vertical",
  titles,
  title,
  removable = false,
  viewAllHref,
  viewAllLabel = "View All",
}: {
  layout?: "poster" | "vertical" | "wide";
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
  const [visibleTitles, setVisibleTitles] = useState(titles);

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
      if (!rootRef.current || !railRef.current) return;

      clearPreviewTimer();
      const anchor = element.getBoundingClientRect();
      const root = rootRef.current.getBoundingClientRect();
      const rail = railRef.current.getBoundingClientRect();
      const arrowSafeRight = canScrollRight ? 60 : 0;
      const safePad = layout === "vertical" ? 12 : 16;
      const safeMinLeft = Math.max(0, rail.left - root.left) + safePad;
      const safeMaxRight = Math.min(root.width, rail.right - root.left) - arrowSafeRight - safePad;
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
    [canScrollLeft, canScrollRight, clearPreviewTimer, layout],
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
    setVisibleTitles(titles);
  }, [titles]);

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
    setVisibleTitles((current) => current.filter((titleItem) => titleItem.slug !== item.slug));
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
  onClose,
  onEnter,
  onOpenTitle,
  onRemoveTitle,
}: {
  active: ActivePreview;
  onClose: () => void;
  onEnter: () => void;
  onOpenTitle: (title: Title) => void;
  onRemoveTitle?: (title: Title) => void;
}) {
  const { title } = active;
  const imageSrc = title.heroImage || title.posterImage;
  const imageClassName = title.isDiscontinued ? "object-cover grayscale" : "object-cover";
  const previewScaleX = Math.max(0.72, Math.min(1, active.anchorWidth / active.width));

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
        <button
          aria-label={`Open details for ${title.title}`}
          className="block w-full text-left outline-none"
          onClick={() => onOpenTitle(title)}
          type="button"
        >
          <div className={`relative aspect-video bg-gradient-to-br ${title.tone}`}>
            {imageSrc ? (
              <Image alt="" className={imageClassName} fill sizes={`${Math.ceil(active.width)}px`} src={imageSrc} />
            ) : null}
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(17,24,39,0.58),transparent_54%),radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.20),transparent_24%)]" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/90">
                {titleEyebrow(title)}
              </p>
              <h3 className="mt-1 line-clamp-1 text-xl font-black leading-tight">{title.title}</h3>
            </div>
          </div>
        </button>

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
            <span className="text-emerald-300">98% Match</span>
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
