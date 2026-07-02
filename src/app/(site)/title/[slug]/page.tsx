import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { TitleDetails } from "@/components/TitleDetails";
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
      <section className="relative min-h-[720px] overflow-hidden px-5 pb-20 text-white sm:px-8 lg:min-h-[780px] lg:px-10">
        {heroImage ? (
          <Image
            alt=""
            className="object-cover object-center lg:object-[70%_center]"
            fill
            priority
            sizes="100vw"
            src={heroImage}
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${title.tone}`} />
        )}
        {!heroImage ? (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_24%,rgba(255,255,255,0.24),transparent_22%),radial-gradient(circle_at_42%_62%,rgba(103,232,249,0.20),transparent_26%)]" />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#030714_0%,rgba(3,7,20,0.96)_24%,rgba(3,7,20,0.54)_60%,rgba(3,7,20,0.18)_78%,#030714_100%)]" />
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#030714]/95 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#030714] via-[#030714]/90 to-transparent" />

        <div className="relative z-10 flex min-h-[560px] max-w-3xl flex-col justify-end lg:min-h-[620px]">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
            {title.type === "Original" ? "ThaiPBS Parvilions Original" : title.type}
          </p>
          <h1 className="mt-3 max-w-4xl text-5xl font-black leading-[0.95] sm:text-7xl">
            {title.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-bold text-white/76">
            <span>{title.year}</span>
            <span className="rounded border border-white/28 px-1.5 py-0.5 text-[11px] text-white/88">
              {title.rating}
            </span>
            <span>{title.duration}</span>
            <span>{title.genre}</span>
          </div>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/78 sm:text-base">
            {title.description}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              className="inline-flex h-12 items-center gap-2 rounded-[6px] bg-white px-7 text-sm font-black uppercase text-[#030714] transition hover:bg-cyan-100"
              href={`/title/${title.slug}`}
            >
              <PlayIcon />
              Play
            </Link>
            <Link
              className="inline-flex h-12 items-center rounded-[6px] border border-white/16 bg-white/12 px-6 text-sm font-black uppercase text-white transition hover:bg-white/20"
              href={`/title/${title.slug}`}
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

      <section className="relative z-20 bg-[#030714] px-5 pb-16 pt-2 text-white sm:px-8 lg:px-10">
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
