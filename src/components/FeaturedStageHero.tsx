"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { titleHref, type Title } from "@/lib/content";

const AUTO_ADVANCE_MS = 5000;

export function FeaturedStageHero({ titles }: { titles: Title[] }) {
  const [active, setActive] = useState(0);
  const [loadedImage, setLoadedImage] = useState<string | null>(null);

  useEffect(() => {
    if (titles.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActive((index) => (index + 1) % titles.length);
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [titles.length]);

  const current = titles[active] ?? titles[0];
  const imageSrc = current?.heroImage || current?.posterImage;
  const hasMultiple = titles.length > 1;
  const imageClassName = current?.isDiscontinued
    ? "object-cover object-center grayscale transition duration-500"
    : "object-cover object-center transition duration-500";

  if (!current) {
    return (
      <section className="relative grid aspect-video w-full place-items-center bg-black text-white/70">
        <p className="text-sm font-semibold md:text-lg">Add featured programs in Payload CMS.</p>
      </section>
    );
  }

  function goPrevious() {
    setActive((index) => (index <= 0 ? titles.length - 1 : index - 1));
  }

  function goNext() {
    setActive((index) => (index >= titles.length - 1 ? 0 : index + 1));
  }

  return (
    <section className="relative w-full overflow-hidden bg-black">
      {current.isDiscontinued ? (
        <div aria-disabled="true" className="relative block aspect-video w-full cursor-not-allowed">
          {imageSrc ? (
            <Image
              alt=""
              className={`${imageClassName} ${
                loadedImage === imageSrc ? "opacity-100" : "opacity-0"
              } [mask-image:linear-gradient(to_bottom,black_0%,black_78%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_78%,transparent_100%)]`}
              fill
              onLoad={() => setLoadedImage(imageSrc)}
              priority
              sizes="100vw"
              src={imageSrc}
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${current.tone}`} />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.54)_0%,rgba(0,0,0,0.05)_18%,rgba(0,0,0,0.04)_70%,rgba(3,7,20,0.55)_100%)]" />
        </div>
      ) : (
        <Link
          aria-label={`Open ${current.title}`}
          className="relative block aspect-video w-full"
          href={titleHref(current.slug)}
        >
        {imageSrc ? (
          <Image
            alt=""
            className={`${imageClassName} ${
              loadedImage === imageSrc ? "opacity-100" : "opacity-0"
            } [mask-image:linear-gradient(to_bottom,black_0%,black_78%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_78%,transparent_100%)]`}
            fill
            onLoad={() => setLoadedImage(imageSrc)}
            priority
            sizes="100vw"
            src={imageSrc}
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${current.tone}`} />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.54)_0%,rgba(0,0,0,0.05)_18%,rgba(0,0,0,0.04)_70%,rgba(3,7,20,0.55)_100%)]" />
        </Link>
      )}

      {hasMultiple ? (
        <>
          <button
            aria-label="Previous featured program"
            className="absolute left-2 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-transparent text-white/70 transition hover:bg-white/15 hover:text-white sm:size-12"
            onClick={goPrevious}
            type="button"
          >
            <Chevron direction="left" />
          </button>
          <button
            aria-label="Next featured program"
            className="absolute right-2 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-transparent text-white/70 transition hover:bg-white/15 hover:text-white sm:size-12"
            onClick={goNext}
            type="button"
          >
            <Chevron direction="right" />
          </button>
          <div className="absolute left-1/2 top-[80%] z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 md:gap-2.5">
            {titles.map((title, index) => (
              <button
                aria-label={`Show ${title.title}`}
                className={`size-3 rounded-full transition md:size-4 ${
                  index === active ? "bg-white" : "bg-white/35 hover:bg-white/60"
                }`}
                key={title.slug}
                onClick={() => setActive(index)}
                type="button"
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24">
      {direction === "left" ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
    </svg>
  );
}
