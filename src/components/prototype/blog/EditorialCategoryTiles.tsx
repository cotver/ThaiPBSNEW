"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CategoryTile } from "@/lib/payload-content";
import type { PrototypeStyle } from "./blog-data";

export function EditorialCategoryTiles({ categories, style }: { categories: CategoryTile[]; style: PrototypeStyle }) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [loadedVideos, setLoadedVideos] = useState<Set<number>>(new Set());
  const [requestedVideos, setRequestedVideos] = useState<Set<number>>(new Set());

  if (!categories.length) return null;

  return (
    <section className="bp-brand-section" aria-labelledby="explore-categories">
      <div className="bp-editorial-heading">
        <h2 id="explore-categories">Explore</h2>
        <span>{categories.length.toLocaleString("th-TH")} categories</span>
      </div>
      <div className="bp-brand-tiles" data-brand-rail>
        {categories.map((category) => {
          const hasImage = Boolean(category.imageUrl);
          const hasLoadedVideo = loadedVideos.has(category.id);
          const hasRequestedVideo = requestedVideos.has(category.id);
          const isHovered = hoveredId === category.id;
          const isGif = category.videoMimeType === "image/gif";
          const showVideo = isHovered && Boolean(category.videoUrl) && hasLoadedVideo;
          const showOnlyName = !hasImage && (!isHovered || !category.videoUrl || !hasLoadedVideo);

          return (
            <Link
              aria-label={`Open ${category.name}`}
              className={`bp-brand-tile ${hasImage ? "has-image" : "is-name-only"}`}
              href={`/prototype/${style}/category/${encodeURIComponent(category.slug)}`}
              key={category.id}
              onMouseEnter={(event) => {
                setHoveredId(category.id);
                if (category.videoUrl) {
                  setRequestedVideos((current) => new Set(current).add(category.id));
                  event.currentTarget.querySelector("video")?.play().catch(() => undefined);
                }
              }}
              onMouseLeave={(event) => {
                setHoveredId(null);
                event.currentTarget.querySelector("video")?.pause();
              }}
            >
              {category.imageUrl ? <Image alt="" className="bp-cover bp-brand-tile__image" fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw" src={category.imageUrl} /> : null}
              {hasRequestedVideo && category.videoUrl && isGif ? (
                <Image alt="" className={`bp-brand-tile__motion ${showVideo ? "is-visible" : ""}`} fill onLoad={() => setLoadedVideos((current) => new Set(current).add(category.id))} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw" src={category.videoUrl} />
              ) : null}
              {hasRequestedVideo && category.videoUrl && !isGif ? (
                <video aria-hidden="true" autoPlay className={`bp-brand-tile__motion ${showVideo ? "is-visible" : ""}`} loop muted onCanPlay={() => setLoadedVideos((current) => new Set(current).add(category.id))} playsInline poster={category.imageUrl} preload="auto" src={category.videoUrl} />
              ) : null}
              {!hasImage ? (
                <>
                  {!showVideo ? <div className={`bp-brand-tile__fallback ${showOnlyName ? "show-name" : "show-motion"}`} data-tone={category.id % 4} /> : null}
                  <div className="bp-brand-tile__sheen" />
                  <div className="bp-brand-tile__fade" />
                  <strong>{category.name}</strong>
                </>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
