import { cookies } from "next/headers";
import { Suspense } from "react";
import { HomeSections } from "@/components/HomeSections";
import { getStudiosShowcaseData } from "@/components/StudiosShowcase";
import type { Title } from "@/lib/content";
import { hiddenCatalogSectionsEnabled } from "@/lib/feature-flags";
import { marketEventGroupHref, marketEventImage } from "@/lib/market-events";
import { marketCompanyLogo, marketLogoFrame } from "@/lib/market-logos";
import { getCatalogCollections, getCategoryTiles } from "@/lib/payload-content";
import { parseSavedTitlesCookie, savedTitlesCookieName } from "@/lib/saved-titles";
import { parseWatchHistoryCookie, watchHistoryCookieName } from "@/lib/watch-history";
import { LotExperience } from "./_components/LotExperience";
import { RouteLeader } from "./_components/LotLoader";
import { lotBase, toLotProgram, type LotLinkItem, type LotRoom } from "./_lib/data";
import { plexThai } from "./_lib/font";
// The site's responsive rules for the home sections; every selector is scoped to [data-responsive-site].
import "../../../(site)/responsive.css";

export const dynamic = "force-dynamic";

// The leader is the first frame of the gallery either way, so it doubles as the streaming fallback.
export default function StudioLotPage() {
  return (
    <Suspense fallback={<RouteLeader />}>
      <StudioLot />
    </Suspense>
  );
}

const allPrograms = `${lotBase}/programs`;

/** A ContentRow as a room. Titles pass through untouched — /home applies no extra filtering. */
function row(id: string, title: string, thai: string, titles: Title[], layout: NonNullable<LotRoom["layout"]>, options: { viewAllHref?: string } = {}): LotRoom {
  return {
    id,
    kind: "row",
    title,
    thai,
    blurb: `${titles.length} ${titles.length === 1 ? "program" : "programs"}`,
    programs: titles.map(toLotProgram),
    items: [],
    viewAllHref: options.viewAllHref ?? allPrograms,
    layout,
  };
}

function links(id: string, title: string, thai: string, blurb: string, items: LotLinkItem[], options: { viewAllHref?: string; itemShape?: LotRoom["itemShape"] } = {}): LotRoom {
  return { id, kind: "links", title, thai, blurb, programs: [], items, viewAllHref: options.viewAllHref, itemShape: options.itemShape ?? "landscape" };
}

/**
 * One gallery room per /home section, in the same order and under the same conditions:
 * - HeroCarousel always renders (with its own empty state), so Featured is always a room.
 * - StudiosShowcase renders each sub-section only when it has content, and nothing at all when all are empty.
 * - BrandTiles renders nothing without categories.
 * - Each ContentRow renders nothing when it has no titles.
 * - The hidden catalogue rows sit behind the same SHOW_HIDDEN_CATALOG_SECTIONS flag.
 */
