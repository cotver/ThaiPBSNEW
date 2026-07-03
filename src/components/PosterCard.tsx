"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import type { Title } from "@/lib/content";
import { TitlePreviewModal } from "./TitlePreviewModal";

type CardProps = {
  onOpenTitle?: (title: Title) => void;
  onPreviewEnd?: () => void;
  onPreviewStart?: (title: Title, element: HTMLElement) => void;
  onRemoveTitle?: (title: Title) => void;
  orientation?: "landscape" | "portrait";
  rail?: boolean;
  title: Title;
};

export function PosterCard({
  onOpenTitle,
  onPreviewEnd,
  onPreviewStart,
  onRemoveTitle,
  orientation = "landscape",
  rail = false,
  title,
}: CardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const imageSrc = orientation === "portrait" ? title.posterImage || title.heroImage : title.heroImage || title.posterImage;
  const imageClassName = title.isDiscontinued ? "object-cover grayscale" : "object-cover";
  const isDisabled = title.isDiscontinued;
  const openModal = useCallback(() => {
    if (isDisabled) return;
    if (onOpenTitle) onOpenTitle(title);
    else setModalOpen(true);
  }, [isDisabled, onOpenTitle, title]);

  return (
    <>
      <article
        className={`group relative snap-start rounded-[6px] ${
          rail
            ? orientation === "portrait"
              ? "w-[calc((100%_-_32px)_*_0.333333)] shrink-0 sm:w-[calc((100%_-_48px)_*_0.25)] md:w-[calc((100%_-_64px)_*_0.2)] xl:w-[calc((100%_-_80px)_*_0.166667)] 2xl:w-[calc((100%_-_96px)_*_0.142857)]"
              : "w-[calc((100%_-_16px)_*_0.5)] shrink-0 sm:w-[calc((100%_-_32px)_*_0.333333)] lg:w-[calc((100%_-_48px)_*_0.25)] 2xl:w-[calc((100%_-_64px)_*_0.2)]"
            : "w-full"
        }`}
      >
        <button
          aria-label={`Open details for ${title.title}`}
          className={`block w-full overflow-hidden rounded-[6px] border border-white/10 bg-[#101827] text-left shadow-xl shadow-black/25 outline-none transition duration-300 focus-visible:ring-2 focus-visible:ring-cyan-200 ${
            isDisabled ? "cursor-not-allowed opacity-82" : "hover:border-white/45"
          }`}
          disabled={isDisabled}
          draggable={false}
          onClick={openModal}
          onMouseEnter={isDisabled ? undefined : (event) => onPreviewStart?.(title, event.currentTarget)}
          onMouseLeave={isDisabled ? undefined : onPreviewEnd}
          onPointerEnter={isDisabled ? undefined : (event) => onPreviewStart?.(title, event.currentTarget)}
          onPointerLeave={isDisabled ? undefined : onPreviewEnd}
          type="button"
        >
          <div
            className={`relative ${
              orientation === "portrait" ? "aspect-[2/3]" : "aspect-video"
            } bg-gradient-to-br ${title.tone}`}
          >
            {imageSrc ? (
              <Image
                alt=""
                className={imageClassName}
                fill
                sizes={
                  rail
                    ? orientation === "portrait"
                      ? "(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1280px) 20vw, (max-width: 1536px) 17vw, 15vw"
                      : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 20vw"
                    : "(max-width: 768px) 50vw, 20vw"
                }
                src={imageSrc}
              />
            ) : null}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_24%,rgba(255,255,255,0.22),transparent_24%),linear-gradient(0deg,rgba(0,0,0,0.82),transparent_56%)]" />
            <div className={orientation === "portrait" ? "absolute bottom-3 left-3 right-3" : "absolute bottom-3 left-4 right-4"}>
              <p className="line-clamp-1 text-[10px] font-black uppercase text-white/56">{title.genre}</p>
              <h3 className={orientation === "portrait" ? "mt-0.5 line-clamp-2 text-base font-black leading-5" : "mt-0.5 text-lg font-black leading-6"}>
                {title.title}
              </h3>
            </div>
          </div>
        </button>
        {onRemoveTitle ? (
          <button
            aria-label={`Remove ${title.title} from Continue Watching`}
            className="absolute right-2 top-2 z-20 grid size-9 place-items-center rounded-full border border-white/18 bg-black/62 text-white/82 opacity-100 shadow-lg shadow-black/35 backdrop-blur transition hover:bg-white hover:text-[#030714] focus-visible:ring-2 focus-visible:ring-cyan-200 md:opacity-0 md:group-hover:opacity-100"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRemoveTitle(title);
            }}
            onMouseEnter={onPreviewEnd}
            type="button"
          >
            <EraserIcon />
          </button>
        ) : null}
      </article>
      {!onOpenTitle ? (
        <TitlePreviewModal onClose={() => setModalOpen(false)} open={modalOpen} title={title} />
      ) : null}
    </>
  );
}

