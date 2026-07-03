import type { Category, Episode, HeroImage, Landing, Media, Program, Season, Video } from "../../payload-types";
import type { NavItem, Title } from "@/lib/content";
import { getPayloadClient } from "@/lib/payload-client";

export type TitleCollections = {
  continueWatching: Title[];
  heroes: Title[];
  internationalPrograms: Title[];
  movies: Title[];
  originals: Title[];
  posterMockups: Title[];
  recommended: Title[];
  series: Title[];
  thaiPrograms: Title[];
  trending: Title[];
  typeRows: TypeProgramRow[];
  watchlist: Title[];
  yearRows: YearProgramRow[];
};

export type TypeProgramRow = {
  titles: Title[];
  type: TypeTile;
};

export type YearProgramRow = {
  titles: Title[];
  year: number;
};

export type CategoryTile = {
  id: number;
  imageUrl?: string;
  name: string;
  slug: string;
  videoMimeType?: string;
  videoUrl?: string;
};

export type TypeTile = CategoryTile & {
  icon?: string;
  link?: string;
};

type TypeDoc = {
  id: number;
  appShellActive?: boolean | null;
  icon?: string | null;
  image?: Category["image"];
  isActive?: boolean | null;
  link?: string | null;
  name?: string | null;
  slug?: string | null;
  video?: Category["video"];
};

const emptyCollections: TitleCollections = {
  recommended: [],
  continueWatching: [],
  trending: [],
  originals: [],
  movies: [],
  posterMockups: [],
  series: [],
  watchlist: [],
  heroes: [],
  internationalPrograms: [],
  thaiPrograms: [],
  typeRows: [],
  yearRows: [],
};

const tones = [
  "from-indigo-950 via-sky-700 to-amber-300",
  "from-slate-950 via-violet-700 to-cyan-300",
  "from-orange-600 via-rose-400 to-yellow-200",
  "from-teal-900 via-emerald-600 to-sky-300",
  "from-zinc-950 via-red-800 to-stone-300",
  "from-cyan-700 via-blue-500 to-lime-200",
  "from-blue-950 via-fuchsia-700 to-pink-300",
  "from-sky-800 via-cyan-500 to-amber-200",
];

export async function getCatalogCollections(continueWatchingSlugs: string[] = []): Promise<TitleCollections> {
  const [titles, heroImages, typeRows] = await Promise.all([
    getPayloadTitles(),
    getHeroImageTitles(),
    getHomeTypeRows(),
  ]);
  const collections = buildTitleCollections(titles, continueWatchingSlugs);

  return {
    ...collections,
    heroes: [...heroImages, ...collections.heroes],
    typeRows,
  };
}

export async function getCatalogTitles(): Promise<Title[]> {
  const titles = await getPayloadTitles();

  return titles;
}

export async function getCatalogTitle(slug: string): Promise<Title | undefined> {
  try {
    const titleKey = normalizeSlugLookupKey(slug);
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "programs",
      depth: 3,
      limit: 1,
      overrideAccess: true,
      where: {
        or: [
          {
            slug: {
              equals: slug,
            },
          },
          {
            slug: {
              equals: titleKey,
            },
          },
        ],
      },
    });

    const program = result.docs[0];
    const title = program ? (programToTitle(program) ?? undefined) : undefined;

    if (!title) {
      return undefined;
    }

    return title;
  } catch (error) {
    console.warn(`Unable to load Payload program "${slug}"`, error);
    return undefined;
  }
}

export async function getLandingImageUrls(): Promise<string[]> {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "landing",
      depth: 1,
      limit: 20,
      overrideAccess: true,
      sort: "createdAt",
    });

    return result.docs
      .map((item) => mediaUrl(item.heroImage))
      .filter((url): url is string => Boolean(url));
  } catch (error) {
    console.warn("Unable to load Payload landing images", error);
    return [];
  }
}

export async function getCategoryTiles(): Promise<CategoryTile[]> {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "categories",
      depth: 2,
      limit: 6,
      overrideAccess: true,
      sort: "_order",
      where: {
        isActive: {
          equals: true,
        },
      },
    });

    return result.docs.map(categoryToTile).filter((tile): tile is CategoryTile => Boolean(tile));
  } catch (error) {
    console.warn("Unable to load Payload categories for brand tiles", error);
    return [];
  }
}

