import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrototypeProgramFooter } from "@/components/prototype/PrototypeProgramHeader";
import { titleEyebrow, titleInlineText, type Title } from "@/lib/content";
import { getCatalogTitle, getCatalogTitles } from "@/lib/payload-content";

export const dynamic = "force-dynamic";

export default async function PrototypeStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [title, catalog] = await Promise.all([getCatalogTitle(slug), getCatalogTitles()]);
  if (!title || title.isDiscontinued) notFound();

  const artwork = title.heroImage || title.posterImage;
  const inlineArtwork = title.posterImage || title.heroImage;
  const related = catalog.filter((item) => !item.isDiscontinued && item.slug !== title.slug).slice(0, 3);

  return (
    <main className="program-prototype min-h-screen overflow-hidden">
      <article>
        <header className="relative isolate overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[#030714]">
            {artwork ? <Image alt="" className="object-cover object-center" fill priority sizes="100vw" src={artwork} /> : <div className={`absolute inset-0 bg-gradient-to-br ${title.tone}`} />}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#030714_0%,rgba(3,7,20,.96)_18%,rgba(3,7,20,.64)_38%,rgba(3,7,20,.12)_78%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030714] via-transparent to-[#030714]/30" />
            <div className="program-prototype-noise absolute inset-0 opacity-15 mix-blend-soft-light" />
          </div>
          <div className="relative mx-auto flex min-h-[39rem] max-w-[1440px] items-end px-5 pb-14 pt-28 sm:min-h-[44rem] sm:px-8 sm:pb-20 lg:min-h-[48rem] lg:px-12">
            <div className="max-w-3xl">
              <Link className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-white/60 transition hover:text-white" href="/prototype/programs"><BackIcon />เรื่องล่าสุด</Link>
              <p className="text-xs font-black uppercase text-cyan-200">{titleEyebrow(title)} · Feature</p>
              <h1 className="mt-4 text-4xl font-black leading-[1.08] tracking-[-0.035em] sm:text-6xl lg:text-7xl">{titleInlineText(title)}</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-xl sm:leading-9">{title.description}</p>
              <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/15 pt-5 text-sm font-semibold text-white/58">
                <span className="text-white">กองบรรณาธิการ Thai PBS</span><span>·</span><span>{title.genre}</span><span>·</span><span>อ่าน 5 นาที</span>
              </div>
            </div>
          </div>
        </header>

        <section className="bg-[#030714] text-white">
          <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[minmax(0,46rem)_16rem] lg:px-12">
            <div className="program-editorial-body text-lg leading-[1.9] text-white/72 sm:text-xl">
              <p>{title.description}</p>
              <p>เรื่องราวของ {titleInlineText(title)} ชวนให้เราเข้าไปมองผู้คน สถานที่ และรายละเอียดเล็ก ๆ ที่มักถูกมองข้าม ผ่านสายตาแบบ Thai PBS ที่ให้พื้นที่กับความจริง ความหลากหลาย และเสียงของชุมชน</p>
              <h2>มองให้ใกล้กว่าเดิม</h2>
              <p>ภาพและบทสนทนาในเรื่องนี้ไม่ได้ทำหน้าที่เพียงบอกว่าเกิดอะไรขึ้น แต่ค่อย ๆ เปิดให้เห็นความสัมพันธ์ระหว่างผู้คนกับโลกที่พวกเขาอาศัยอยู่ เป็นการเล่าเรื่องที่สงบ ตรงไปตรงมา และให้ผู้ชมได้คิดต่อด้วยตัวเอง</p>

              {inlineArtwork ? (
                <figure className="my-12 sm:my-16">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] bg-white/8">
                    <Image alt={`ภาพจากเรื่อง ${titleInlineText(title)}`} className="object-cover" fill sizes="(max-width: 1024px) 100vw, 736px" src={inlineArtwork} />
                  </div>
                  <figcaption className="mt-4 text-sm leading-6 text-white/42">ภาพจาก {titleInlineText(title)} · Thai PBS</figcaption>
                </figure>
              ) : null}

              <h2>พื้นที่ของเรื่องเล่า</h2>
              <p>หัวใจสำคัญอยู่ที่การพาเราไปพบประสบการณ์จริงโดยไม่เร่งรีบ ความละเอียดของภาพ เสียง และจังหวะการเล่า ช่วยให้ประเด็นในเรื่องเข้าถึงง่ายขึ้น และยังคงเคารพความซับซ้อนของชีวิต</p>
              <blockquote className="my-12 border-l-4 border-cyan-200 pl-6 text-2xl font-black leading-snug text-white sm:my-16 sm:pl-8 sm:text-4xl">“ทุกเรื่องมีรายละเอียดที่ควรถูกมองเห็น และทุกเสียงมีพื้นที่ในสังคม”</blockquote>
              <p>นี่จึงไม่ใช่เพียงเนื้อหาที่จบลงเมื่ออ่านถึงบรรทัดสุดท้าย แต่เป็นจุดเริ่มต้นของคำถามใหม่ ๆ และบทสนทนาที่เชื่อมโยงกลับมาสู่ชีวิตประจำวันของเรา</p>
            </div>

            <aside className="h-fit border-t border-white/15 pt-6 lg:sticky lg:top-28" aria-label="ข้อมูลเรื่อง">
              <p className="text-xs font-black uppercase text-cyan-200">Story details</p>
              <dl className="mt-5 space-y-5 text-sm">
                <StoryMeta label="หมวดหมู่" value={title.genre} />
                <StoryMeta label="ประเภท" value={title.type} />
                <StoryMeta label="ปี" value={title.year} />
                <StoryMeta label="กองบรรณาธิการ" value="Thai PBS" />
              </dl>
            </aside>
          </div>
        </section>
      </article>

      {related.length ? <RelatedStories titles={related} /> : null}
      <PrototypeProgramFooter />
    </main>
  );
}

function RelatedStories({ titles }: { titles: Title[] }) {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
      <div className="mb-8 flex items-end justify-between border-b border-white/10 pb-5">
        <div><p className="text-xs font-black uppercase text-cyan-200">Keep reading</p><h2 className="mt-2 text-3xl font-black">เรื่องที่เกี่ยวข้อง</h2></div>
        <Link className="hidden text-sm font-bold text-white/55 hover:text-white sm:block" href="/prototype/programs">ดูทุกเรื่อง</Link>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {titles.map((item) => {
          const image = item.heroImage || item.posterImage;
          return (
            <article className="program-prototype-card overflow-hidden rounded-[8px] border border-white/9 bg-white/[0.055]" key={item.slug}>
              <Link className="group block" href={`/prototype/programs/${encodeURIComponent(item.slug)}`}>
                <div className="relative aspect-[16/10] overflow-hidden bg-[#07101f]">{image ? <Image alt="" className="object-cover transition duration-700 group-hover:scale-[1.04]" fill sizes="(max-width: 768px) 100vw, 33vw" src={image} /> : <div className={`absolute inset-0 bg-gradient-to-br ${item.tone}`} />}</div>
                <div className="p-5"><p className="text-[11px] font-black uppercase text-cyan-200">{item.genre}</p><h3 className="mt-2 text-xl font-black leading-snug">{titleInlineText(item)}</h3><p className="mt-3 line-clamp-2 text-sm leading-6 text-white/48">{item.description}</p></div>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function StoryMeta({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-bold text-white/36">{label}</dt><dd className="mt-1 font-bold text-white/78">{value}</dd></div>; }
function BackIcon() { return <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5m7 7-7-7 7-7"/></svg>; }
