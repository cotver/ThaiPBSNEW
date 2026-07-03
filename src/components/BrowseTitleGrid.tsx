"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Title } from "@/lib/content";
import { RowFloatingPreview, type ActivePreview } from "./ContentRow";
import { PosterCard } from "./PosterCard";
import { TitlePreviewModal } from "./TitlePreviewModal";

export function BrowseTitleGrid({ titles }: { titles: Title[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const closePreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activePreview, setActivePreview] = useState<ActivePreview | null>(null);
  const [modalTitle, setModalTitle] = useState<Title | null>(null);

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
      const safePad = 12;
      const safeMinLeft = safePad;
      const safeMaxRight = root.width - safePad;
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

  return (
    <div className="relative overflow-visible" ref={rootRef}>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
        {titles.map((title) => (
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
