"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { isPayloadMediaSrc } from "@/lib/media-image";

const PIXELS_PER_SECOND = 60;
const PANEL_CLASS = "relative h-full min-w-[100vw] flex-shrink-0 bg-black";

export function LandingEntrance({ imageUrls }: { imageUrls: string[] }) {
  const [animationReady, setAnimationReady] = useState(imageUrls.length === 0);
  const stripRef = useRef<HTMLDivElement>(null);
  const firstHalfRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const cycleWidthRef = useRef(0);

  useEffect(() => {
    const strip = stripRef.current;
    const firstHalf = firstHalfRef.current;

    if (!strip || !firstHalf || imageUrls.length === 0) {
      return;
    }

    const updateCycleWidth = () => {
      const width = firstHalf.offsetWidth;

      if (width > 0) {
        cycleWidthRef.current = width;
      }
    };
    const observer = new ResizeObserver(updateCycleWidth);
    let frameId = 0;
    let lastTime = performance.now();

    observer.observe(firstHalf);
    updateCycleWidth();

    const tick = (now: number) => {
      const deltaSeconds = (now - lastTime) / 1000;
      const cycleWidth = cycleWidthRef.current;

      lastTime = now;

      if (animationReady && cycleWidth > 0) {
        offsetRef.current += PIXELS_PER_SECOND * deltaSeconds;

        if (offsetRef.current >= cycleWidth) {
          offsetRef.current -= cycleWidth;
        }
      }

      strip.style.transform = `translateX(-${offsetRef.current}px)`;
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [animationReady, imageUrls.length]);

  const firstHalfUrls = imageUrls;
  const secondHalfUrls = imageUrls.length === 1 ? [imageUrls[0]] : [...imageUrls];

  return (
    <main className="fixed inset-0 overflow-hidden bg-black">
      <div aria-hidden className="absolute inset-0 flex will-change-transform" ref={stripRef}>
        {imageUrls.length === 0 ? (
          <>
            <div className={PANEL_CLASS} />
            <div className={PANEL_CLASS} />
          </>
        ) : (
          <>
            <div className="flex h-full flex-shrink-0" ref={firstHalfRef}>
              {firstHalfUrls.map((url, index) => (
                <LandingImage
                  key={`first-${index}-${url}`}
                  onFirstLoad={index === 0 ? () => setAnimationReady(true) : undefined}
                  priority={index === 0}
                  url={url}
                />
              ))}
            </div>
            <div className="flex h-full flex-shrink-0">
              {secondHalfUrls.map((url, index) => (
                <LandingImage key={`second-${index}-${url}`} priority={false} url={url} />
              ))}
            </div>
          </>
        )}
      </div>

      <div aria-hidden className="absolute inset-0 bg-black/70" />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.42)_42%,rgba(0,0,0,0.94)_100%)]"
      />

      <div className="absolute inset-x-0 bottom-0 top-[40%] z-10 flex items-center justify-center px-5">
        <div className="flex flex-col items-center">
          <span className="relative mb-3 block aspect-[1641/691] w-[min(72vw,430px)]">
            <Image
              alt=""
              className="absolute left-[-1.9%] top-[-79%] h-auto w-[108%] max-w-none object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.78)]"
              height={1772}
              priority
              src="/LOGO/Logo with tagline h.png"
              width={1772}
            />
          </span>
          <Link
            aria-label="Enter website"
            className="group relative grid size-[min(44vw,168px)] -translate-y-1 place-items-center rounded-[30px] outline-none transition duration-300 hover:-translate-y-3 focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:size-[min(28vw,196px)] sm:-translate-y-2 sm:hover:-translate-y-4"
            href="/home"
          >
            <span
              aria-hidden
              className="absolute -bottom-16 left-1/2 h-24 w-[235%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(255,159,49,0.48)_0%,rgba(255,132,26,0.30)_30%,rgba(112,67,25,0.16)_52%,transparent_76%)] blur-xl transition duration-300 [transform:translateX(-50%)_perspective(260px)_rotateX(64deg)] group-hover:h-28 group-hover:w-[260%] group-hover:bg-[radial-gradient(ellipse_at_center,rgba(255,178,66,0.70)_0%,rgba(255,119,24,0.42)_32%,rgba(124,69,22,0.20)_56%,transparent_78%)]"
            />
            <span
              aria-hidden
              className="absolute -bottom-8 left-1/2 h-12 w-[150%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.74)_0%,rgba(0,0,0,0.42)_42%,transparent_76%)] blur-md transition duration-300 [transform:translateX(-50%)_perspective(220px)_rotateX(60deg)] group-hover:w-[170%] group-hover:bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.70)_0%,rgba(255,102,24,0.20)_48%,transparent_78%)]"
            />
            <span
              aria-hidden
              className="absolute -bottom-3 left-1/2 h-5 w-[96%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,230,164,0.50)_0%,rgba(255,147,45,0.26)_44%,transparent_78%)] blur-sm transition duration-300 group-hover:w-[116%] group-hover:bg-[radial-gradient(ellipse_at_center,rgba(255,235,181,0.76)_0%,rgba(255,137,31,0.36)_46%,transparent_80%)]"
            />
            <span
              aria-hidden
              className="absolute -bottom-9 left-[-34%] h-8 w-[58%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,205,113,0.34)_0%,rgba(255,138,38,0.17)_38%,transparent_74%)] blur-md transition duration-300 group-hover:left-[-42%] group-hover:w-[70%] group-hover:bg-[radial-gradient(ellipse_at_center,rgba(255,218,139,0.58)_0%,rgba(255,128,31,0.30)_42%,transparent_78%)]"
            />
            <span
              aria-hidden
              className="absolute -bottom-9 right-[-34%] h-8 w-[58%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,205,113,0.34)_0%,rgba(255,138,38,0.17)_38%,transparent_74%)] blur-md transition duration-300 group-hover:right-[-42%] group-hover:w-[70%] group-hover:bg-[radial-gradient(ellipse_at_center,rgba(255,218,139,0.58)_0%,rgba(255,128,31,0.30)_42%,transparent_78%)]"
            />
            <span className="relative grid size-full place-items-center transition duration-300">
              <Image
                alt=""
                className="h-full w-full object-contain drop-shadow-[0_22px_34px_rgba(0,0,0,0.78)] transition duration-300 group-hover:drop-shadow-[0_0_30px_rgba(255,128,31,0.72)]"
                height={1772}
                priority
                src="/LOGO/Logo.png"
                width={1772}
              />
            </span>
          </Link>
        </div>
      </div>

      <Image
        alt=""
        className="absolute bottom-5 right-5 z-10 h-auto w-[min(24vw,112px)] opacity-90 drop-shadow-[0_8px_22px_rgba(0,0,0,0.72)] sm:bottom-7 sm:right-8 sm:w-[min(13vw,142px)]"
        height={1772}
        priority
        src="/LOGO/สำนักสร้าง.png"
        width={1772}
      />
    </main>
  );
}

function LandingImage({
  onFirstLoad,
  priority,
  url,
}: {
  onFirstLoad?: () => void;
  priority: boolean;
  url: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={PANEL_CLASS}>
      <Image
        alt=""
        className={`object-cover transition-opacity duration-1000 ease-out ${loaded ? "opacity-100" : "opacity-0"}`}
        draggable={false}
        fill
        onLoad={() => {
          setLoaded(true);
          onFirstLoad?.();
        }}
        priority={priority}
        sizes="100vw"
        src={url}
        unoptimized={isPayloadMediaSrc(url)}
      />
    </div>
  );
}
