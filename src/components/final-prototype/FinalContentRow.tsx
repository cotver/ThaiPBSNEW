"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { titleEyebrow, titleHref, titleInlineText, type Title } from "@/lib/content";

type FinalRowLayout = "landscape" | "portrait" | "wide";

export function FinalContentRow({ layout, title, titles, viewAllHref }: { layout: FinalRowLayout; title: string; titles: Title[]; viewAllHref: string }) {
  const railRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const didDragRef = useRef(false);
  const dragActiveRef = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateScrollState() {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    setCanScrollLeft(rail.scrollLeft > 2);
    setCanScrollRight(rail.scrollLeft < max - 2);
  }

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const update = () => updateScrollState();
    update();
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { rail.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [titles]);

  if (!titles.length) return null;

  function scroll(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ behavior: "smooth", left: direction * Math.max(320, rail.clientWidth * 0.82) });
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    const rail = railRef.current;
    if (!rail || (event.pointerType === "mouse" && event.button !== 0)) return;
    dragActiveRef.current = true;
    didDragRef.current = false;
    dragStartXRef.current = event.clientX;
    dragStartScrollRef.current = rail.scrollLeft;
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    const rail = railRef.current;
    if (!rail || !dragActiveRef.current) return;
    const delta = event.clientX - dragStartXRef.current;
    if (Math.abs(delta) > 6) {
      didDragRef.current = true;
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
    }
    rail.scrollLeft = dragStartScrollRef.current - delta;
  }

  function stopDrag(event: React.PointerEvent<HTMLDivElement>) {
    dragActiveRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <section className="final-content-row" data-layout={layout}>
      <header>
        <h2>{title}</h2>
        <Link href={viewAllHref}>View All <span>›</span></Link>
      </header>
      <div className="final-content-row__stage">
        {canScrollLeft && <button aria-label={`Scroll ${title} left`} className="final-row-arrow is-left" onClick={() => scroll(-1)} type="button">‹</button>}
        <div
          className="final-content-row__rail"
          onClickCapture={(event) => { if (didDragRef.current) { event.preventDefault(); event.stopPropagation(); didDragRef.current = false; } }}
          onDragStart={(event) => event.preventDefault()}
          onPointerCancel={stopDrag}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={stopDrag}
          ref={railRef}
        >
          {titles.map((item, index) => <FinalTitleCard index={index} key={item.slug} layout={layout} title={item} />)}
        </div>
        {canScrollRight && <button aria-label={`Scroll ${title} right`} className="final-row-arrow is-right" onClick={() => scroll(1)} type="button">›</button>}
      </div>
    </section>
  );
}

function FinalTitleCard({ index, layout, title }: { index: number; layout: FinalRowLayout; title: Title }) {
  const image = layout === "portrait" ? title.posterImage || title.heroImage : title.heroImage || title.posterImage;
  return (
    <Link className="final-title-card" data-discontinued={title.isDiscontinued} href={titleHref(title.slug)}>
      <div className="final-title-card__image">
        {image ? <Image alt="" fill loading={index < 6 ? "eager" : "lazy"} sizes={layout === "portrait" ? "180px" : "300px"} src={image} /> : <span className={`final-title-card__fallback bg-gradient-to-br ${title.tone}`} />}
        <span className="final-title-card__shade" />
        {title.progress && <span className="final-title-card__progress" style={{ width: title.progress }} />}
      </div>
      <div className="final-title-card__copy">
        <small>{titleEyebrow(title)}</small>
        <strong>{titleInlineText(title)}</strong>
        <span>{[title.year, title.duration].filter(Boolean).join(" · ")}</span>
      </div>
    </Link>
  );
}
