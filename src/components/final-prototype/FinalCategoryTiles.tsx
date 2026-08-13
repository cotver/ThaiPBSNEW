"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CategoryTile } from "@/lib/payload-content";

export function FinalCategoryTiles({ categories }: { categories: CategoryTile[] }) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [loadedVideos, setLoadedVideos] = useState<Set<number>>(() => new Set());
  const [requestedVideos, setRequestedVideos] = useState<Set<number>>(() => new Set());

  if (!categories.length) return null;

  return (
    <section className="final-category-section" aria-label="Browse categories">
      <div className="final-category-diary">
        {categories.map((category) => {
          const isHovered = hoveredId === category.id;
          const hasImage = Boolean(category.imageUrl);
          const hasLoadedVideo = loadedVideos.has(category.id);
          const hasRequestedVideo = requestedVideos.has(category.id);
          const isGif = category.videoMimeType === "image/gif";
          const showVideo = isHovered && Boolean(category.videoUrl) && hasLoadedVideo;
          const showOnlyName = !hasImage && (!isHovered || !category.videoUrl || !hasLoadedVideo);

          return (
            <Link
              aria-label={`Open ${category.name}`}
              className={hasImage ? "final-category-tile" : "final-category-tile final-category-tile--name-only"}
              href={`/category/${encodeURIComponent(category.slug)}`}
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
              {category.imageUrl && (
                <Image
                  alt=""
                  className={showVideo ? "final-category-tile__image is-hidden" : "final-category-tile__image"}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  src={category.imageUrl}
                />
              )}

              {hasRequestedVideo && category.videoUrl && isGif && (
                <Image
                  alt=""
                  className={showVideo ? "final-category-tile__video is-visible" : "final-category-tile__video"}
                  fill
                  onLoad={() => setLoadedVideos((current) => new Set(current).add(category.id))}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  src={category.videoUrl}
                />
              )}

              {hasRequestedVideo && category.videoUrl && !isGif && (
                <video
                  aria-hidden="true"
                  autoPlay
                  className={showVideo ? "final-category-tile__video is-visible" : "final-category-tile__video"}
                  loop
                  muted
                  onCanPlay={() => setLoadedVideos((current) => new Set(current).add(category.id))}
                  playsInline
                  poster={category.imageUrl}
                  preload="auto"
                  src={category.videoUrl}
                />
              )}

              {!hasImage && (
                <>
                  {!showVideo && (
                    <span className={showOnlyName ? "final-category-tile__fallback is-name-only" : "final-category-tile__fallback"} />
                  )}
                  <span className="final-category-tile__sheen" />
                  <span className="final-category-tile__shade" />
                  <strong className="final-category-tile__name">{category.name}</strong>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
