import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentRow } from "@/components/ContentRow";
import { buildTitleCollections, getCategoryPage, type PostRoomGroupTile } from "@/lib/payload-content";
import { parseSavedTitlesCookie, savedTitlesCookieName } from "@/lib/saved-titles";
import { parseWatchHistoryCookie, watchHistoryCookieName } from "@/lib/watch-history";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ postRoomGroup?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const cookieStore = await cookies();
  const continueWatchingSlugs = parseWatchHistoryCookie(cookieStore.get(watchHistoryCookieName)?.value);
  const savedTitleSlugs = parseSavedTitlesCookie(cookieStore.get(savedTitlesCookieName)?.value);
  const categoryPage = await getCategoryPage(slug);

  if (!categoryPage) {
    notFound();
  }
 
  const { category, titles } = categoryPage;
  const availableTitles = titles.filter((title) => !title.isDiscontinued);
  const collections = buildTitleCollections(titles, continueWatchingSlugs, savedTitleSlugs);
  const showHeaderSection = category.showHeaderSection !== false;
  const showTitle = category.showTitle !== false;
  const postRoomGroups = category.postRoomGroups ?? [];
  const selectedPostRoomGroup = query?.postRoomGroup
    ? postRoomGroups.find((group) => group.id === query.postRoomGroup)
    : undefined;
  const countLabel = category.postRoom
    ? selectedPostRoomGroup
      ? `${selectedPostRoomGroup.images.length} image${selectedPostRoomGroup.images.length === 1 ? "" : "s"}`
      : `${postRoomGroups.length} group${postRoomGroups.length === 1 ? "" : "s"}`
    : `${availableTitles.length} title${availableTitles.length === 1 ? "" : "s"}`;
  const contentOffsetClass = showHeaderSection && !category.postRoom ? "-mt-20" : "pt-8";

  return (
    <>
      {showHeaderSection ? (
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
          {category.imageUrl && showTitle ? (
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#030714_0%,rgba(3,7,20,0.76)_32%,rgba(3,7,20,0.24)_68%,rgba(3,7,20,0.72)_100%)]" />
          ) : null}

          <div className="relative z-10 flex min-h-[480px] max-w-4xl flex-col justify-end lg:min-h-[560px]">
            {showTitle ? (
              <>
                <p className="mb-3 text-xs font-black uppercase text-cyan-200">Category</p>
                <h1 className="max-w-3xl text-5xl font-black leading-[0.98] sm:text-6xl lg:text-7xl">
                  {category.name}
                </h1>
              </>
            ) : null}
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">
              {countLabel}
            </div>
          </div>
        </section>
      ) : null}

      <section className={`${contentOffsetClass} space-y-9 px-5 pb-16 sm:px-8 lg:px-10`}>
        {!showHeaderSection ? (
          <div className="max-w-4xl">
            <p className="text-sm font-bold uppercase text-cyan-200">Category</p>
            <h1 className="mt-3 text-4xl font-black sm:text-6xl">{category.name}</h1>
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-white/48">{countLabel}</p>
          </div>
        ) : null}

        {category.postRoom ? (
          selectedPostRoomGroup ? (
            <PostRoomGallery categorySlug={category.slug} group={selectedPostRoomGroup} />
          ) : (
            <PostRoomGroupGrid categorySlug={category.slug} groups={postRoomGroups} />
          )
        ) : (
          <>
            {availableTitles.length > 0 ? (
              <ContentRow
                layout="vertical"
                title={`${category.name} Programs`}
                titles={availableTitles}
                viewAllHref={`/browse?category=${encodeURIComponent(category.slug)}&label=${encodeURIComponent(`${category.name} Programs`)}`}
              />
            ) : (
              <div className="rounded-[8px] border border-white/10 bg-white/6 p-8 text-white/70">
                No programs are connected to this category yet.
              </div>
            )}
            <ContentRow
              layout="poster"
              title="Recommended For You"
              titles={collections.recommended}
              viewAllHref={`/browse?section=recommended&category=${encodeURIComponent(category.slug)}&label=${encodeURIComponent(`${category.name} Recommended For You`)}`}
            />
            <ContentRow
              layout="wide"
              removable
              title="Continue Watching"
              titles={collections.continueWatching}
              viewAllHref={`/browse?section=continue-watching&category=${encodeURIComponent(category.slug)}&label=${encodeURIComponent(`${category.name} Continue Watching`)}`}
            />
            <ContentRow
              layout="vertical"
              title="Continue Programs"
              titles={collections.continuePrograms}
              viewAllHref={`/browse?section=continue-programs&category=${encodeURIComponent(category.slug)}&label=${encodeURIComponent(`${category.name} Continue Programs`)}`}
            />
            <ContentRow
              layout="vertical"
              title="Discontinued Programs"
              titles={collections.discontinuedPrograms}
              viewAllHref={`/browse?section=discontinued-programs&category=${encodeURIComponent(category.slug)}&label=${encodeURIComponent(`${category.name} Discontinued Programs`)}`}
            />
            {collections.yearRows.map((row) => (
              <ContentRow
                key={row.year}
                layout="vertical"
                title={`ThaiPBS Year ${row.year}`}
                titles={row.titles}
                viewAllHref={`/browse?section=year&year=${encodeURIComponent(String(row.year))}&category=${encodeURIComponent(category.slug)}&label=${encodeURIComponent(`${category.name} ThaiPBS Year ${row.year}`)}`}
              />
            ))}
            <ContentRow
              layout="vertical"
              title="Thai Programs"
              titles={collections.thaiPrograms}
              viewAllHref={`/browse?section=thai&category=${encodeURIComponent(category.slug)}&label=${encodeURIComponent(`${category.name} Thai Programs`)}`}
            />
            <ContentRow
              layout="vertical"
              title="International Programs"
              titles={collections.internationalPrograms}
              viewAllHref={`/browse?section=international&category=${encodeURIComponent(category.slug)}&label=${encodeURIComponent(`${category.name} International Programs`)}`}
            />
          </>
        )}
      </section>
    </>
  );
}