export async function getTypeNavItems(): Promise<NavItem[]> {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "categories",
      depth: 0,
      limit: 20,
      overrideAccess: true,
      sort: "_order",
      where: {
        appShellActive: {
          equals: true,
        },
      },
    });

    return result.docs
      .map((item) => typeToTile(item as TypeDoc))
      .filter((type): type is TypeTile => Boolean(type))
      .map((type) => ({
        href: type.link || `/category/${encodeURIComponent(type.slug)}`,
        icon: type.icon || "film",
        label: type.name,
      }));
  } catch (error) {
    console.warn("Unable to load Payload categories for AppShell navigation", error);
    return [];
  }
}

export async function getCategoryPage(slug: string): Promise<{ category: CategoryTile; titles: Title[] } | null> {
  try {
    const payload = await getPayloadClient();
    const cleanSlug = normalizeSlugLookupKey(slug);
    const categoryResult = await payload.find({
      collection: "categories",
      depth: 2,
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          {
            or: [
              {
                slug: {
                  equals: slug,
                },
              },
              {
                slug: {
                  equals: cleanSlug,
                },
              },
            ],
          },
          {
            or: [
              {
                isActive: {
                  equals: true,
                },
              },
              {
                appShellActive: {
                  equals: true,
                },
              },
            ],
          },
        ],
      },
    });
    const category = categoryResult.docs[0];
    const tile = category ? categoryToTile(category) : null;

    if (!category || !tile) {
      return null;
    }

    const programsResult = await payload.find({
      collection: "programs",
      depth: 3,
      limit: 80,
      overrideAccess: true,
      sort: "-updatedAt",
      where: {
        categories: {
          contains: category.id,
        },
      },
    });

    return {
      category: tile,
      titles: programsResult.docs.map(programToTitle).filter((title): title is Title => Boolean(title)),
    };
  } catch (error) {
    console.warn(`Unable to load Payload category "${slug}"`, error);
    return null;
  }
}

export async function getTypePage(slug: string): Promise<{ type: TypeTile; titles: Title[] } | null> {
  try {
    const payload = await getPayloadClient();
    const cleanSlug = normalizeSlugLookupKey(slug);
    const typeResult = await payload.find({
      collection: "categories",
      depth: 2,
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          {
            or: [
              {
                slug: {
                  equals: slug,
                },
              },
              {
                slug: {
                  equals: cleanSlug,
                },
              },
            ],
          },
          {
            or: [
              {
                isActive: {
                  equals: true,
                },
              },
              {
                appShellActive: {
                  equals: true,
                },
              },
            ],
          },
        ],
      },
    });
    const typeDoc = typeResult.docs[0] as TypeDoc | undefined;
    const tile = typeDoc ? typeToTile(typeDoc) : null;

    if (!typeDoc || !tile) {
      return null;
    }

    const programsResult = await payload.find({
      collection: "programs",
      depth: 3,
      limit: 80,
      overrideAccess: true,
      sort: "-updatedAt",
      where: {
        categories: {
          contains: typeDoc.id,
        },
      },
    });

    return {
      type: tile,
      titles: programsResult.docs.map(programToTitle).filter((title): title is Title => Boolean(title)),
    };
  } catch (error) {
    console.warn(`Unable to load Payload type "${slug}"`, error);
    return null;
  }
}

async function getPayloadTitles(): Promise<Title[]> {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "programs",
      depth: 3,
      limit: 1000,
      overrideAccess: true,
      sort: "-updatedAt",
    });

    return result.docs.map(programToTitle).filter((title): title is Title => Boolean(title));
  } catch (error) {
    console.warn("Unable to load Payload programs for catalog", error);
    return [];
  }
}

async function getHeroImageTitles(): Promise<Title[]> {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "heroImages",
      depth: 1,
      limit: 1000,
      overrideAccess: true,
      sort: "-updatedAt",
      where: {
        isActive: {
          equals: true,
        },
      },
    });

    return result.docs.map(heroImageToTitle).filter((title): title is Title => Boolean(title));
  } catch (error) {
    console.warn("Unable to load Payload hero images for homepage", error);
    return [];
  }
}

