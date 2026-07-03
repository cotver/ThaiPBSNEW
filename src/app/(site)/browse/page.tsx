import { cookies } from "next/headers";
import { PosterCard } from "@/components/PosterCard";
import type { Title } from "@/lib/content";
import { getCatalogTitles } from "@/lib/payload-content";
import { parseWatchHistoryCookie, watchHistoryCookieName } from "@/lib/watch-history";

export const dynamic = "force-dynamic";

type BrowseParams = {
  category?: string;
  label?: string;
  section?: string;
  type?: string;
  year?: string;
};

export default async function BrowsePage({
  searchParams,
}: {
  searchParams?: Promise<BrowseParams>;
}) {
  const [params, cookieStore, titles] = await Promise.all([
    searchParams,
    cookies(),
    getCatalogTitles(),
  ]);
  const watchedSlugs = parseWatchHistoryCookie(cookieStore.get(watchHistoryCookieName)?.value);
  const filteredTitles = filterBrowseTitles(titles, params ?? {}, watchedSlugs);
  const heading = getBrowseHeading(params ?? {});

  return (
    <section className="px-5 pb-16 sm:px-8 lg:px-10">
      <div className="mb-8 max-w-4xl">
        <p className="text-sm font-bold uppercase text-cyan-200">Browse</p>
        <h1 className="mt-3 text-4xl font-black sm:text-6xl">{heading}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/62 sm:text-base">
          {filteredTitles.length} title{filteredTitles.length === 1 ? "" : "s"}
        </p>
      </div>

      {filteredTitles.length > 0 ? (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {filteredTitles.map((title) => (
            <PosterCard key={title.slug} orientation="portrait" title={title} />
          ))}
        </div>
      ) : (
        <div className="rounded-[8px] border border-white/10 bg-white/6 p-8 text-white/70">
          No titles match this browse view.
        </div>
      )}
    </section>
  );
}

function filterBrowseTitles(titles: Title[], params: BrowseParams, watchedSlugs: string[]) {
  const section = params.section ?? "all";
  const category = params.category;
  const type = params.type;
  const year = Number(params.year);
  let filteredTitles = titles;

  if (category) {
    filteredTitles = filteredTitles.filter((title) => title.categorySlugs?.includes(category));
  }

  if (type) {
    filteredTitles = filteredTitles.filter((title) => title.typeSlugs?.includes(type));
  }

  if (section === "continue-watching") {
    const titlesBySlug = new Map(filteredTitles.map((title) => [title.slug, title]));

    return watchedSlugs
      .map((slug) => titlesBySlug.get(slug))
      .filter((title): title is Title => Boolean(title));
  }

  if (section === "recommended") {
    return filteredTitles.filter((title) => title.isNew);
  }

  if (section === "continue-programs") {
    return filteredTitles.filter((title) => title.isContinue);
  }

  if (section === "discontinued-programs") {
    return filteredTitles.filter((title) => title.isDiscontinued);
  }

  if (section === "year" && Number.isInteger(year)) {
    return filteredTitles.filter((title) => title.homeYear === year);
  }

  if (section === "thai") {
    return filteredTitles.filter((title) => !title.isGlobalProgram);
  }

  if (section === "international") {
    return filteredTitles.filter((title) => title.isGlobalProgram);
  }

  return filteredTitles;
}

function getBrowseHeading(params: BrowseParams) {
  if (params.label) {
    return params.label;
  }

  if (params.section === "continue-watching") {
    return "Continue Watching";
  }

  if (params.section === "recommended") {
    return "Recommended For You";
  }

  if (params.section === "continue-programs") {
    return "Continue Programs";
  }

  if (params.section === "discontinued-programs") {
    return "Discontinued Programs";
  }

  if (params.section === "year" && params.year) {
    return `ThaiPBS Year ${params.year}`;
  }

  if (params.section === "thai") {
    return "Thai Programs";
  }

  if (params.section === "international") {
    return "International Programs";
  }

  if (params.section === "type") {
    return "Programs";
  }

  return "All Programs";
}
