import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { finalArticleHref, titleEyebrow, titleInlineText } from "@/lib/content";
import { getCatalogCollections, getCatalogTitle, getCatalogTitles } from "@/lib/payload-content";

export const dynamic = "force-dynamic";

export default async function FinalArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [program, catalog, collections] = await Promise.all([getCatalogTitle(slug), getCatalogTitles(), getCatalogCollections()]);
  const title = program ?? collections.heroes.find((item) => item.slug === slug);

  if (!title || title.isDiscontinued) notFound();

  const image = title.heroImage || title.posterImage;
  const related = catalog.filter((item) => !item.isDiscontinued && item.slug !== title.slug).slice(0, 3);

  return (
    <main className="min-h-screen bg-[#030714] pb-20 text-white">
      <article>
        <header className="relative isolate min-h-[34rem] overflow-hidden border-b border-white/10 sm:min-h-[42rem]">
          <div className="absolute inset-0 bg-[#07101f]">
            {image ? <Image alt="" className="object-cover" fill priority sizes="100vw" src={image} /> : <span className={`absolute inset-0 bg-gradient-to-br ${title.tone}`} />}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#030714_0%,rgba(3,7,20,.92)_35%,rgba(3,7,20,.2)_75%,rgba(3,7,20,.4)_100%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030714] via-transparent to-[#030714]/30" />
          </div>
          <div className="relative mx-auto flex min-h-[34rem] max-w-[80rem] items-end px-5 pb-14 pt-28 sm:min-h-[42rem] sm:px-10 sm:pb-20">
            <div className="max-w-3xl">
              <Link className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-white/65 transition hover:text-cyan-200" href="/prototype/final">← Back to home</Link>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">{titleEyebrow(title)} · Article</p>
              <h1 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">{titleInlineText(title)}</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/75 sm:text-xl sm:leading-9">{title.description}</p>
              <p className="mt-6 text-sm font-semibold text-white/60">{[title.year, title.rating, title.duration, title.genre].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-[80rem] gap-12 px-5 py-16 sm:px-10 sm:py-24 lg:grid-cols-[minmax(0,46rem)_15rem]">
          <div className="space-y-8 text-lg leading-8 text-white/72 sm:text-xl sm:leading-9">
            <p>{title.description}</p>
            <p>เรื่องราวนี้พาเราเข้าใกล้ผู้คน สถานที่ และรายละเอียดที่มีความหมาย ผ่านมุมมองของ Thai PBS ที่ให้พื้นที่กับความจริง ความหลากหลาย และบทสนทนาที่ไปต่อได้.</p>
            {image ? <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10"><Image alt={`ภาพจาก ${titleInlineText(title)}`} className="object-cover" fill sizes="(max-width: 1024px) 100vw, 736px" src={image} /></div> : null}
            <h2 className="pt-4 text-3xl font-black leading-tight text-white sm:text-4xl">A story worth staying with.</h2>
            <p>ทุกตอนและทุกประเด็นชวนให้เรามองสิ่งรอบตัวอย่างละเอียดขึ้น ทั้งชีวิตประจำวัน ชุมชน และความเปลี่ยนแปลงที่เกิดขึ้นในสังคม.</p>
          </div>

          <aside className="h-fit border-t border-white/15 pt-6 lg:sticky lg:top-28">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Programme details</p>
            <dl className="mt-5 space-y-5 text-sm">
              <ArticleMeta label="Type" value={title.type} />
              <ArticleMeta label="Genre" value={title.genre} />
              <ArticleMeta label="Year" value={title.year} />
              {title.duration ? <ArticleMeta label="Duration" value={title.duration} /> : null}
            </dl>
          </aside>
        </div>
      </article>

      {related.length ? (
        <section className="mx-auto max-w-[80rem] px-5 pt-8 sm:px-10 sm:pt-12">
          <div className="mb-8 flex items-end justify-between border-b border-white/10 pb-5"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Keep exploring</p><h2 className="mt-2 text-3xl font-black">Related programmes</h2></div><Link className="text-sm font-bold text-white/60 hover:text-white" href="/prototype/final">View all</Link></div>
          <div className="grid gap-5 md:grid-cols-3">
            {related.map((item) => {
              const relatedImage = item.heroImage || item.posterImage;
              return <Link className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]" href={finalArticleHref(item.slug)} key={item.slug}><div className="relative aspect-[16/10] bg-[#07101f]">{relatedImage ? <Image alt="" className="object-cover transition duration-500 group-hover:scale-105" fill sizes="(max-width: 768px) 100vw, 33vw" src={relatedImage} /> : <span className={`absolute inset-0 bg-gradient-to-br ${item.tone}`} />}</div><div className="p-5"><p className="text-xs font-black uppercase text-cyan-200">{item.genre}</p><h3 className="mt-2 text-xl font-black leading-snug">{titleInlineText(item)}</h3><p className="mt-3 line-clamp-2 text-sm leading-6 text-white/55">{item.description}</p></div></Link>;
            })}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function ArticleMeta({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-bold text-white/40">{label}</dt><dd className="mt-1 font-bold text-white/80">{value}</dd></div>;
}
