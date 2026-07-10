"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Title } from "@/lib/content";
import { RowFloatingPreview, type ActivePreview } from "./ContentRow";
import { PosterCard } from "./PosterCard";
import { TitlePreviewModal } from "./TitlePreviewModal";

const titleLoadBatchSize = 70;

export function BrowseTitleGrid({ titles }: { titles: Title[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const closePreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activePreview, setActivePreview] = useState<ActivePreview | null>(null);
  const [modalTitle, setModalTitle] = useState<Title | null>(null);
  const [visibleCount, setVisibleCount] = useState(titleLoadBatchSize);
  const visibleTitles = titles.slice(0, visibleCount);
  const hasMoreTitles = visibleCount < titles.length;

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
      if (!rootRef.current) return;

      clearPreviewTimer();
      const anchor = element.getBoundingClientRect();
      const root = rootRef.current.getBoundingClientRect();
      const safeMinLeft = 0;
      const safeMaxRight = root.width;
      const requestedWidth = Math.max(anchor.width * 2.04, 332);
      const maxWidth = Math.max(anchor.width, safeMaxRight - safeMinLeft);
      const width = Math.min(Math.max(requestedWidth, anchor.width + 48), maxWidth);
      const anchorLeft = anchor.left - root.left;
      const anchorTop = anchor.top - root.top;
      const anchorCenter = anchorLeft + anchor.width / 2;
      const left = clamp(anchorCenter - width / 2, safeMinLeft, Math.max(safeMinLeft, safeMaxRight - width));
      const top = Math.max(anchorTop - 14, -4);
      const originPercent = width > 0 ? ((anchorCenter - left) / width) * 100 : 50;

      setActivePreview({
        anchorHeight: anchor.height,
        anchorWidth: anchor.width,
        left,
        originX: `${clamp(originPercent, 14, 86)}%`,
        safeLeft: safeMinLeft,
        safeRight: safeMaxRight,
        title: item,
        top,
        width,
      });
    },
    [clearPreviewTimer],
  );

  useEffect(() => {
    const closeOnViewportChange = () => setActivePreview(null);

    window.addEventListener("resize", closeOnViewportChange);
    window.addEventListener("scroll", closeOnViewportChange, { passive: true });

    return () => {
      window.removeEventListener("resize", closeOnViewportChange);
      window.removeEventListener("scroll", closeOnViewportChange);
    };
  }, []);

  useEffect(() => {
    return () => clearPreviewTimer();
  }, [clearPreviewTimer]);

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;

    if (!loadMoreElement || !hasMoreTitles) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((current) => Math.min(current + titleLoadBatchSize, titles.length));
        }
      },
      { rootMargin: "720px 0px" },
    );

    observer.observe(loadMoreElement);

    return () => observer.disconnect();
  }, [hasMoreTitles, titles.length]);

  return (
    <div className="relative overflow-visible" ref={rootRef}>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
        {visibleTitles.map((title) => (
          <PosterCard
            key={title.slug}
            onOpenTitle={setModalTitle}
            onPreviewEnd={closePreview}
            onPreviewStart={openPreview}
            orientation="portrait"
            title={title}
          />
        ))}
      </div>
      {hasMoreTitles ? (
        <div aria-hidden="true" className="h-10" ref={loadMoreRef} />
      ) : null}
      {activePreview ? (
        <RowFloatingPreview
          active={activePreview}
          onClose={closePreview}
          onEnter={clearPreviewTimer}
          onOpenTitle={setModalTitle}
        />
      ) : null}
      <TitlePreviewModal onClose={() => setModalTitle(null)} open={Boolean(modalTitle)} title={modalTitle} />
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
