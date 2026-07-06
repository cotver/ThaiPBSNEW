import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { DiscontinuedBadge } from "@/components/DiscontinuedBadge";
import { SaveForLaterButton } from "@/components/SaveForLaterButton";
import { TitleDetails } from "@/components/TitleDetails";
import { WatchHistoryMarker } from "@/components/WatchHistoryMarker";
import { titleEyebrow, titleHref } from "@/lib/content";
import { getCatalogTitle } from "@/lib/payload-content";
import { parseSavedTitlesCookie, savedTitlesCookieName } from "@/lib/saved-titles";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function TitlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [loadedTitle, cookieStore] = await Promise.all([getCatalogTitle(slug), cookies()]);

  if (!loadedTitle) {
    notFound();
  }

  const savedTitleSlugs = parseSavedTitlesCookie(cookieStore.get(savedTitlesCookieName)?.value);
  const title = {
    ...loadedTitle,
    inWatchlist: savedTitleSlugs.includes(loadedTitle.slug),
  };

  const heroAsset = title.heroImage || title.posterImage;
  const hasTrailer = title.source === "program" && Boolean(title.trailerUrl);
  const isGifTrailer = title.trailerMimeType === "image/gif";
  const showImageFade = title.showHeroDetails !== false;
  const useFullImage = title.source === "heroImage" && title.showHeroDetails === false;
  const titleLines = title.heroTitleLines?.length ? title.heroTitleLines : [title.title];
  const meta = [title.year, title.rating, title.duration].filter(Boolean);

  return (
    <>
      <WatchHistoryMarker slug={title.slug} />
      <section className="relative h-[clamp(620px,min(56.25vw,100vh),2160px)] overflow-hidden px-5 pb-24 text-white sm:px-8 lg:px-10">
        <div className="absolute inset-0 bg-[#030714]">
          {hasTrailer && title.trailerUrl ? (
            isGifTrailer ? (
              <img
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center"
                src={title.trailerUrl}
              />
            ) : (
              <video
                aria-hidden="true"
                autoPlay
                className="absolute inset-0 h-full w-full object-cover object-center"
                loop
                muted
                playsInline
                poster={heroAsset}
                preload="metadata"
                src={title.trailerUrl}
              />
            )
          ) : heroAsset ? (
            <div className={useFullImage ? "absolute inset-0" : "absolute inset-0 flex items-center justify-end"}>
              <div className={useFullImage ? "absolute inset-0" : "relative aspect-video w-[min(100%,calc(100vh*16/9))] max-h-full"}>
                <Image
                  alt=""
                  className="object-fill"
                  fill
                  priority
                  sizes="100vw"
                  src={heroAsset}
                />
                {showImageFade && (
                  <>
                    <div className="absolute inset-y-0 left-0 w-[10%] bg-gradient-to-r from-[#030714] via-[#030714]/70 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-[20%] bg-gradient-to-t from-[#030714]/90 via-[#030714]/45 to-transparent" />
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${title.tone}`} />
          )}
          {!heroAsset && !hasTrailer ? (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_28%,rgba(255,255,255,0.22),transparent_22%),radial-gradient(circle_at_55%_68%,rgba(34,211,238,0.18),transparent_28%)]" />
          ) : null}
          {title.showHeroDetails !== false ? (
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#030714_0%,rgba(3,7,20,0.96)_10%,rgba(3,7,20,0.7)_20%,rgba(3,7,20,0.22)_30%,transparent_78%)]" />
          ) : null}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-50 bg-gradient-to-t from-[#030714] via-[#030714]/40 to-transparent" />

        {title.showHeroDetails !== false ? (
          <div className="absolute bottom-20 left-5 z-10 max-w-3xl sm:left-8 lg:bottom-24 lg:left-10">
            <p className="mb-3 text-xs font-black uppercase text-cyan-200">
              {titleEyebrow(title)}
            </p>
            {title.isDiscontinued ? (
              <DiscontinuedBadge className="mb-4" />
            ) : null}
            <h1 className="max-w-3xl text-5xl font-black leading-[0.98] sm:text-6xl lg:text-7xl">
              {titleLines.map((line) => (
                <span className="block" key={line}>
                  {line}
                </span>
              ))}
            </h1>
            {meta.length > 0 ? (
              <p className="mt-4 text-sm font-bold text-white/72">
                {meta.join(" | ")}
              </p>
            ) : null}
            {title.description ? (
              <p className="mt-5 max-w-md text-sm leading-7 text-white/74 sm:text-base">
                {title.description}
              </p>
            ) : null}
            {title.genre ? (
              <p className="mt-4 max-w-2xl text-xs font-bold uppercase text-white/58 sm:text-sm">
                {title.genre}
              </p>
            ) : null}
            {title.showHeroActions !== false ? (
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className="inline-flex h-12 items-center gap-2 rounded-[6px] bg-white px-9 text-sm font-black uppercase text-[#030714] transition hover:bg-cyan-100"
                  href={titleHref(title.slug)}
                >
                  <PlayIcon />
                  Play
                </Link>
                <Link
                  className="inline-flex h-12 items-center rounded-[6px] border border-white/16 bg-white/12 px-8 text-sm font-black uppercase text-white backdrop-blur transition hover:bg-white/20"
                  href={titleHref(title.slug)}
                >
                  Details
                </Link>
                <SaveForLaterButton
                  className="grid size-12 place-items-center rounded-full border border-white/18 bg-black/35 text-2xl font-light transition hover:bg-white/18"
                  savedClassName="grid size-12 place-items-center rounded-full border border-cyan-200/40 bg-cyan-200 text-lg font-black text-[#030714] transition hover:bg-white"
                  title={title}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="relative z-10 bg-[#030714] px-5 pb-16 pt-2 text-white sm:px-8 lg:px-10">
        <TitleDetails title={title} />
      </section>
    </>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5.14v13.72c0 .7.77 1.12 1.36.74l10.78-6.86a.88.88 0 0 0 0-1.48L9.36 4.4A.88.88 0 0 0 8 5.14Z" />
    </svg>
  );
}
