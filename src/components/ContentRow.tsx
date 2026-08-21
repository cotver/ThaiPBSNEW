"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Title } from "@/lib/content";
import { serializeWatchHistory, watchHistoryCookieName } from "@/lib/watch-history";
import { PosterCard, WideCard } from "./PosterCard";
import { RowFloatingPreview, type ActivePreview } from "./RowFloatingPreview";
import { TitlePreviewModal } from "./TitlePreviewModal";

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
        anchorImageSrc: element.querySelector("img")?.currentSrc || undefined,
        anchorLeft,
        anchorTop,
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
        <RowFloatingPreview
          active={activePreview}
          matchSourceTitles={matchSourceTitles}
          onClose={closePreview}
          onEnter={clearPreviewTimer}
          onOpenTitle={setModalTitle}
          onRemoveTitle={removable ? removeFromContinueWatching : undefined}
        />
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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
