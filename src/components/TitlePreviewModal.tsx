"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { Title } from "@/lib/content";
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

  const imageSrc = title.heroImage || title.posterImage;

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

        <div className="relative min-h-[420px] overflow-hidden sm:min-h-[520px]">
          {imageSrc ? (
            <Image
              alt=""
              className="object-cover object-center"
              fill
              priority
              sizes="min(100vw, 1024px)"
              src={imageSrc}
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${title.tone}`} />
          )}
          {!imageSrc && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_24%,rgba(255,255,255,0.24),transparent_22%),radial-gradient(circle_at_42%_62%,rgba(103,232,249,0.20),transparent_26%)]" />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#111827_0%,rgba(17,24,39,0.95)_32%,rgba(17,24,39,0.42)_68%,rgba(17,24,39,0.12)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#111827] via-[#111827]/82 to-transparent" />

          <div className="relative z-10 flex min-h-[420px] max-w-2xl flex-col justify-end px-5 pb-8 pt-20 sm:min-h-[520px] sm:px-9 sm:pb-10">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
              {title.type === "Original" ? "ThaiPBS Parvilions Original" : title.type}
            </p>
            <h2 className="mt-3 text-4xl font-black leading-[0.95] sm:text-6xl">
              {title.title}
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-bold text-white/76">
              <span>{title.year}</span>
              <span className="rounded border border-white/28 px-1.5 py-0.5 text-[11px] text-white/88">
                {title.rating}
              </span>
              <span>{title.duration}</span>
              <span>{title.genre}</span>
            </div>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/78 sm:text-base">
              {title.description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                className="inline-flex h-12 items-center gap-2 rounded-[6px] bg-white px-7 text-sm font-black uppercase text-[#030714] transition hover:bg-cyan-100"
                href={`/title/${title.slug}`}
                onClick={onClose}
              >
                <PlayIcon />
                Play
              </Link>
              <Link
                className="inline-flex h-12 items-center rounded-[6px] border border-white/16 bg-white/12 px-6 text-sm font-black uppercase text-white transition hover:bg-white/20"
                href={`/title/${title.slug}`}
                onClick={onClose}
              >
                Details
              </Link>
              <Link
                aria-label="Open watchlist"
                className="grid size-12 place-items-center rounded-full border border-white/18 bg-black/40 text-2xl font-light transition hover:bg-white/18"
                href="/watchlist"
                onClick={onClose}
              >
                +
              </Link>
            </div>
          </div>
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
