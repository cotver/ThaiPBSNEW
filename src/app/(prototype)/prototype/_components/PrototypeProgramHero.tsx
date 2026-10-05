"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { titleEyebrow, titleInlineText, type Title } from "@/lib/content";

export function PrototypeProgramHero({ titles }: { titles: Title[] }) {
  const [active, setActive] = useState(0);
  const pausedRef = useRef(false);
  const current = titles[active] ?? titles[0];

  useEffect(() => {
    if (titles.length < 2) return;
    const timer = window.setInterval(() => {
      if (!pausedRef.current) setActive((index) => (index + 1) % titles.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [titles.length]);

  if (!current) return null;

  return (
    <section
      aria-roledescription="carousel"
      className="relative h-[clamp(620px,min(56.25vw,100vh),2160px)] overflow-hidden px-5 pb-24 sm:px-8 lg:px-10"
      onPointerEnter={() => { pausedRef.current = true; }}
      onPointerLeave={() => { pausedRef.current = false; }}
    >
      <div className="absolute inset-0 bg-[#030714]">
        {titles.map((title, index) => {
          const artwork = title.heroImage || title.posterImage;
          return (
            <div
              aria-hidden={index !== active}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${index === active ? "opacity-100" : "opacity-0"}`}
              key={title.slug}
            >
              {artwork ? (
                <Image alt="" className="object-cover object-center" fill loading="eager" priority={index === 0} sizes="100vw" src={artwork} />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${title.tone}`} />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,#030714_0%,rgba(3,7,20,0.96)_10%,rgba(3,7,20,0.7)_20%,rgba(3,7,20,0.22)_38%,transparent_78%)]" />
              <div className="absolute inset-x-0 bottom-0 h-[28%] bg-gradient-to-t from-[#030714] via-[#030714]/52 to-transparent" />
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-20 left-5 z-10 max-w-3xl sm:left-8 lg:bottom-24 lg:left-10">
        <p className="mb-3 text-xs font-black uppercase text-cyan-200">Cover story · {titleEyebrow(current)}</p>
        <h1 className="max-w-3xl text-5xl font-black leading-[0.98] sm:text-6xl lg:text-7xl">{titleInlineText(current)}</h1>
        <p className="mt-4 text-sm font-bold text-white/72">กองบรรณาธิการ Thai PBS | อ่าน 5 นาที</p>
        <p className="mt-5 line-clamp-3 max-w-md text-sm leading-7 text-white/74 sm:text-base">{current.description}</p>
        <p className="mt-4 max-w-2xl text-xs font-bold uppercase text-white/58 sm:text-sm">{current.genre}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="rounded-[6px] bg-white px-9 py-3 text-sm font-black uppercase text-[#030714] transition hover:bg-cyan-100" href={`/prototype/programs/${encodeURIComponent(current.slug)}`}>
            Read Story
          </Link>
          <a className="rounded-[6px] border border-white/16 bg-white/12 px-8 py-3 text-sm font-black uppercase text-white backdrop-blur transition hover:bg-white/20" href="#catalog">
            Latest Stories
          </a>
        </div>
        <div className="mt-8 flex items-center gap-2 lg:hidden">
          {titles.map((title, index) => (
            <button
              aria-label={`Show ${title.title}`}
              aria-pressed={index === active}
              className={`h-1.5 rounded-full transition-all ${index === active ? "w-9 bg-white" : "w-4 bg-white/34 hover:bg-white/70"}`}
              key={title.slug}
              onClick={() => setActive(index)}
              type="button"
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-10 right-8 z-20 hidden w-[min(34rem,38vw)] lg:block">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-[#030714]/55 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-gradient-to-l from-[#030714]/55 to-transparent" />
        <div className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain scroll-smooth pb-1">
          {titles.map((title, index) => {
            const artwork = title.heroImage || title.posterImage;
            return (
              <button
                aria-label={`Show ${title.title}`}
                aria-pressed={index === active}
                className={`group w-20 shrink-0 snap-end overflow-hidden rounded-[5px] border bg-black/35 shadow-2xl shadow-black/30 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-white/70 xl:w-24 ${index === active ? "border-white/80" : "border-white/14"}`}
                key={title.slug}
                onClick={() => setActive(index)}
                type="button"
              >
                <div className={`relative aspect-video bg-gradient-to-br ${title.tone}`}>
                  {artwork ? <Image alt="" className="object-cover" fill sizes="96px" src={artwork} /> : null}
                  <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/0" />
                </div>
                <div className="h-0.5 bg-white/12"><div className={`h-full rounded-r-full transition-all ${index === active ? "w-full bg-white" : "w-0"}`} /></div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
