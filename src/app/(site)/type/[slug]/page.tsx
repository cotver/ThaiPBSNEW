import { notFound } from "next/navigation";
import { ContentRow } from "@/components/ContentRow";
import { getCatalogCollections, getTypePage } from "@/lib/payload-content";

export const dynamic = "force-dynamic";

export default async function TypePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [typePage, collections] = await Promise.all([
    getTypePage(slug),
    getCatalogCollections(),
  ]);

  if (!typePage) {
    notFound();
  }

  const { type, titles } = typePage;
  const availableTitles = titles.filter((title) => !title.isDiscontinued);
  const heroMedia = type.videoUrl || type.imageUrl;

  return (
    <>
      <section className="relative min-h-[620px] px-5 pb-16 sm:px-8 lg:min-h-[700px] lg:px-10">
        {type.imageUrl ? (
          <img
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            src={type.imageUrl}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-sky-900 to-cyan-500" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#030714_0%,rgba(3,7,20,0.94)_30%,rgba(3,7,20,0.42)_72%,#030714_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#030714] via-[#030714]/86 to-transparent" />

        <div className="relative z-10 flex min-h-[480px] max-w-4xl flex-col justify-end lg:min-h-[560px]">
          <p className="mb-3 text-xs font-black uppercase text-cyan-200">Type</p>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.98] sm:text-6xl lg:text-7xl">
            {type.name}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/74 sm:text-base">
            Browse every program connected to {type.name}.
          </p>
          {heroMedia && (
            <div className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-white/48">
              {availableTitles.length} title{availableTitles.length === 1 ? "" : "s"}
            </div>
          )}
        </div>
      </section>

      <section className="-mt-20 space-y-9 px-5 pb-16 sm:px-8 lg:px-10">
        {availableTitles.length > 0 ? (
          <ContentRow layout="vertical" title={`${type.name} Programs`} titles={availableTitles} />
        ) : (
          <div className="rounded-[8px] border border-white/10 bg-white/6 p-8 text-white/70">
            No programs are connected to this type yet.
          </div>
        )}
        <ContentRow layout="poster" title="Recommended For You" titles={collections.recommended} />
      </section>
    </>
  );
}