async function getHomeTypeRows(): Promise<TypeProgramRow[]> {
  try {
    const payload = await getPayloadClient();
    const typesResult = await payload.find({
      collection: "categories",
      depth: 2,
      limit: 1000,
      overrideAccess: true,
      sort: "_order",
      where: {
        isActive: {
          equals: true,
        },
      },
    });

    const rows = await Promise.all(
      typesResult.docs.map(async (typeDoc) => {
        const tile = typeToTile(typeDoc as TypeDoc);

        if (!tile) {
          return null;
        }

        const programsResult = await payload.find({
          collection: "programs",
          depth: 3,
          limit: 80,
          overrideAccess: true,
          sort: "-updatedAt",
          where: {
            categories: {
              contains: typeDoc.id,
            },
          },
        });

        const titles = programsResult.docs.map(programToTitle).filter((title): title is Title => Boolean(title));

        return titles.length > 0 ? { titles, type: tile } : null;
      }),
    );

    return rows.filter((row): row is TypeProgramRow => Boolean(row));
  } catch (error) {
    console.warn("Unable to load Payload type rows for homepage", error);
    return [];
  }
}

function heroImageToTitle(hero: HeroImage): Title | null {
  const title = cleanText(hero.title);
  const image = mediaUrl(hero.image);

  if (!title || !image) {
    return null;
  }

  const slug = `hero-image-${hero.id}`;

  return {
    slug,
    title,
    type: "Original",
    genre: [
      ...relationNames((hero as { genre?: unknown }).genre),
      ...relationNames((hero as { subGenre?: unknown }).subGenre),
    ].join(" | "),
    year: cleanText(hero.year),
    rating: cleanText(hero.rating),
    duration: cleanText(hero.duration),
    eyebrow: cleanText(hero.eyebrow),
    description: cleanText(hero.description),
    featured: true,
    heroImage: image,
    showHeroActions: false,
    showHeroDetails: hero.showDetails !== false,
    source: "heroImage",
    tone: tones[Math.abs(hashString(slug)) % tones.length],
  };
}

export function buildTitleCollections(titles: Title[], continueWatchingSlugs: string[] = []): TitleCollections {
  if (titles.length === 0) {
    return emptyCollections;
  }

  const featured = titles.filter((title) => title.featured);
  const originals = titles.filter((title) => title.type === "Original");
  const movies = titles.filter((title) => title.type === "Movie" || title.type === "Original");
  const series = titles.filter((title) => title.type === "Series");
  const titlesBySlug = new Map(titles.map((title) => [title.slug, title]));
  const continueWatching = continueWatchingSlugs
    .map((slug) => titlesBySlug.get(slug))
    .filter((title): title is Title => Boolean(title));
  const watchlist = titles.filter((title) => title.inWatchlist);
  const currentYear = new Date().getFullYear();
  const homeYears = [currentYear, currentYear + 1];

  return {
    recommended: titles.filter((title) => title.isNew).slice(0, 12),
    continueWatching,
    trending: titles.filter((title) => title.featured || title.inWatchlist).slice(0, 12),
    typeRows: [],
    originals: originals.length > 0 ? originals : featured,
    movies: movies.length > 0 ? movies : titles,
    posterMockups: titles.slice(0, 14),
    series,
    thaiPrograms: titles.filter((title) => !title.isGlobalProgram).slice(0, 12),
    internationalPrograms: titles.filter((title) => title.isGlobalProgram).slice(0, 12),
    watchlist: watchlist.length > 0 ? watchlist : featured.slice(0, 8),
    heroes: featured,
    yearRows: homeYears.map((year) => ({
      year,
      titles: titles.filter((title) => title.homeYear === year).slice(0, 12),
    })),
  };
}

function programToTitle(program: Program): Title | null {
  const titleTh = cleanText(program.titleTh);
  const titleEn = cleanText(program.titleEn);
  const title = titleTh || titleEn || cleanText(program._displayTitle);
  const heroTitleLines = uniqueTextLines([titleTh, titleEn]);

  if (!title || !program.slug) {
    return null;
  }

  const type = getTitleType(program);
  const genre = [
    ...relationNames((program as { genre?: unknown }).genre),
    ...relationNames((program as { genre_sub?: unknown }).genre_sub),
  ].join(" | ") ||
    cleanText(program.type) ||
    "ThaiPBS";
  const fallbackYear = program.productionYear?.toString() || dateYear(program.firstRun) || dateYear(program.createdAt) || "New";
  const year = program.comingSoon ? dateYear(program.comingSoonDate) || fallbackYear : fallbackYear;
  const duration = formatDuration(program.duration, type);
  const description =
    cleanText(program.synopsisTh) ||
    cleanText(program.synopsisEn) ||
    cleanText(program.tags) ||
    "Watch this title from the ThaiPBS catalog.";

  return {
    slug: program.slug,
    title,
    type,
    genre,
    year,
    rating: getRating(program),
    duration,
    description,
    categoryNames: relationNames((program as { categories?: unknown }).categories),
    categorySlugs: relationSlugs((program as { categories?: unknown }).categories),
    progress: program.isNewHits ? "38%" : undefined,
    inWatchlist: Boolean(program.is_Feature || program.is_NEW),
    featured: Boolean(program.is_Feature),
    heroImage: getProgramBackdropImage(program),
    heroTitleLines: heroTitleLines.length > 0 ? heroTitleLines : undefined,
    homeYear: getProgramHomeYear(program),
    isGlobalProgram: Boolean(program.is_global_programs),
    isNew: Boolean(program.is_NEW),
    posterImage: getProgramPosterImage(program),
    seasons: getProgramSeasons(program),
    source: "program",
    tone: tones[Math.abs(hashString(program.slug)) % tones.length],
    trailerMimeType: videoMimeType(program.trailer),
    trailerUrl: getProgramTrailerUrl(program),
    typeSlugs: relationSlugs((program as { categories?: unknown }).categories),
  };
}

