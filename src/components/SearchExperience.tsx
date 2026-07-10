"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RowFloatingPreview, type ActivePreview } from "@/components/ContentRow";
import { PosterCard } from "@/components/PosterCard";
import { TitlePreviewModal } from "@/components/TitlePreviewModal";
import type { Title } from "@/lib/content";

const titleLoadBatchSize = 70;

export function SearchExperience({ initialQuery = "", titles }: { initialQuery?: string; titles: Title[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const closePreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [activePreview, setActivePreview] = useState<ActivePreview | null>(null);
  const [modalTitle, setModalTitle] = useState<Title | null>(null);
  const [visibleCount, setVisibleCount] = useState(titleLoadBatchSize);

  const results = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) {
      return titles;
    }

    return titles.filter((item) =>
      [item.title, item.genre, item.type, item.year].some((value) =>
        value.toLowerCase().includes(cleanQuery),
      ),
    );
  }, [query, titles]);
  const visibleResults = results.slice(0, visibleCount);
  const hasMoreResults = visibleCount < results.length;

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
    return () => clearPreviewTimer();
  }, [clearPreviewTimer]);

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;

    if (!loadMoreElement || !hasMoreResults) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((current) => Math.min(current + titleLoadBatchSize, results.length));
        }
      },
      { rootMargin: "720px 0px" },
    );

    observer.observe(loadMoreElement);

    return () => observer.disconnect();
  }, [hasMoreResults, results.length]);

  return (
    <section className="px-5 pb-16 sm:px-8 lg:px-10">
      <div className="max-w-4xl">
        <p className="text-sm font-bold uppercase text-cyan-200">Search</p>
        <h1 className="mt-3 text-4xl font-black sm:text-6xl">Find movies and series</h1>
        <input
          autoFocus
          className="mt-8 h-14 w-full rounded-[8px] border border-white/12 bg-white/10 px-5 text-lg font-semibold text-white outline-none transition placeholder:text-white/36 focus:border-cyan-200 focus:bg-white/14"
          onChange={(event) => {
            setQuery(event.target.value);
            setVisibleCount(titleLoadBatchSize);
            setActivePreview(null);
          }}
          placeholder="Search by title, genre, year, or type"
          value={query}
        />
      </div>

      <div className="relative mt-10 overflow-visible" ref={rootRef}>
        <div className="flex flex-wrap gap-4">
          {visibleResults.map((title) => (
            <PosterCard
              key={title.slug}
              onOpenTitle={setModalTitle}
              onPreviewEnd={closePreview}
              onPreviewStart={openPreview}
              orientation="portrait"
              rail
              title={title}
            />
          ))}
        </div>
        {hasMoreResults ? (
          <div aria-hidden="true" className="h-10 w-full" ref={loadMoreRef} />
        ) : null}
        {activePreview ? (
          <RowFloatingPreview
            active={activePreview}
            onClose={closePreview}
            onEnter={clearPreviewTimer}
            onOpenTitle={setModalTitle}
          />
        ) : null}
      </div>

      {results.length === 0 && (
        <div className="mt-10 rounded-[8px] border border-white/10 bg-white/7 p-8 text-white/70">
          No titles match that search.
        </div>
      )}
      <TitlePreviewModal onClose={() => setModalTitle(null)} open={Boolean(modalTitle)} title={modalTitle} />
    </section>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
