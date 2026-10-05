"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { titleInlineText, type Title } from "@/lib/content";

type Filter = "all" | "new" | "thai" | "international";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "เรื่องทั้งหมด" },
  { id: "new", label: "เรื่องใหม่" },
  { id: "thai", label: "เรื่องจากไทย" },
  { id: "international", label: "เรื่องจากโลก" },
];

export function PrototypeProgramCatalog({ titles }: { titles: Title[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("th");
  const visibleTitles = useMemo(() => titles.filter((title) => {
    if (filter === "new" && !title.isNew) return false;
    if (filter === "thai" && title.isGlobalProgram) return false;
    if (filter === "international" && !title.isGlobalProgram) return false;
    if (!normalizedQuery) return true;
    return [title.title, title.genre, title.description, ...(title.categoryNames ?? [])]
      .join(" ")
      .toLocaleLowerCase("th")
      .includes(normalizedQuery);
  }), [filter, normalizedQuery, titles]);

  return (
    <section className="mx-auto max-w-[1440px] px-5 pb-24 pt-12 sm:px-8 lg:px-12 lg:pt-16" id="catalog">
      <div className="flex flex-col gap-7 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-cyan-200">Latest stories</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">เรื่องราวล่าสุด</h2>
          <p aria-live="polite" className="mt-2 text-sm text-white/52">พบ {visibleTitles.length.toLocaleString("th-TH")} เรื่อง</p>
        </div>
        <label className="flex h-12 w-full items-center gap-3 rounded-[6px] border border-white/12 bg-white/6 px-5 transition focus-within:border-cyan-200/70 focus-within:bg-white/9 lg:w-80">
          <SearchIcon />
          <span className="sr-only">ค้นหาเรื่องราว</span>
          <input className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35" onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาเรื่องราว หรือหมวดหมู่" type="search" value={query} />
        </label>
      </div>

      <div aria-label="ตัวกรองรายการ" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-7 sm:mx-0 sm:px-0" role="group">
        {filters.map((item) => (
          <button aria-pressed={filter === item.id} className={`shrink-0 rounded-[6px] px-5 py-2.5 text-sm font-black uppercase transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 ${filter === item.id ? "bg-white text-[#030714]" : "border border-white/12 bg-white/5 text-white/62 hover:border-white/25 hover:bg-white/10 hover:text-white"}`} key={item.id} onClick={() => setFilter(item.id)} type="button">
            {item.label}
          </button>
        ))}
      </div>

      {visibleTitles.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleTitles.map((title, index) => <ProgramCard key={title.slug} priority={index < 4} title={title} />)}
        </div>
      ) : (
        <div className="rounded-[8px] border border-dashed border-white/15 bg-white/4 px-6 py-20 text-center">
          <p className="text-xl font-bold">ไม่พบเรื่องที่ค้นหา</p>
          <button className="mt-4 text-sm font-bold text-cyan-200 hover:text-white" onClick={() => { setQuery(""); setFilter("all"); }} type="button">ล้างการค้นหา</button>
        </div>
      )}
    </section>
  );
}

function ProgramCard({ priority, title }: { priority: boolean; title: Title }) {
  const artwork = title.heroImage || title.posterImage;
  return (
    <article className="program-prototype-card group relative overflow-hidden rounded-[8px] border border-white/9 bg-white/[0.055]">
      <Link aria-label={`ดูรายละเอียด ${titleInlineText(title)}`} className="block focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-cyan-200" href={`/prototype/programs/${encodeURIComponent(title.slug)}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-[#07101f]">
          {artwork ? <Image alt="" className={`object-cover transition duration-700 group-hover:scale-[1.04] ${title.isDiscontinued ? "grayscale" : ""}`} fill priority={priority} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" src={artwork} /> : <div className={`absolute inset-0 bg-gradient-to-br ${title.tone}`} />}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07121b] via-transparent to-transparent opacity-80" />
          <div className="absolute left-4 top-4 flex gap-2">
            {title.isNew ? <span className="rounded-[4px] bg-cyan-200 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#030714]">เรื่องใหม่</span> : null}
          </div>
          <span className="absolute bottom-4 right-4 grid size-11 translate-y-2 place-items-center rounded-full bg-white text-[#07121b] opacity-0 shadow-xl transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"><ArrowIcon /></span>
        </div>
        <div className="p-5 pb-6">
          <p className="text-[11px] font-black uppercase text-cyan-200">{title.genre || "Thai PBS Story"}</p>
          <h3 className="mt-2 line-clamp-2 text-xl font-extrabold leading-snug text-white">{titleInlineText(title)}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/48">{title.description}</p>
          <div className="mt-5 flex items-center justify-between border-t border-white/9 pt-4 text-xs font-semibold">
            <span className="text-white/42">โดย กองบรรณาธิการ Thai PBS</span>
            <span className="inline-flex items-center gap-1.5 text-cyan-200">อ่านเรื่อง <ArrowIcon /></span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function SearchIcon() { return <svg aria-hidden="true" className="size-4 shrink-0 text-white/45" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>; }
function ArrowIcon() { return <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>; }