function getTitleType(program: Program): Title["type"] {
  if (program.is_Feature || program.is_IP || program.is_global_programs) {
    return "Original";
  }

  return program.programContentType === "Movie" ? "Movie" : "Series";
}

function getProgramBackdropImage(program: Program) {
  return mediaUrl(program.image) || thumbnailPath(program.videoThumbnailAirflowProxyPath) || mediaUrl(program.coverImage);
}

function getProgramPosterImage(program: Program) {
  return mediaUrl(program.coverImage) || mediaUrl(program.image) || thumbnailPath(program.videoThumbnailAirflowProxyPath);
}

function getProgramTrailerUrl(program: Program) {
  return videoUrl(program.trailer) || cleanUrl(program.trailerLink) || thumbnailPath(program.TrailerAirflowProxyPath);
}

function getProgramHomeYear(program: Program) {
  return (
    validYear(program.productionYear) ||
    dateYearNumber(program.comingSoonDate) ||
    dateYearNumber(program.firstRun) ||
    firstRerunYear(program.rerunDates) ||
    dateYearNumber(program.createdAt)
  );
}

function validYear(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
}

function firstRerunYear(rerunDates: Program["rerunDates"]) {
  if (!Array.isArray(rerunDates)) {
    return undefined;
  }

  for (const item of rerunDates) {
    const year = dateYearNumber(item?.date);

    if (year) {
      return year;
    }
  }

  return undefined;
}

function getProgramSeasons(program: Program): Title["seasons"] {
  const seasons = Array.isArray(program.seasons)
    ? program.seasons.filter((season): season is Season => typeof season === "object" && season !== null)
    : [];

  return seasons
    .map(seasonToTitleSeason)
    .sort((a, b) => (a.seasonNumber ?? 9999) - (b.seasonNumber ?? 9999));
}

function seasonToTitleSeason(season: Season): NonNullable<Title["seasons"]>[number] {
  const seasonNumber = typeof season.season === "number" ? season.season : undefined;
  const fallbackTitle = seasonNumber ? `Season ${seasonNumber}` : "Season";
  const episodes = Array.isArray(season.episodes)
    ? season.episodes.filter((episode): episode is Episode => typeof episode === "object" && episode !== null)
    : [];

  return {
    id: String(season.id),
    description: cleanText(season.synopsisTh) || cleanText(season.synopsisEn) || undefined,
    episodes: episodes.map(episodeToTitleEpisode).sort((a, b) => (a.episodeNumber ?? 9999) - (b.episodeNumber ?? 9999)),
    image: mediaUrl(season.coverImage) || thumbnailPath(season.videoThumbnailAirflowProxyPath),
    seasonNumber,
    title: cleanText(season.seasonName) || cleanText(season.seasonNameEn) || fallbackTitle,
  };
}

function episodeToTitleEpisode(episode: Episode): NonNullable<Title["seasons"]>[number]["episodes"][number] {
  const episodeNumber = typeof episode.ep === "number" ? episode.ep : undefined;
  const fallbackTitle = episodeNumber ? `Episode ${episodeNumber}` : "Episode";

  return {
    id: String(episode.id),
    description:
      cleanText(episode.synopsisEpTh) ||
      cleanText(episode.synopsisEpEn) ||
      "Episode details will be available soon.",
    duration: "Episode",
    episodeNumber,
    image: mediaUrl(episode.coverImage) || thumbnailPath(episode.videoThumbnailAirflowProxyPath),
    releaseDate: dateLabel(episode.firstRun),
    title: cleanText(episode.epNameTh) || cleanText(episode.epNameEn) || fallbackTitle,
  };
}

