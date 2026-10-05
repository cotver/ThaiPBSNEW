"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import type { PostRoomImageTile } from "@/lib/payload-content";

const minZoom = 0.5;
const maxZoom = 3;
const zoomStep = 0.25;

export function PostRoomImageGallery({ images }: { images: PostRoomImageTile[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const activeImage = activeIndex === null ? null : images[activeIndex];

  const closeLightbox = useCallback(() => {
    setActiveIndex(null);
    setZoom(1);
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((current) => Math.max(minZoom, current - zoomStep));
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((current) => Math.min(maxZoom, current + zoomStep));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeLightbox();
      }

      if (event.key === "-" || event.key === "_") {
        zoomOut();
      }

      if (event.key === "+" || event.key === "=") {
        zoomIn();
      }

      if (event.key === "0") {
        resetZoom();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, closeLightbox, resetZoom, zoomIn, zoomOut]);

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
        {images.map((item, index) => {
          const imageWidth = item.imageWidth ?? 1200;
          const imageHeight = item.imageHeight ?? 900;

          return (
            <article
              className="mb-4 break-inside-avoid overflow-hidden rounded-[8px] border border-white/10 bg-white/6 shadow-xl shadow-black/20"
              key={item.id || `${item.imageUrl}-${index}`}
            >
              {item.imageUrl ? (
                <button
                  aria-label={`Open Post Room image ${index + 1}`}
                  className="group block w-full cursor-zoom-in text-left outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                  onClick={() => {
                    setZoom(1);
                    setActiveIndex(index);
                  }}
                  type="button"
                >
                  <Image
                    alt=""
                    className="h-auto w-full object-cover transition duration-300 group-hover:scale-[1.015]"
                    height={imageHeight}
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    src={item.imageUrl}
                    width={imageWidth}
                  />
                </button>
              ) : null}
            </article>
          );
        })}
      </div>

      {activeImage?.imageUrl ? (
        <PostRoomLightbox
          image={activeImage}
          imageNumber={activeIndex === null ? 0 : activeIndex + 1}
          onClose={closeLightbox}
          onResetZoom={resetZoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          zoom={zoom}
        />
      ) : null}
    </>
  );
}

function PostRoomLightbox({
  image,
  imageNumber,
  onClose,
  onResetZoom,
  onZoomIn,
  onZoomOut,
  zoom,
}: {
  image: PostRoomImageTile;
  imageNumber: number;
  onClose: () => void;
  onResetZoom: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoom: number;
}) {
  if (!image.imageUrl) {
    return null;
  }

  const imageUrl = image.imageUrl;
  const imageWidth = image.imageWidth ?? 1600;
  const imageHeight = image.imageHeight ?? 1200;
  const displayWidth = Math.round(imageWidth * zoom);
  const displayHeight = Math.round(imageHeight * zoom);
  const zoomLabel = `${Math.round(zoom * 100)}%`;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[120] flex flex-col bg-black/92 text-white backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
    >
      <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 sm:px-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/62">
          Image {imageNumber}
        </p>
        <div className="flex items-center gap-2">
          <IconButton ariaLabel="Zoom out" disabled={zoom <= minZoom} onClick={onZoomOut}>
            <MinusIcon />
          </IconButton>
          <button
            aria-label="Reset zoom"
            className="h-10 min-w-16 rounded-[6px] border border-white/14 bg-white/10 px-3 text-xs font-black text-white transition hover:bg-white/18 focus-visible:ring-2 focus-visible:ring-cyan-200"
            onClick={(event) => {
              event.stopPropagation();
              onResetZoom();
            }}
            type="button"
          >
            {zoomLabel}
          </button>
          <IconButton ariaLabel="Zoom in" disabled={zoom >= maxZoom} onClick={onZoomIn}>
            <PlusIcon />
          </IconButton>
          <IconButton ariaLabel="Close image" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="grid min-h-full place-items-center">
          <Image
            alt=""
            className="h-auto max-w-none rounded-[6px] object-contain shadow-[0_28px_90px_rgba(0,0,0,0.65)]"
            height={displayHeight}
            priority
            sizes="100vw"
            src={imageUrl}
            style={{ width: displayWidth }}
            width={displayWidth}
          />
        </div>
      </div>
    </div>
  );
}

function IconButton({
  ariaLabel,
  children,
  disabled = false,
  onClick,
}: {
  ariaLabel: string;
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className="grid size-10 place-items-center rounded-[6px] border border-white/14 bg-white/10 text-white transition hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-cyan-200"
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      type="button"
    >
      {children}
    </button>
  );
}

function MinusIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" viewBox="0 0 24 24">
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
