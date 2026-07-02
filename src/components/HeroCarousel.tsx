"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { titleHref, type Title } from "@/lib/content";

export function HeroCarousel({ titles }: { titles: Title[] }) {
  const [active, setActive] = useState(0);
  const current = titles[active];

  useEffect(() => {
    if (titles.length === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setActive((index) => (index + 1) % titles.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [titles.length]);

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
    <section className="relative min-h-[1080px] px-5 pb-24 sm:px-8 lg:min-h-[1080px] lg:px-10">
      {titles.map((title, index) => (
        <div
          aria-hidden={index !== active}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === active ? "opacity-100" : "opacity-0"
          }`}
          key={title.slug}
        >
          {title.heroImage || title.posterImage ? (
            <div className="absolute inset-x-0 top-0 aspect-video w-full">
              <Image
                alt=""
                className="object-cover object-center"
                fill
                priority={index === 0}
                sizes="100vw"
                src={title.heroImage || title.posterImage || ""}
              />
            </div>
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${title.tone}`} />
          )}
          {!title.heroImage && !title.posterImage && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_28%,rgba(255,255,255,0.22),transparent_22%),radial-gradient(circle_at_55%_68%,rgba(34,211,238,0.18),transparent_28%)]" />
          )}
        </div>
      ))}

      <div className="absolute inset-0 bg-[linear-gradient(90deg,#030714_0%,rgba(3,7,20,0.94)_28%,rgba(3,7,20,0.38)_48%,transparent_68%)]" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#030714] via-[#030714]/92 to-transparent" />

      <div className="relative z-10 flex min-h-[560px] max-w-3xl flex-col justify-end lg:min-h-[590px]">
        <p className="mb-3 text-xs font-black uppercase text-cyan-200">
          {current.type === "Original" ? "ThaiPBS Parvilions Original" : current.type}
        </p>
        <h1 className="max-w-3xl text-5xl font-black leading-[0.98] sm:text-6xl lg:text-7xl">
          {current.title}
        </h1>
        <p className="mt-4 text-sm font-bold text-white/72">
          {current.year} | {current.rating} | {current.duration}
        </p>
        <p className="mt-5 max-w-md text-sm leading-7 text-white/74 sm:text-base">
          {current.description}
        </p>
        <p className="mt-4 max-w-2xl text-xs font-bold uppercase text-white/58 sm:text-sm">
          {current.genre}
        </p>
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

      <div className="no-scrollbar absolute bottom-28 right-8 z-20 hidden max-w-[34vw] gap-2 overflow-x-auto pb-1 lg:flex">
        {titles.map((title, index) => (
          <button
            aria-label={`Show ${title.title}`}
            className={`group w-20 shrink-0 overflow-hidden rounded-[5px] border bg-black/35 shadow-2xl shadow-black/30 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-white/70 xl:w-24 ${
              index === active ? "border-white/80" : "border-white/14"
            }`}
            key={title.slug}
            onClick={() => setActive(index)}
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
    </section>
  );
}
