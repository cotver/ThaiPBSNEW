"use client";

import Link from "next/link";
import { useState } from "react";
import type { CategoryTile } from "@/lib/payload-content";

export function BrandTiles({ categories }: { categories: CategoryTile[] }) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [loadedVideos, setLoadedVideos] = useState<Set<number>>(new Set());

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6" data-brand-rail>
      {categories.map((category) => {
        const isHovered = hoveredId === category.id;
        const hasImage = Boolean(category.imageUrl);
        const hasLoadedImage = loadedImages.has(category.id);
        const hasLoadedVideo = loadedVideos.has(category.id);
        const isGif = category.videoMimeType === "image/gif";
        const showVideo = isHovered && Boolean(category.videoUrl) && hasLoadedVideo;
        const showOnlyName =
          !hasImage && (!hasLoadedImage || (isHovered && Boolean(category.videoUrl) && !hasLoadedVideo));

        return (
          <Link
            aria-label={`Open ${category.name}`}
            className={`group relative aspect-video min-w-0 overflow-hidden rounded-[6px] border border-white/10 bg-[#111827] transition duration-300 hover:-translate-y-1 hover:scale-[1.035] hover:border-white/50 ${
              hasImage ? "" : "p-5 shadow-2xl shadow-black/40"
            }`}
            href={`/category/${encodeURIComponent(category.slug)}`}
            key={category.id}
            onMouseEnter={() => setHoveredId(category.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {category.imageUrl && (
              <img
                alt=""
                className={`absolute inset-0 h-full w-full object-cover transition duration-300 ${
                  hasLoadedImage && !showVideo ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() =>
                  setLoadedImages((current) => {
                    const next = new Set(current);
                    next.add(category.id);
                    return next;
                  })
                }
                src={category.imageUrl}
              />
            )}

            {isHovered && category.videoUrl && isGif && (
              <img
                alt=""
                className={`absolute inset-0 h-full w-full object-cover transition duration-300 ${
                  showVideo ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() =>
                  setLoadedVideos((current) => {
                    const next = new Set(current);
                    next.add(category.id);
                    return next;
                  })
                }
                src={category.videoUrl}
              />
            )}

            {isHovered && category.videoUrl && !isGif && (
              <video
                aria-hidden="true"
                autoPlay
                className={`absolute inset-0 h-full w-full object-cover transition duration-300 ${
                  showVideo ? "opacity-100" : "opacity-0"
                }`}
                loop
                muted
                onCanPlay={() =>
                  setLoadedVideos((current) => {
                    const next = new Set(current);
                    next.add(category.id);
                    return next;
                  })
                }
                playsInline
                preload="metadata"
                src={category.videoUrl}
              />
            )}

            {!hasImage && (
              <>
                {!showVideo && (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br from-slate-950 via-sky-900 to-cyan-500 transition duration-300 ${
                      showOnlyName ? "opacity-70" : "opacity-24 group-hover:opacity-12"
                    }`}
                  />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,0,0,0.38))]" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/58 to-transparent" />
                <div className="relative flex h-full items-center justify-center text-center text-2xl font-black text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.65)]">
                  {category.name}
                </div>
              </>
            )}
          </Link>
        );
      })}
    </div>
  );
}
