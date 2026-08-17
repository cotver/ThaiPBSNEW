"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { finalArticleHref, titleInlineText, type Title } from "@/lib/content";

type FinalRowLayout = "landscape" | "portrait" | "wide";

export function FinalContentRow({
  layout,
  title,
  titles,
  viewAllHref,
}: {
  layout: FinalRowLayout;
  title: string;
  titles: Title[];
  viewAllHref: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const didDragRef = useRef(false);
  const dragActiveRef = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const updateScrollState = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
    setHasOverflow(maxScroll > 2);
    setCanScrollLeft(rail.scrollLeft > 2);
    setCanScrollRight(rail.scrollLeft < maxScroll - 2);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    rail.scrollLeft = 0;
    updateScrollState();
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(rail);
    Array.from(rail.children).forEach((child) => resizeObserver.observe(child));
    rail.addEventListener("scroll", updateScrollState, { passive: true });

    return () => {
      resizeObserver.disconnect();
      rail.removeEventListener("scroll", updateScrollState);
    };
  }, [titles, updateScrollState]);

  if (!titles.length) return null;

  function scroll(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;

    const card = rail.querySelector<HTMLElement>(".final-title-card");
    const gap = Number.parseFloat(getComputedStyle(rail).columnGap || "16") || 16;
    const cardWidth = card?.getBoundingClientRect().width ?? rail.clientWidth;
    const visibleCards = Math.max(1, Math.round((rail.clientWidth + gap) / (cardWidth + gap)));
    const pageWidth = visibleCards * (cardWidth + gap);
    const maxScroll = rail.scrollWidth - rail.clientWidth;
    const target = direction > 0
      ? (canScrollRight ? Math.min(maxScroll, rail.scrollLeft + pageWidth) : 0)
      : (canScrollLeft ? Math.max(0, rail.scrollLeft - pageWidth) : maxScroll);

    rail.scrollTo({ behavior: "smooth", left: target });
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
      rail.dataset.dragging = "true";
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }
    rail.scrollLeft = dragStartScrollRef.current - delta;
  }

  function stopDrag(event: React.PointerEvent<HTMLDivElement>) {
    dragActiveRef.current = false;
    railRef.current?.removeAttribute("data-dragging");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <section className="final-content-row" data-layout={layout} data-overflow={hasOverflow}>
      <header>
        <h2>{title}</h2>
        <Link href={viewAllHref}>View All <span aria-hidden="true">›</span></Link>
      </header>
      <div className="final-content-row__stage">
        {canScrollLeft ? (
          <button aria-label={`Previous ${title}`} className="final-row-arrow is-left" onClick={() => scroll(-1)} type="button">
            <span aria-hidden="true">‹</span>
          </button>
        ) : null}
        <div
          className="final-content-row__rail"
          onClickCapture={(event) => {
            if (didDragRef.current) {
              event.preventDefault();
              event.stopPropagation();
              didDragRef.current = false;
            }
          }}
          onDragStart={(event) => event.preventDefault()}
          onPointerCancel={stopDrag}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={stopDrag}
          ref={railRef}
        >
          {titles.map((item, index) => (
            <FinalTitleCard index={index} key={`${item.slug}-${index}`} layout={layout} title={item} />
          ))}
        </div>
        {canScrollRight ? (
          <button aria-label={`Next ${title}`} className="final-row-arrow is-right" onClick={() => scroll(1)} type="button">
            <span aria-hidden="true">›</span>
          </button>
        ) : null}
      </div>
    </section>
  );
}

function FinalTitleCard({ index, layout, title }: { index: number; layout: FinalRowLayout; title: Title }) {
  const image = layout === "portrait" ? title.posterImage || title.heroImage : title.heroImage || title.posterImage;
  const content = (
    <div className="final-title-card__image">
      {image ? (
        <Image
          alt=""
          className={title.isDiscontinued ? "is-discontinued" : undefined}
          fill
          loading={index < 7 ? "eager" : "lazy"}
          sizes={layout === "portrait" ? "(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1280px) 20vw, (max-width: 1536px) 17vw, 15vw" : "300px"}
          src={image}
        />
      ) : (
        <span className={`final-title-card__fallback bg-gradient-to-br ${title.tone}`} />
      )}
      <span className="final-title-card__shade" />
      {title.isDiscontinued ? <span className="final-title-card__badge">Discontinued</span> : null}
      <span className="final-title-card__copy">
        <small>{title.genre}</small>
        <strong>{titleInlineText(title)}</strong>
      </span>
      {title.progress ? <span className="final-title-card__progress" style={{ width: title.progress }} /> : null}
    </div>
  );

  return title.isDiscontinued ? (
    <article className="final-title-card" data-discontinued="true">
      {content}
    </article>
  ) : (
    <Link aria-label={`Open article for ${titleInlineText(title)}`} className="final-title-card" href={finalArticleHref(title.slug)}>
      {content}
    </Link>
  );
}