function mediaUrl(
  media:
    | Program["coverImage"]
    | Season["coverImage"]
    | Episode["coverImage"]
    | Category["image"]
    | Landing["heroImage"]
    | HeroImage["image"],
) {
  if (!media || typeof media === "number") {
    return undefined;
  }

  return (media as Media).url || undefined;
}

function categoryToTile(category: Category): CategoryTile | null {
  const name = cleanText(category.name);
  const slug = cleanText(category.slug);

  if (!name || !slug) {
    return null;
  }

  return {
    id: category.id,
    imageUrl: mediaUrl(category.image),
    name,
    slug,
    videoMimeType: videoMimeType(category.video),
    videoUrl: videoUrl(category.video),
  };
}

function typeToTile(type: TypeDoc): TypeTile | null {
  const name = cleanText(type.name);
  const slug = cleanText(type.slug);

  if (!name || !slug) {
    return null;
  }

  return {
    id: type.id,
    icon: cleanText(type.icon) || undefined,
    imageUrl: mediaUrl(type.image),
    link: cleanUrl(type.link),
    name,
    slug,
    videoMimeType: videoMimeType(type.video),
    videoUrl: videoUrl(type.video),
  };
}

function videoUrl(video: unknown) {
  if (!video || typeof video === "number") {
    return undefined;
  }

  return (video as Video).url || undefined;
}

function videoMimeType(video: unknown) {
  if (!video || typeof video === "number") {
    return undefined;
  }

  return (video as Video).mimeType || undefined;
}

function thumbnailPath(path?: string | null) {
  const cleanPath = cleanText(path);

  if (!cleanPath) {
    return undefined;
  }

  return cleanPath.startsWith("http") || cleanPath.startsWith("/") ? cleanPath : undefined;
}

function formatDuration(duration: number | null | undefined, type: Title["type"]) {
  if (!duration) {
    return type === "Series" ? "Series" : "Movie";
  }

  const minutesTotal = Math.max(0, Math.floor(duration));

  if (minutesTotal < 60) {
    return `${minutesTotal}m`;
  }

  const hours = Math.floor(minutesTotal / 60);
  const minutes = minutesTotal % 60;

  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

function getRating(program: Program) {
  if (typeof program.targetGroup === "number" && Number.isFinite(program.targetGroup) && program.targetGroup > 0) {
    return `${Math.floor(program.targetGroup)}+`;
  }

  return "ALL Age";
}

function dateYear(date?: string | null) {
  if (!date) {
    return undefined;
  }

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed.getFullYear().toString();
}

function dateYearNumber(date?: string | null) {
  if (!date) {
    return undefined;
  }

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed.getFullYear();
}

function dateLabel(date?: string | null) {
  if (!date) {
    return undefined;
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueTextLines(values: string[]) {
  return values.filter((value, index, lines) => Boolean(value) && lines.indexOf(value) === index);
}

function normalizeSlugLookupKey(value: string) {
  try {
    return decodeURIComponent(value).trim().replace(/\s+/g, " ");
  } catch {
    return value.trim().replace(/\s+/g, " ");
  }
}

function cleanUrl(value: unknown) {
  const url = cleanText(value);

  if (!url) {
    return undefined;
  }

  return url.startsWith("/") || /^https?:\/\//i.test(url) ? url : undefined;
}

function relationNames(value: unknown): string[] {
  const items = Array.isArray(value) ? value : value == null ? [] : [value];

  return items
    .map((item) => {
      if (!item || typeof item !== "object") {
        return "";
      }

      const record = item as { name?: unknown; slug?: unknown; title?: unknown };
      return cleanText(record.name) || cleanText(record.title) || cleanText(record.slug);
    })
    .filter(Boolean);
}

function relationSlugs(value: unknown): string[] {
  const items = Array.isArray(value) ? value : value == null ? [] : [value];

  return items
    .map((item) => {
      if (!item || typeof item !== "object") {
        return "";
      }

      return cleanText((item as { slug?: unknown }).slug);
    })
    .filter(Boolean);
}

function hashString(value: string) {
  return [...value].reduce((hash, char) => hash + char.charCodeAt(0), 0);
}
