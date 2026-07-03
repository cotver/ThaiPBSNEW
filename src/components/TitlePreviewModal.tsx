"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { titleEyebrow, titleHref, type Title } from "@/lib/content";
import { TitleDetails } from "./TitleDetails";

export function TitlePreviewModal({
  onClose,
  open,
  title,
}: {
  onClose: () => void;
  open: boolean;
  title: Title | null;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, open]);

  if (!open || !title || typeof document === "undefined") {
    return null;
  }

  const heroAsset = title.heroImage || title.posterImage;
  const hasTrailer = title.source === "program" && Boolean(title.trailerUrl);
  const mediaClassName = title.isDiscontinued ? "absolute inset-0 h-full w-full object-cover object-center grayscale" : "absolute inset-0 h-full w-full object-cover object-center";
  const imageClassName = title.isDiscontinued ? "object-fill grayscale" : "object-fill";
  const isGifTrailer = title.trailerMimeType === "image/gif";
  const showImageFade = title.showHeroDetails !== false;
  const useFullImage = title.source === "heroImage" && title.showHeroDetails === false;
  const titleLines = title.heroTitleLines?.length ? title.heroTitleLines : [title.title];
  const meta = [title.year, title.rating, title.duration].filter(Boolean);

  return createPortal(
    <div
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/78 px-3 py-6 backdrop-blur-sm sm:px-6 sm:py-10"
      onClick={onClose}
      role="dialog"
    >
      <article
        className="relative my-auto w-full max-w-5xl overflow-hidden rounded-[8px] bg-[#111827] text-white shadow-[0_30px_90px_rgba(0,0,0,0.75)] ring-1 ring-white/14"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          aria-label="Close title details"
          className="absolute right-4 top-4 z-30 grid size-10 place-items-center rounded-full bg-black/58 text-white ring-1 ring-white/16 transition hover:bg-white hover:text-[#030714]"
          onClick={onClose}
          type="button"
        >
          <CloseIcon />
        </button>

        <div className="relative h-[clamp(520px,min(56.25vw,78vh),720px)] overflow-hidden">
          <div className="absolute inset-0 bg-[#030714]">
            {hasTrailer && title.trailerUrl ? (
              isGifTrailer ? (
                <img
                  alt=""
                  className={mediaClassName}
                  src={title.trailerUrl}
                />
              ) : (
                <video
                  aria-hidden="true"
                  autoPlay
                  className={mediaClassName}
                  loop
                  muted
                  playsInline
                  poster={heroAsset}
                  preload="metadata"
                  src={title.trailerUrl}
                />
              )
            ) : heroAsset ? (
              <div className={useFullImage ? "absolute inset-0" : "absolute inset-0 flex items-center justify-end"}>
                <div className={useFullImage ? "absolute inset-0" : "relative aspect-video w-[min(100%,calc(78vh*16/9))] max-h-full"}>
                  <Image
                    alt=""
                    className={imageClassName}
                    fill
                    priority
                    sizes="min(100vw, 1024px)"
                    src={heroAsset}
                  />
                  {showImageFade && (
                    <>
                      <div className="absolute inset-y-0 left-0 w-[10%] bg-gradient-to-r from-[#030714] via-[#030714]/70 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 h-[20%] bg-gradient-to-t from-[#030714]/90 via-[#030714]/45 to-transparent" />
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${title.tone}`} />
            )}
            {!heroAsset && !hasTrailer ? (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_28%,rgba(255,255,255,0.22),transparent_22%),radial-gradient(circle_at_55%_68%,rgba(34,211,238,0.18),transparent_28%)]" />
            ) : null}
            {title.showHeroDetails !== false ? (
              <div className="absolute inset-0 bg-[linear-gradient(90deg,#030714_0%,rgba(3,7,20,0.96)_10%,rgba(3,7,20,0.7)_20%,rgba(3,7,20,0.22)_30%,transparent_78%)]" />
            ) : null}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-50 bg-gradient-to-t from-[#111827] via-[#111827]/40 to-transparent" />

          {title.showHeroDetails !== false ? (
            <div className="absolute bottom-8 left-5 z-10 max-w-2xl sm:bottom-10 sm:left-9">
              <p className="mb-3 text-xs font-black uppercase text-cyan-200">
                {titleEyebrow(title)}
              </p>
              <h2 className="max-w-3xl text-4xl font-black leading-[0.98] sm:text-6xl">
                {titleLines.map((line) => (
                  <span className="block" key={line}>
                    {line}
                  </span>
                ))}
              </h2>
              {meta.length > 0 ? (
                <p className="mt-4 text-sm font-bold text-white/72">
                  {meta.join(" | ")}
                </p>
              ) : null}
              {title.description ? (
                <p className="mt-5 max-w-md text-sm leading-7 text-white/74 sm:text-base">
                  {title.description}
                </p>
              ) : null}
              {title.genre ? (
                <p className="mt-4 max-w-2xl text-xs font-bold uppercase text-white/58 sm:text-sm">
                  {title.genre}
                </p>
              ) : null}
              {title.showHeroActions !== false ? (
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    className="inline-flex h-12 items-center gap-2 rounded-[6px] bg-white px-7 text-sm font-black uppercase text-[#030714] transition hover:bg-cyan-100"
                    href={titleHref(title.slug)}
                    onClick={onClose}
                  >
                    <PlayIcon />
                    Play
                  </Link>
                  <Link
                    className="inline-flex h-12 items-center rounded-[6px] border border-white/16 bg-white/12 px-6 text-sm font-black uppercase text-white backdrop-blur transition hover:bg-white/20"
                    href={titleHref(title.slug)}
                    onClick={onClose}
                  >
                    Details
                  </Link>
                  <Link
                    aria-label="Open watchlist"
                    className="grid size-12 place-items-center rounded-full border border-white/18 bg-black/35 text-2xl font-light transition hover:bg-white/18"
                    href="/watchlist"
                    onClick={onClose}
                  >
                    +
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <TitleDetails compact title={title} />
      </article>
    </div>,
    document.body,
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5.14v13.72c0 .7.77 1.12 1.36.74l10.78-6.86a.88.88 0 0 0 0-1.48L9.36 4.4A.88.88 0 0 0 8 5.14Z" />
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
