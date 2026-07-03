import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { TitleDetails } from "@/components/TitleDetails";
import { WatchHistoryMarker } from "@/components/WatchHistoryMarker";
import { titleHref } from "@/lib/content";
import { getCatalogTitle } from "@/lib/payload-content";

export const dynamic = "force-dynamic";

export default async function TitlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const title = await getCatalogTitle(slug);

  if (!title) {
    notFound();
  }

  const heroImage = title.heroImage || title.posterImage;

  return (
    <>
      <WatchHistoryMarker slug={title.slug} />
      <section className="relative min-h-[1080px] overflow-hidden px-5 pb-24 text-white sm:px-8 lg:min-h-[1080px] lg:px-10">
        {heroImage ? (
          <div className="absolute inset-x-0 top-0 aspect-video w-full">
            <Image
              alt=""
              className="object-cover object-center"
              fill
              priority
              sizes="100vw"
              src={heroImage}
            />
          </div>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${title.tone}`} />
        )}
        {!heroImage ? (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_28%,rgba(255,255,255,0.22),transparent_22%),radial-gradient(circle_at_55%_68%,rgba(34,211,238,0.18),transparent_28%)]" />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#030714_0%,rgba(3,7,20,0.94)_28%,rgba(3,7,20,0.38)_48%,transparent_68%)]" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#030714] via-[#030714]/92 to-transparent" />

        <div className="relative z-10 flex min-h-[560px] max-w-3xl flex-col justify-end lg:min-h-[590px]">
          <p className="mb-3 text-xs font-black uppercase text-cyan-200">
            {title.type === "Original" ? "ThaiPBS Parvilions Original" : title.type}
          </p>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.98] sm:text-6xl lg:text-7xl">
            {title.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-bold text-white/72">
            <span>{title.year}</span>
            <span className="rounded border border-white/28 px-1.5 py-0.5 text-[11px] text-white/88">
              {title.rating}
            </span>
            <span>{title.duration}</span>
          </div>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/78 sm:text-base">
            {title.description}
          </p>
          <p className="mt-4 max-w-2xl text-xs font-bold uppercase text-white/58 sm:text-sm">
            {title.genre}
          </p>
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
            <Link
              aria-label="Open watchlist"
              className="grid size-12 place-items-center rounded-full border border-white/18 bg-black/40 text-2xl font-light transition hover:bg-white/18"
              href="/watchlist"
            >
              +
            </Link>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-16 bg-[#030714] px-5 pb-16 pt-2 text-white sm:px-8 lg:px-10">
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