export function WideCard({ onOpenTitle, onPreviewEnd, onPreviewStart, onRemoveTitle, title }: CardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const imageSrc = title.heroImage || title.posterImage;
  const imageClassName = title.isDiscontinued ? "object-cover grayscale" : "object-cover";
  const isDisabled = title.isDiscontinued;
  const openModal = useCallback(() => {
    if (isDisabled) return;
    if (onOpenTitle) onOpenTitle(title);
    else setModalOpen(true);
  }, [isDisabled, onOpenTitle, title]);

  return (
    <>
      <article className="group relative w-[calc((100%_-_16px)_*_0.5)] shrink-0 snap-start rounded-[6px] lg:w-[calc((100%_-_32px)_*_0.333333)] 2xl:w-[calc((100%_-_48px)_*_0.25)]">
        <button
          aria-label={`Open details for ${title.title}`}
          className={`block w-full overflow-hidden rounded-[6px] border border-white/10 bg-[#101827] text-left shadow-xl shadow-black/25 outline-none transition duration-300 focus-visible:ring-2 focus-visible:ring-cyan-200 ${
            isDisabled ? "cursor-not-allowed opacity-82" : "hover:border-white/45"
          }`}
          disabled={isDisabled}
          draggable={false}
          onClick={openModal}
          onMouseEnter={isDisabled ? undefined : (event) => onPreviewStart?.(title, event.currentTarget)}
          onMouseLeave={isDisabled ? undefined : onPreviewEnd}
          onPointerEnter={isDisabled ? undefined : (event) => onPreviewStart?.(title, event.currentTarget)}
          onPointerLeave={isDisabled ? undefined : onPreviewEnd}
          type="button"
        >
          <div className={`relative aspect-video bg-gradient-to-br ${title.tone}`}>
            {imageSrc ? (
              <Image alt="" className={imageClassName} fill sizes="384px" src={imageSrc} />
            ) : null}
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.20),transparent_35%),linear-gradient(0deg,rgba(0,0,0,0.72),transparent_55%)]" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-xs font-bold uppercase text-white/62">{title.type}</p>
              <h3 className="mt-1 text-lg font-black">{title.title}</h3>
            </div>
          </div>
          {title.progress ? (
            <div className="p-4">
              <div className="h-1.5 rounded-full bg-white/14">
                <div className="h-full rounded-full bg-cyan-300" style={{ width: title.progress }} />
              </div>
            </div>
          ) : null}
        </button>
        {onRemoveTitle ? (
          <button
            aria-label={`Remove ${title.title} from Continue Watching`}
            className="absolute right-2 top-2 z-20 grid size-9 place-items-center rounded-full border border-white/18 bg-black/62 text-white/82 opacity-100 shadow-lg shadow-black/35 backdrop-blur transition hover:bg-white hover:text-[#030714] focus-visible:ring-2 focus-visible:ring-cyan-200 md:opacity-0 md:group-hover:opacity-100"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRemoveTitle(title);
            }}
            onMouseEnter={onPreviewEnd}
            type="button"
          >
            <EraserIcon />
          </button>
        ) : null}
      </article>
      {!onOpenTitle ? (
        <TitlePreviewModal onClose={() => setModalOpen(false)} open={modalOpen} title={title} />
      ) : null}
    </>
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
