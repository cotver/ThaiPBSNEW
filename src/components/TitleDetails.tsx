"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { Title, TitleSeason } from "@/lib/content";

type DetailTab = "episodes" | "details";

export function TitleDetails({
  compact = false,
  title,
}: {
  compact?: boolean;
  title: Title;
}) {
  const seasons = title.seasons ?? [];
  const [activeTab, setActiveTab] = useState<DetailTab>("episodes");
  const [selectedSeasonId, setSelectedSeasonId] = useState(seasons[0]?.id ?? "");
  const selectedSeason = useMemo(
    () => seasons.find((season) => season.id === selectedSeasonId) ?? seasons[0],
    [seasons, selectedSeasonId],
  );
  const hasEpisodes = Boolean(selectedSeason && selectedSeason.episodes.length > 0);

  useEffect(() => {
    setSelectedSeasonId(seasons[0]?.id ?? "");
    setActiveTab("episodes");
  }, [seasons, title.slug]);

  return (
    <div className={compact ? "space-y-7 px-5 py-6 sm:px-9" : "space-y-8 px-5 py-7 sm:px-9 lg:px-10"}>
      <div className="flex gap-7 border-b border-white/10 text-sm font-black uppercase tracking-[0.16em] text-white/42">
        <TabButton active={activeTab === "episodes"} onClick={() => setActiveTab("episodes")}>
          Episodes
        </TabButton>
        <TabButton active={activeTab === "details"} onClick={() => setActiveTab("details")}>
          Details
        </TabButton>
      </div>

      {activeTab === "episodes" ? (
        <EpisodesPanel
          compact={compact}
          hasEpisodes={hasEpisodes}
          seasons={seasons}
          selectedSeason={selectedSeason}
          selectedSeasonId={selectedSeason?.id ?? ""}
          setSelectedSeasonId={setSelectedSeasonId}
          title={title}
        />
      ) : null}

      {activeTab === "details" ? <DetailsPanel title={title} /> : null}
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`border-b-2 pb-3 transition ${
        active ? "border-white text-white" : "border-transparent text-white/42 hover:text-white/78"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function EpisodesPanel({
  compact,
  hasEpisodes,
  seasons,
  selectedSeason,
  selectedSeasonId,
  setSelectedSeasonId,
  title,
}: {
  compact: boolean;
  hasEpisodes: boolean;
  seasons: TitleSeason[];
  selectedSeason: TitleSeason | undefined;
  selectedSeasonId: string;
  setSelectedSeasonId: (id: string) => void;
  title: Title;
}) {
  if (seasons.length === 0) {
    return (
      <section className="rounded-[8px] border border-white/10 bg-white/[0.04] p-6">
        <h2 className={compact ? "text-xl font-black" : "text-2xl font-black"}>Episodes</h2>
        <p className="mt-2 text-sm leading-6 text-white/62">
          Season and episode details will appear here when they are added in Payload.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className={compact ? "text-xl font-black" : "text-2xl font-black"}>Episodes</h2>
          <p className="mt-1 text-sm font-semibold text-white/52">
            {seasons.length} season available
          </p>
          {selectedSeason ? (
            <p className="mt-1 text-sm font-semibold text-white/52">
              {seasonSummaryLabel(selectedSeason)} | {selectedSeason.episodes.length} episode
            </p>
          ) : null}
        </div>
        <select
          aria-label="Select season"
          className="h-11 rounded-[6px] border border-white/14 bg-white/10 px-4 text-sm font-black text-white outline-none transition hover:bg-white/16 focus:border-white/50"
          onChange={(event) => setSelectedSeasonId(event.target.value)}
          value={selectedSeasonId}
        >
          {seasons.map((season) => (
            <option className="bg-[#111827] text-white" key={season.id} value={season.id}>
              {seasonLabel(season)}
            </option>
          ))}
        </select>
      </div>

      {selectedSeason?.description ? (
        <p className="max-w-3xl text-sm leading-6 text-white/64">{selectedSeason.description}</p>
      ) : null}

      {selectedSeason && hasEpisodes ? (
        <div className="divide-y divide-white/10 overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.03]">
          {selectedSeason.episodes.map((episode) => (
            <article
              className="grid gap-4 p-3 transition hover:bg-white/[0.06] sm:grid-cols-[168px_1fr_auto] sm:p-4"
              key={episode.id}
            >
              <div className={`relative aspect-video overflow-hidden rounded-[6px] bg-gradient-to-br ${title.tone}`}>
                {episode.image || selectedSeason.image || title.heroImage || title.posterImage ? (
                  <Image
                    alt=""
                    className="object-cover"
                    fill
                    sizes="168px"
                    src={episode.image || selectedSeason.image || title.heroImage || title.posterImage || ""}
                  />
                ) : null}
                <div className="absolute inset-0 bg-black/18" />
                <div className="absolute inset-0 grid place-items-center opacity-0 transition hover:opacity-100">
                  <span className="grid size-11 place-items-center rounded-full bg-white text-[#030714]">
                    <PlayIcon />
                  </span>
                </div>
              </div>
              <div className="min-w-0 py-1">
                <div className="flex items-center gap-3">
                  {episode.episodeNumber ? (
                    <span className="text-sm font-black text-white/40">{episode.episodeNumber}</span>
                  ) : null}
                  <h3 className="line-clamp-1 text-base font-black">{episode.title}</h3>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/62">{episode.description}</p>
                {episode.releaseDate ? (
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-white/34">{episode.releaseDate}</p>
                ) : null}
              </div>
              <div className="hidden items-start pt-1 text-sm font-bold text-white/46 sm:flex">
                {episode.duration ?? "Episode"}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-6 text-sm text-white/62">
          Episodes for this season will be available soon.
        </div>
      )}
    </section>
  );
}

function DetailsPanel({ title }: { title: Title }) {
  return (
    <section className="grid gap-6 text-sm md:grid-cols-[1.4fr_1fr]">
      <div>
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white/42">About</h2>
        <p className="mt-3 leading-7 text-white/70">{title.description}</p>
      </div>
      <dl className="grid grid-cols-2 gap-x-5 gap-y-4 md:grid-cols-1">
        <Meta label="Type" value={title.type} />
        <Meta label="Genre" value={title.genre} />
        <Meta label="Released" value={title.year} />
        <Meta label="Rating" value={title.rating} />
      </dl>
    </section>
  );
}

function seasonLabel(season: TitleSeason) {
  if (season.seasonNumber) {
    return season.title.toLowerCase().startsWith("season") ? season.title : `Season ${season.seasonNumber}: ${season.title}`;
  }

  return season.title;
}

function seasonSummaryLabel(season: TitleSeason) {
  if (season.seasonNumber) {
    return `season ${season.seasonNumber}`;
  }

  return season.title.toLowerCase();
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-[0.16em] text-white/34">{label}</dt>
      <dd className="mt-1 font-semibold text-white/78">{value}</dd>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5.14v13.72c0 .7.77 1.12 1.36.74l10.78-6.86a.88.88 0 0 0 0-1.48L9.36 4.4A.88.88 0 0 0 8 5.14Z" />
    </svg>
  );
}
