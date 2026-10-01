"use client";

import { usePathname } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";
import type { LotCategory, LotProgram } from "../_lib/data";
import { cue } from "../_lib/sound";
import pages from "../pages.module.css";
import { PreviewSlate } from "./PreviewSlate";

type Sort = "featured" | "newest" | "title";

export function ProgramArchive({
  programs,
  types,
  categories,
  initialType,
  initialCategory,
}: {
  programs: LotProgram[];
  types: { slug: string; name: string }[];
  categories: LotCategory[];
  initialType?: string;
  initialCategory?: string;
}) {
  const pathname = usePathname();
  const [type, setType] = useState(initialType ?? "");
  const [category, setCategory] = useState(initialCategory ?? "");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const deferredQuery = useDeferredValue(query);

  const categoryName = categories.find((item) => item.slug === category)?.name;

  const results = useMemo(() => {
    const needle = deferredQuery.trim().toLocaleLowerCase();
    const filtered = programs.filter((program) => {
      if (type && !program.typeSlugs.includes(type)) return false;
      if (category && !program.typeSlugs.includes(category)) return false;
      if (needle && !`${program.title} ${program.genre} ${program.categories.join(" ")}`.toLocaleLowerCase().includes(needle)) return false;
      return true;
    });
    if (sort === "newest") return [...filtered].sort((a, b) => Number(b.year) - Number(a.year));
    if (sort === "title") return [...filtered].sort((a, b) => a.title.localeCompare(b.title, "th"));
    return filtered;
  }, [programs, type, category, deferredQuery, sort]);

  const syncUrl = (nextType: string, nextCategory: string) => {
    const params = new URLSearchParams();
    if (nextType) params.set("type", nextType);
    if (nextCategory) params.set("category", nextCategory);
    const search = params.toString();
    // Filtering is client-side; update the URL without refetching the page.
    window.history.replaceState(null, "", search ? `${pathname}?${search}` : pathname);
  };

  const chooseType = (value: string) => {
    cue("tick");
    setType(value);
    syncUrl(value, category);
  };

  const chooseCategory = (value: string) => {
    cue("tick");
    const next = value === category ? "" : value;
    setCategory(next);
    syncUrl(type, next);
  };

  return (
    <div className={pages.archive}>
      <div className={pages.controls}>
        <div aria-label="Format" className={pages.segmented} role="group">
          <button aria-pressed={!type} onClick={() => chooseType("")} type="button">
            All formats
          </button>
          {types.map((item) => (
            <button aria-pressed={type === item.slug} key={item.slug} onClick={() => chooseType(item.slug)} type="button">
              {item.name}
            </button>
          ))}
        </div>
        <div className={pages.controlRow}>
          <label className={pages.search}>
            <span className={pages.srOnly}>Search the vault</span>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <input onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, genres…" type="search" value={query} />
          </label>
          <label className={pages.sort}>
            <span>Sort</span>
            <select onChange={(event) => setSort(event.target.value as Sort)} value={sort}>
              <option value="featured">Running order</option>
              <option value="newest">Newest first</option>
              <option value="title">A–Z</option>
            </select>
          </label>
        </div>
        {categories.length ? (
          <ul aria-label="Categories" className={pages.categoryRail}>
            {categories.map((item) => (
              <li key={item.slug}>
                <button aria-pressed={category === item.slug} onClick={() => chooseCategory(item.slug)} type="button">
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <p aria-live="polite" className={pages.resultCount}>
        <strong>{results.length}</strong> {results.length === 1 ? "title" : "titles"} on the shelf
        {categoryName ? ` · ${categoryName}` : ""}
      </p>

      {results.length ? (
        <div className={pages.grid}>
          {results.map((program, index) => (
            <PreviewSlate index={index} key={program.slug} program={program} />
          ))}
        </div>
      ) : (
        <div className={pages.emptyShelf}>
          <p>Nothing on this shelf matches.</p>
          <button
            onClick={() => {
              setQuery("");
              chooseType("");
              setCategory("");
              syncUrl("", "");
            }}
            type="button"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
