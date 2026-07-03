import Image from "next/image";
import { notFound } from "next/navigation";
import { ContentRow } from "@/components/ContentRow";
import { getCategoryPage } from "@/lib/payload-content";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categoryPage = await getCategoryPage(slug);

  if (!categoryPage) {
    notFound();
  }

  const { category, titles } = categoryPage;

  return (
    <>
      <section className="relative min-h-[620px] px-5 pb-16 sm:px-8 lg:min-h-[700px] lg:px-10">
        {category.imageUrl ? (
          <Image
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            fill
            sizes="100vw"
            src={category.imageUrl}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-sky-900 to-cyan-500" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#030714_0%,rgba(3,7,20,0.94)_30%,rgba(3,7,20,0.42)_72%,#030714_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#030714] via-[#030714]/86 to-transparent" />

        <div className="relative z-10 flex min-h-[480px] max-w-4xl flex-col justify-end lg:min-h-[560px]">
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">
            {titles.length} title{titles.length === 1 ? "" : "s"}
          </div>
        </div>
      </section>

      <section className="-mt-20 space-y-9 px-5 pb-16 sm:px-8 lg:px-10">
        {titles.length > 0 ? (
          <ContentRow
            layout="vertical"
            title="Titles"
            titles={titles}
            viewAllHref={`/browse?category=${encodeURIComponent(category.slug)}&label=${encodeURIComponent(`${category.name} Programs`)}`}
          />
        ) : (
          <div className="rounded-[8px] border border-white/10 bg-white/6 p-8 text-white/70">
            No programs are connected to this category yet.
          </div>
        )}
      </section>
    </>
  );
}