function PostRoomGroupGrid({
  categorySlug,
  groups,
}: {
  categorySlug: string;
  groups: PostRoomGroupTile[];
}) {
  if (groups.length === 0) {
    return (
      <div className="rounded-[8px] border border-white/10 bg-white/6 p-8 text-white/70">
        No Post Room groups have been added yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black md:text-xl">Post Room</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <Link
            className="group block overflow-hidden rounded-[8px] border border-white/10 bg-white/6 shadow-xl shadow-black/20 outline-none transition hover:border-white/35 focus-visible:ring-2 focus-visible:ring-cyan-200"
            href={`/category/${encodeURIComponent(categorySlug)}?postRoomGroup=${encodeURIComponent(group.id)}`}
            key={group.id}
          >
            <div className="relative aspect-[4/3] bg-white/6">
              {group.coverImage?.imageUrl ? (
                <Image
                  alt=""
                  className="object-cover transition duration-300 group-hover:scale-105"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  src={group.coverImage.imageUrl}
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-[#030714]/86 via-[#030714]/16 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h3 className="line-clamp-2 text-lg font-black">{group.title}</h3>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/56">
                  {group.images.length} image{group.images.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function PostRoomGallery({
  categorySlug,
  group,
}: {
  categorySlug: string;
  group: PostRoomGroupTile;
}) {
  const images = group.images;

  if (images.length === 0) {
    return (
      <div className="rounded-[8px] border border-white/10 bg-white/6 p-8 text-white/70">
        No Post Room images have been added yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Post Room</p>
          <h2 className="mt-1 text-lg font-black md:text-xl">{group.title}</h2>
        </div>
        <Link
          className="text-xs font-black uppercase text-white/58 transition hover:text-white"
          href={`/category/${encodeURIComponent(categorySlug)}`}
        >
          Back to groups
        </Link>
      </div>
      <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
        {images.map((item, index) => {
          const imageWidth = item.imageWidth ?? 1200;
          const imageHeight = item.imageHeight ?? 900;

          return (
            <article
              className="mb-4 break-inside-avoid overflow-hidden rounded-[8px] border border-white/10 bg-white/6 shadow-xl shadow-black/20"
              key={item.id || `${item.imageUrl}-${index}`}
            >
              {item.imageUrl ? (
                <Image
                  alt=""
                  className="h-auto w-full object-cover"
                  height={imageHeight}
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  src={item.imageUrl}
                  width={imageWidth}
                />
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
