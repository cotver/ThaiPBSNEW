import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketCompanyLogo } from "@/components/StudiosShowcase";
import { titleHref } from "@/lib/content";
import { getMarketCompany, type MarketCompanyProgram } from "@/lib/d1-market";

export const dynamic = "force-dynamic";

function formatDealDate(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function ProgramCard({ program }: { program: MarketCompanyProgram }) {
  const title = program.catalogTitle;
  const image = title?.heroImage || title?.posterImage;
  const canOpenTitle = Boolean(title && !title.isDiscontinued);
  const metadata = [
    program.contractType,
    program.status,
    typeof program.houseIdCount === "number" ? `${program.houseIdCount} house ID${program.houseIdCount === 1 ? "" : "s"}` : undefined,
  ].filter(Boolean);
  const dealDetails = [
    { label: "Start date", value: formatDealDate(program.startDate) },
    { label: "End date", value: formatDealDate(program.endDate) },
    {
      label: "Term",
      value: typeof program.termYears === "number" && program.termYears > 0
        ? `${program.termYears} year${program.termYears === 1 ? "" : "s"}`
        : undefined,
    },
  ].filter((detail): detail is { label: string; value: string } => Boolean(detail.value));

  const content = (
    <article className={`group flex h-full min-w-0 flex-col overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.03] transition ${canOpenTitle ? "hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.07]" : ""}`}>
      <div className={`relative aspect-video w-full shrink-0 overflow-hidden bg-gradient-to-br ${title?.tone || "from-slate-900 via-orange-700 to-amber-300"}`}>
        {image ? <Image alt="" className="object-cover transition duration-300 group-hover:scale-[1.025]" fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, (max-width: 1535px) 25vw, 20vw" src={image} /> : null}
        {!image ? <span className="absolute inset-0 flex items-center justify-center p-5 text-center text-sm font-black leading-tight text-white/88">{program.title}</span> : null}
        <div className="absolute inset-0 bg-black/10" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <h2 className="line-clamp-2 text-lg font-black leading-tight text-white">{program.title}</h2>
        {title?.description ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/62">{title.description}</p> : null}
        {metadata.length ? (
          <ul className="mt-3 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 text-[10px] font-bold uppercase tracking-wide text-white/44">
            {metadata.map((item) => <li key={item}>{item}</li>)}
          </ul>
        ) : null}
        {dealDetails.length ? (
          <dl className="mt-auto space-y-2 border-t border-white/10 pt-4">
            {dealDetails.map((detail) => (
              <div className="flex items-baseline justify-between gap-3" key={detail.label}>
                <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-white/38">{detail.label}</dt>
                <dd className="text-right text-xs font-bold text-white/78">{detail.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </article>
  );

  return canOpenTitle && title ? (
    <Link className="block h-full text-inherit no-underline" href={titleHref(title.slug)}>{content}</Link>
  ) : content;
}

export default async function MarketCompanyPage({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company: companySlug } = await params;
  const company = await getMarketCompany(companySlug);
  if (!company) notFound();

  return (
    <main className="min-h-screen bg-[#030714] text-white">
      <section className="flex min-h-[clamp(260px,36vw,500px)] items-center justify-center overflow-hidden bg-black px-8 py-16" aria-label={company.name}>
        <div className="relative h-[clamp(96px,12vw,160px)] w-[min(72vw,560px)]">
          <MarketCompanyLogo
            companyName={company.name}
            companySlug={company.slug}
            priority
            sizes="(max-width: 768px) 72vw, 560px"
          />
        </div>
      </section>

      <section className="relative z-10 scroll-mt-6 px-5 pb-20 pt-2 sm:px-8 lg:px-10" id="programs">
        <div className="border-b border-white/10 text-sm font-black uppercase tracking-[0.16em] text-white">
          <span className="inline-block border-b-2 border-white pb-3">Programs</span>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {company.programs.map((program) => <ProgramCard key={program.id} program={program} />)}
        </div>
      </section>
    </main>
  );
}