async function StudioLot() {
  const showHiddenCatalogSections = hiddenCatalogSectionsEnabled();
  const cookieStore = await cookies();
  const continueWatchingSlugs = parseWatchHistoryCookie(cookieStore.get(watchHistoryCookieName)?.value);
  const savedTitleSlugs = parseSavedTitlesCookie(cookieStore.get(savedTitlesCookieName)?.value);
  const [collections, categories, studios] = await Promise.all([
    getCatalogCollections(continueWatchingSlugs, savedTitleSlugs),
    getCategoryTiles(),
    getStudiosShowcaseData(),
  ]);

  const featured: LotRoom = {
    id: "featured",
    kind: "featured",
    title: "Featured",
    thai: "รายการแนะนำ",
    blurb: collections.heroes.length ? "The headline programs, on the big screen." : "No programs yet.",
    programs: collections.heroes.map(toLotProgram),
    items: [],
  };

  // StudiosShowcase — same sub-sections, same conditions, same limits, same links.
  const studioRooms: LotRoom[] = [
    links("studios-journal", "ThaiPBS Journal", "สตูดิโอ", "Featured stories from Thai PBS Studios.",
      studios.featuredArticles.map((article) => ({
        id: `journal-${article.id}`,
        title: article.title,
        href: article.href,
        image: article.imageUrl,
        meta: article.eyebrow,
        video: article.videoUrl ? { url: article.videoUrl, mimeType: article.videoMimeType } : undefined,
      })),
      { itemShape: "hero" }),
    links("studios-catalog", "Studios Catalog", "แคตตาล็อกสตูดิโอ", `${studios.categories.length} studio categories.`,
      studios.categories.map((category) => ({ id: `catalog-${category.id}`, title: category.name, href: `/studios/${encodeURIComponent(category.slug)}`, image: category.coverImageUrl, meta: category.description }))),
    links("studios-more", "More Studios Categories", "หมวดหมู่เพิ่มเติม", `${studios.otherCategories.length} more categories.`,
      studios.otherCategories.map((category) => ({ id: `more-${category.id}`, title: category.name, href: `/studios/${encodeURIComponent(category.slug)}`, image: category.coverImageUrl }))),
    links("press-releases", "Press Releases", "ข่าวประชาสัมพันธ์", "News from Thai PBS Studios.",
      studios.pressReleases.slice(0, 10).map((item) => ({ id: `press-${item.id}`, title: item.title, href: item.href, image: item.imageUrl, meta: item.date })),
      { viewAllHref: "/studios/news/press-releases", itemShape: "press" }),
    links("content-distribution", "Content Distribution", "การจัดจำหน่ายคอนเทนต์", "Partners carrying Thai PBS programs.",
      studios.marketCompanies.slice(0, 10).map((company) => ({
        id: `company-${company.slug}`,
        title: company.name,
        href: `/studios/market/${encodeURIComponent(company.slug)}`,
        meta: `${company.programCount} programs`,
        logo: { ...marketCompanyLogo(company.name, company.slug), frame: marketLogoFrame(company.slug) },
      })),
      { viewAllHref: "/studios/news/content-distribution", itemShape: "logo" }),
    links("market-events", "Market & Events", "ตลาดและกิจกรรม", "Markets, festivals and screenings.",
      studios.marketEventGroups.slice(0, 6).map((group) => ({ id: `event-${group.id}`, title: group.name, href: marketEventGroupHref(group.slug), image: marketEventImage(group.coverImage)?.url ?? undefined })),
      { viewAllHref: "/studios/events", itemShape: "square" }),
  ].filter((room) => room.items.length);

  // BrandTiles
  const brandTiles: LotRoom[] = categories.length
    ? [links("categories", "Categories", "หมวดหมู่", `${categories.length} collections to browse.`,
        categories.map((category) => ({ id: `category-${category.id}`, title: category.name, href: `${allPrograms}?category=${encodeURIComponent(category.slug)}`, image: category.imageUrl })),
        { itemShape: "tile" })]
    : [];

  const rows: LotRoom[] = [
    row("recommended", "Recommended For You", "แนะนำสำหรับคุณ", collections.recommended, "poster"),
    ...collections.typeRows.map((typeRow) =>
      row(`type-${typeRow.type.slug}`, typeRow.type.name, "ประเภทรายการ", typeRow.titles, "vertical", { viewAllHref: `${allPrograms}?type=${encodeURIComponent(typeRow.type.slug)}` }),
    ),
    ...(showHiddenCatalogSections
      ? [
          row("continue-watching", "Continue Watching", "ดูต่อ", collections.continueWatching, "wide", { viewAllHref: `${lotBase}/shortlist` }),
          row("continue-programs", "Continue Programs", "รายการต่อเนื่อง", collections.continuePrograms, "vertical"),
          row("discontinued-programs", "Discontinued Programs", "รายการที่ยุติแล้ว", collections.discontinuedPrograms, "vertical"),
          ...collections.yearRows.map((yearRow) => row(`year-${yearRow.year}`, `ThaiPBS Year ${yearRow.year}`, `ปี ${yearRow.year}`, yearRow.titles, "vertical")),
          row("thai-programs", "Thai Programs", "รายการไทย", collections.thaiPrograms, "vertical"),
          row("international-programs", "International Programs", "รายการต่างประเทศ", collections.internationalPrograms, "vertical"),
        ]
      : []),
  ].filter((room) => room.programs.length);

  const rooms = [featured, ...studioRooms, ...brandTiles, ...rows];
  // List view: the real /home sections — same components, data, conditions and links — inside the
  // same responsive wrappers the site layout gives them, so it looks and works exactly like /home.
  const listView = (
    <div data-responsive-site>
      <div data-site-shell>
        <div className="app-shell-content relative pb-20">
          <HomeSections categories={categories} collections={collections} showHiddenCatalogSections={showHiddenCatalogSections} />
        </div>
      </div>
    </div>
  );

  return <LotExperience data={{ rooms }} fontFamily={plexThai.style.fontFamily} listView={listView} />;
}
