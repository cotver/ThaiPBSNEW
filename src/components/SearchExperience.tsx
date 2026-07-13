"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RowFloatingPreview, type ActivePreview } from "@/components/ContentRow";
import { PosterCard } from "@/components/PosterCard";
import { TitlePreviewModal } from "@/components/TitlePreviewModal";
import type { Title } from "@/lib/content";

const titleLoadBatchSize = 70;
const suggestionLimit = 8;

export function SearchExperience({ initialQuery = "", titles }: { initialQuery?: string; titles: Title[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const closePreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [activePreview, setActivePreview] = useState<ActivePreview | null>(null);
  const [modalTitle, setModalTitle] = useState<Title | null>(null);
  const [visibleCount, setVisibleCount] = useState(titleLoadBatchSize);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const cleanQuery = query.trim().toLocaleLowerCase();

  const results = useMemo(() => {
    if (!cleanQuery) {
      return titles;
    }

    return titles.filter((item) =>
      [...titleVariants(item), item.genre, item.type, item.year].some((value) =>
        value.toLocaleLowerCase().includes(cleanQuery),
      ),
    );
  }, [cleanQuery, titles]);
  const suggestions = useMemo(() => {
    if (!cleanQuery) return [];

    return titles.flatMap((title) => {
      const matchedTitle = titleVariants(title).find((name) => name.toLocaleLowerCase().includes(cleanQuery));

      return matchedTitle ? [{ matchedTitle, title }] : [];
    })
      .slice(0, suggestionLimit);
  }, [cleanQuery, titles]);
  const visibleResults = results.slice(0, visibleCount);
  const hasMoreResults = visibleCount < results.length;

  const updateQuery = useCallback((value: string) => {
    setQuery(value);
    setVisibleCount(titleLoadBatchSize);
    setActivePreview(null);
    setActiveSuggestionIndex(-1);
  }, []);

  const selectSuggestion = useCallback(
    (title: Title, matchedTitle: string) => {
      updateQuery(matchedTitle);
      setShowSuggestions(false);
    },
    [updateQuery],
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
        <div className="relative mt-8">
          <input
            aria-activedescendant={activeSuggestionIndex >= 0 ? `search-suggestion-${activeSuggestionIndex}` : undefined}
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-expanded={showSuggestions && suggestions.length > 0}
            autoComplete="off"
            autoFocus
            className="h-14 w-full rounded-[8px] border border-white/12 bg-white/10 px-5 text-lg font-semibold text-white outline-none transition placeholder:text-white/36 focus:border-cyan-200 focus:bg-white/14"
            onBlur={() => {
              setShowSuggestions(false);
              setActiveSuggestionIndex(-1);
            }}
            onChange={(event) => {
              updateQuery(event.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && suggestions.length > 0) {
                event.preventDefault();
                setActiveSuggestionIndex((index) => (index + 1) % suggestions.length);
              } else if (event.key === "ArrowUp" && suggestions.length > 0) {
                event.preventDefault();
                setActiveSuggestionIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
              } else if (event.key === "Enter" && activeSuggestionIndex >= 0) {
                event.preventDefault();
                selectSuggestion(
                  suggestions[activeSuggestionIndex].title,
                  suggestions[activeSuggestionIndex].matchedTitle,
                );
              } else if (event.key === "Escape") {
                setShowSuggestions(false);
                setActiveSuggestionIndex(-1);
              }
            }}
            placeholder="Search by Thai or English title, genre, year, or type"
            role="combobox"
            value={query}
          />
          {showSuggestions && suggestions.length > 0 ? (
            <ul
              className="absolute z-30 mt-2 max-h-96 w-full overflow-y-auto rounded-[8px] border border-white/12 bg-slate-950 p-1 shadow-2xl"
              id="search-suggestions"
              role="listbox"
            >
              {suggestions.map(({ matchedTitle, title }, index) => (
                  <li
                    aria-selected={activeSuggestionIndex === index}
                    className={`flex cursor-pointer flex-col rounded-md px-4 py-3 text-left transition hover:bg-white/10 ${activeSuggestionIndex === index ? "bg-white/10" : ""}`}
                    id={`search-suggestion-${index}`}
                    key={title.slug}
                    onClick={() => selectSuggestion(title, matchedTitle)}
                    onMouseDown={(event) => event.preventDefault()}
                    role="option"
                  >
                    <span className="font-semibold text-white">{matchedTitle}</span>
                  </li>
              ))}
            </ul>
          ) : null}
        </div>
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

function titleVariants(title: Title) {
  const titles = title.heroTitleLines?.length ? title.heroTitleLines : [title.title];

  return titles.map((name) => name.replace(/\\n|\r?\n/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
}
