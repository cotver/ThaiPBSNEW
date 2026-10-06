import { Suspense } from "react";
import { getHomePageData, HomePage } from "@/components/home/HomePage";
import { getStudiosShowcaseData } from "@/components/StudiosShowcase";
import type { Title } from "@/lib/content";
import { marketEventGroupHref, marketEventImage } from "@/lib/market-events";
import { marketCompanyLogo, marketLogoFrame } from "@/lib/market-logos";
import { toLotProgram, type LotLinkItem, type LotRoom } from "@/lib/studio/data";
import { plexThai } from "@/lib/studio/font";
import styles from "@/components/studio/experience.module.css";
import { LotExperience } from "./LotExperience";
import SiteLoading from "@/app/(site)/loading";

/**
 * The Studio Lot at /home/studio: the 3D walk, or with ?view=list its list view. LotExperience reads the
 * view from the URL, so both share this one server render. The studio layout brings the chrome (LotChrome).
 */
export function StudioLot() {
  return (
    <Suspense fallback={<div className={styles.siteLoader}><SiteLoading /></div>}>
      <StudioLotRooms />
    </Suspense>
  );
}

/** A "view all" link exactly as /home's ContentRow builds it (HomeSections). */
function browseHref(section: string, label: string, extra = "") {
  return `/browse?section=${section}${extra}&label=${encodeURIComponent(label)}`;
}

/** A ContentRow as a room. Titles pass through untouched — /home applies no extra filtering. */
function row(id: string, title: string, thai: string, titles: Title[], layout: NonNullable<LotRoom["layout"]>, viewAllHref: string): LotRoom {
  return {
    id,
    kind: "row",
    title,
    thai,
    blurb: `${titles.length} ${titles.length === 1 ? "program" : "programs"}`,
    programs: titles.map(toLotProgram),
    items: [],
    viewAllHref,
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
async function StudioLotRooms() {
  // The same per-request data /home renders from, so every room matches its section on the home page.
  const [{ categories, collections, showHiddenCatalogSections }, studios] = await Promise.all([
    getHomePageData(),
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
        categories.map((category) => ({ id: `category-${category.id}`, title: category.name, href: `/category/${encodeURIComponent(category.slug)}`, image: category.imageUrl })),
        { itemShape: "tile" })]
    : [];

  // ContentRows, with /home's own "view all" links.
  const rows: LotRoom[] = [
    row("recommended", "Recommended For You", "แนะนำสำหรับคุณ", collections.recommended, "poster", browseHref("recommended", "Recommended For You")),
    ...collections.typeRows.map((typeRow) =>
      row(`type-${typeRow.type.slug}`, typeRow.type.name, "ประเภทรายการ", typeRow.titles, "vertical", browseHref("type", typeRow.type.name, `&type=${encodeURIComponent(typeRow.type.slug)}`)),
    ),
    ...(showHiddenCatalogSections
      ? [
          row("continue-watching", "Continue Watching", "ดูต่อ", collections.continueWatching, "wide", browseHref("continue-watching", "Continue Watching")),
          row("continue-programs", "Continue Programs", "รายการต่อเนื่อง", collections.continuePrograms, "vertical", browseHref("continue-programs", "Continue Programs")),
          row("discontinued-programs", "Discontinued Programs", "รายการที่ยุติแล้ว", collections.discontinuedPrograms, "vertical", browseHref("discontinued-programs", "Discontinued Programs")),
          ...collections.yearRows.map((yearRow) =>
            row(`year-${yearRow.year}`, `ThaiPBS Year ${yearRow.year}`, `ปี ${yearRow.year}`, yearRow.titles, "vertical", browseHref("year", `ThaiPBS Year ${yearRow.year}`, `&year=${encodeURIComponent(String(yearRow.year))}`)),
          ),
          row("thai-programs", "Thai Programs", "รายการไทย", collections.thaiPrograms, "vertical", browseHref("thai", "Thai Programs")),
          row("international-programs", "International Programs", "รายการต่างประเทศ", collections.internationalPrograms, "vertical", browseHref("international", "International Programs")),
        ]
      : []),
  ].filter((room) => room.programs.length);

  const rooms = [featured, ...studioRooms, ...brandTiles, ...rows];
  // List view: the /home page itself (HomePage, which /home renders too, so any change to the home page
  // shows here as well) inside the same wrappers the site shell gives it, since the site's own shell is
  // hidden around the gallery. The Lot brings its own entrance, so the home intro card is left out.
  const listView = (
    <div data-site-shell>
      <div className="app-shell-content relative pb-20">
        <HomePage intro={false} />
      </div>
    </div>
  );

  return <LotExperience data={{ rooms }} fontFamily={plexThai.style.fontFamily} listView={listView} />;
}
