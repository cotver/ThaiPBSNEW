"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { titleHref, type Title } from "@/lib/content";

export function HeroCarousel({ titles }: { titles: Title[] }) {
  const [active, setActive] = useState(0);
  const current = titles[active];
  const activeThumbRef = useRef<HTMLButtonElement | null>(null);
  const didDragRef = useRef(false);
  const dragStartScrollRef = useRef(0);
  const dragStartXRef = useRef(0);
  const railRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingThumbs, setIsDraggingThumbs] = useState(false);

  useEffect(() => {
    if (titles.length === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setActive((index) => (index + 1) % titles.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [titles.length]);

  useEffect(() => {
    activeThumbRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [active]);

  function startThumbDrag(event: React.PointerEvent<HTMLDivElement>) {
    const rail = railRef.current;

    if (!rail || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }

    didDragRef.current = false;
    dragStartXRef.current = event.clientX;
    dragStartScrollRef.current = rail.scrollLeft;
    setIsDraggingThumbs(true);
  }

  function moveThumbDrag(event: React.PointerEvent<HTMLDivElement>) {
    const rail = railRef.current;

    if (!rail || !isDraggingThumbs) {
      return;
    }

    const delta = event.clientX - dragStartXRef.current;

    if (Math.abs(delta) > 5) {
      didDragRef.current = true;
    }

    rail.scrollLeft = dragStartScrollRef.current - delta;
  }

  function stopThumbDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (isDraggingThumbs) {
      setIsDraggingThumbs(false);
    }
  }

  function preventThumbClickAfterDrag(event: React.MouseEvent<HTMLDivElement>) {
    if (!didDragRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    didDragRef.current = false;
  }

  if (!current) {
    return (
      <section className="relative min-h-[560px] px-5 pb-24 sm:px-8 lg:min-h-[620px] lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_28%,rgba(255,255,255,0.12),transparent_24%),linear-gradient(135deg,#030714,#111827_48%,#0f766e)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#030714_0%,rgba(3,7,20,0.88)_54%,#030714_100%)]" />
        <div className="relative z-10 flex min-h-[440px] max-w-3xl flex-col justify-end lg:min-h-[500px]">
          <p className="mb-3 text-xs font-black uppercase text-cyan-200">Payload catalog</p>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.98] sm:text-6xl lg:text-7xl">
            No programs yet
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/74 sm:text-base">
            Add or publish programs in Payload CMS to show real homepage content here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[clamp(620px,min(56.25vw,100vh),2160px)] overflow-hidden px-5 pb-24 sm:px-8 lg:px-10">
      {titles.map((title, index) => {
        const heroAsset = title.heroImage || title.posterImage;
        const hasTrailer = title.source === "program" && Boolean(title.trailerUrl);
        const isGifTrailer = title.trailerMimeType === "image/gif";
        const isHeroImage = title.source === "heroImage";
        const useSideImage = (title.source === "program" && !hasTrailer) || (isHeroImage && title.showHeroDetails !== false);
        const useFullImage = isHeroImage && title.showHeroDetails === false;

        return (
          <div
            aria-hidden={index !== active}
            className={`absolute inset-0 bg-[#030714] transition-opacity duration-700 ${
              index === active ? "opacity-100" : "opacity-0"
            }`}
            key={title.slug}
          >
            {hasTrailer && title.trailerUrl ? (
              isGifTrailer ? (
                <img
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  src={title.trailerUrl}
                />
              ) : (
                <video
                  aria-hidden="true"
                  autoPlay
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  loop
                  muted
                  playsInline
                  poster={heroAsset}
                  preload="metadata"
                  src={title.trailerUrl}
                />
              )
            ) : heroAsset ? (
              <div
                className={
                  useFullImage
                    ? "absolute inset-0"
                    : "absolute right-0 top-1/2 aspect-video h-[100%] max-h-full -translate-y-1/2"
                }
              >
                <Image
                  alt=""
                  className={useFullImage ? "object-cover object-center" : "object-contain object-right"}
                  fill
                  priority={index === 0}
                  sizes={useFullImage ? "100vw" : "100vh"}
                  src={heroAsset}
                />
               
              </div>
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${title.tone}`} />
            )}
            {!heroAsset && !hasTrailer && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_28%,rgba(255,255,255,0.22),transparent_22%),radial-gradient(circle_at_55%_68%,rgba(34,211,238,0.18),transparent_28%)]" />
            )}
            {title.showHeroDetails !== false && (
              <div className={`absolute inset-0 ${getHeroDetailShadowClass(title)}`} />
            )}
          </div>
        );
      })}
      <div className="absolute inset-x-0 bottom-0 h-50 bg-gradient-to-t from-[#030714] via-[#030714]/40 to-transparent" />

      {current.showHeroDetails !== false && (
        <div className="absolute bottom-20 left-5 z-10 max-w-3xl sm:left-8 lg:bottom-24 lg:left-10">
          <p className="mb-3 text-xs font-black uppercase text-cyan-200">
            {current.eyebrow || (current.type === "Original" ? "ThaiPBS Parvilions Original" : current.type)}
          </p>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.98] sm:text-6xl lg:text-7xl">
            {current.title}
          </h1>
          {[current.year, current.rating, current.duration].filter(Boolean).length > 0 && (
            <p className="mt-4 text-sm font-bold text-white/72">
              {[current.year, current.rating, current.duration].filter(Boolean).join(" | ")}
            </p>
          )}
          {current.description && (
            <p className="mt-5 max-w-md text-sm leading-7 text-white/74 sm:text-base">
              {current.description}
            </p>
          )}
          {current.genre && (
            <p className="mt-4 max-w-2xl text-xs font-bold uppercase text-white/58 sm:text-sm">
              {current.genre}
            </p>
          )}
          {current.showHeroActions !== false && (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="rounded-[6px] bg-white px-9 py-3 text-sm font-black uppercase text-[#030714] transition hover:bg-cyan-100"
                href={titleHref(current.slug)}
              >
                Play
              </Link>
              <Link
                className="rounded-[6px] border border-white/16 bg-white/12 px-8 py-3 text-sm font-black uppercase text-white backdrop-blur transition hover:bg-white/20"
                href={titleHref(current.slug)}
              >
                Details
              </Link>
              <Link
                aria-label="Open watchlist"
                className="grid size-12 place-items-center rounded-full border border-white/18 bg-black/35 text-2xl transition hover:bg-white/18"
                href="/watchlist"
              >
                +
              </Link>
            </div>
          )}
          <div className="mt-8 flex items-center gap-2 lg:hidden">
            {titles.map((title, index) => (
              <button
                aria-label={`Show ${title.title}`}
                className={`h-1.5 rounded-full transition-all ${
                  index === active ? "w-9 bg-white" : "w-4 bg-white/34 hover:bg-white/70"
                }`}
                key={title.slug}
                onClick={() => setActive(index)}
                type="button"
              />
            ))}
          </div>
        </div>
      )}

      <div className="absolute bottom-10 right-8 z-20 hidden w-[min(34rem,38vw)] lg:block">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-[#030714]/55 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-gradient-to-l from-[#030714]/55 to-transparent" />
        <div
          className={`no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 ${
            isDraggingThumbs ? "cursor-grabbing select-none" : "cursor-grab"
          }`}
          onClickCapture={preventThumbClickAfterDrag}
          onDragStart={(event) => event.preventDefault()}
          onPointerCancel={stopThumbDrag}
          onPointerDown={startThumbDrag}
          onPointerLeave={stopThumbDrag}
          onPointerMove={moveThumbDrag}
          onPointerUp={stopThumbDrag}
          ref={railRef}
        >
        {titles.map((title, index) => (
          <button
            aria-label={`Show ${title.title}`}
            className={`group w-20 shrink-0 snap-end overflow-hidden rounded-[5px] border bg-black/35 shadow-2xl shadow-black/30 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-white/70 xl:w-24 ${
              index === active ? "border-white/80" : "border-white/14"
            }`}
            key={title.slug}
            onClick={() => setActive(index)}
            ref={index === active ? activeThumbRef : null}
            type="button"
          >
            <div className={`relative aspect-video bg-gradient-to-br ${title.tone}`}>
              {title.heroImage || title.posterImage ? (
                <Image
                  alt=""
                  className="object-cover"
                  fill
                  sizes="96px"
                  src={title.heroImage || title.posterImage || ""}
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_28%,rgba(255,255,255,0.24),transparent_26%),linear-gradient(0deg,rgba(0,0,0,0.42),transparent_55%)]" />
              )}
              <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/0" />
            </div>
            <div className="h-0.5 bg-white/12">
              <div
                className={`h-full rounded-r-full transition-all ${
                  index === active ? "w-full bg-white" : "w-0 bg-white/0"
                }`}
              />
            </div>
          </button>
        ))}
        </div>
      </div>
    </section>
  );
}

function getHeroDetailShadowClass(title: Title) {
  if (title.source === "program" && title.trailerUrl) {
    return "bg-[linear-gradient(90deg,#030714_0%,rgba(3,7,20,0.96)_19%,rgba(3,7,20,0.7)_23%,rgba(3,7,20,0.22)_30%,transparent_78%)]";
  }

  if (title.source === "heroImage") {
    return "bg-[linear-gradient(90deg,#030714_0%,rgba(3,7,20,0.96)_19%,rgba(3,7,20,0.7)_23%,rgba(3,7,20,0.22)_30%,transparent_78%)]";
  }

  return "bg-[linear-gradient(90deg,#030714_0%,rgba(3,7,20,0.96)_19%,rgba(3,7,20,0.7)_23%,rgba(3,7,20,0.22)_30%,transparent_78%)]";
}
