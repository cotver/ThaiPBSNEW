import Image from "next/image";
import Link from "next/link";
import { lotProgramHref, slateNumber, type LotLinkItem, type LotProgram, type LotRoom } from "@/lib/studio/data";
import styles from "@/components/studio/studio-lot.module.css";
import { BrandTiles } from "@/components/home/BrandTiles";
import { StudiosCatalog } from "@/components/StudiosCatalog";
import { StudiosCategoryAccordion } from "@/components/StudiosCategoryAccordion";
import showcaseStyles from "@/components/StudiosShowcase.module.css";
import { FeaturedContent, StoryScreenContent, type HallScreen } from "./FeaturedContent";

/** Section content shared by the 3D panels and the 2D call sheet. */

export function ProgramMeta({ program }: { program: LotProgram }) {
  const parts = [program.type, program.genre, program.year, program.seasons > 1 ? `${program.seasons} seasons` : program.episodes ? `${program.episodes} ep` : program.duration].filter(Boolean);
  return <p className={styles.meta}>{parts.join(" · ")}</p>;
}

export function Artwork({ src, alt, sizes, priority, tone = 0 }: { src?: string; alt: string; sizes: string; priority?: boolean; tone?: number }) {
  if (!src) return <span aria-hidden="true" className={styles.artFallback} data-tone={tone % 4} />;
  return <Image alt={alt} className={styles.art} fill priority={priority} sizes={sizes} src={src} />;
}

/** Program card. Portrait = 2:3 poster (vertical rows); landscape = 16:9 hero art (poster and wide rows), as on /home. */
export function SlateCard({ program, index = 0, orientation = "portrait", sizes = "(max-width: 700px) 45vw, 180px" }: { program: LotProgram; index?: number; orientation?: "portrait" | "landscape"; sizes?: string }) {
  const image = orientation === "portrait" ? program.poster || program.hero : program.hero || program.poster;
  return (
    <Link prefetch={false} className={styles.slateCard} data-cursor="Screen it" data-orientation={orientation} href={lotProgramHref(program.slug)}>
      <span className={styles.slatePoster}>
        <Artwork alt="" sizes={sizes} src={image} tone={index} />
        {program.isNew ? <span className={styles.newTag}>New</span> : null}
      </span>
      <span className={styles.slateBar}>
        <span>Sc {slateNumber(program.slug)}</span>
        <span>{program.type}</span>
        <span>{program.year}</span>
      </span>
      <span className={styles.slateTitle}>{program.title}</span>
    </Link>
  );
}

/** Category tiles, Studios stories, market events and partner companies — each linking where /home links. */
/**
 * Linked content in the same shapes /home uses: BrandTiles (16:9, dense), Studios catalog (16:9),
 * StudiosHero (one lead plus the rest), press cards (square image + copy), partner cards (black 16:9)
 * and Market & Events (square cover, centred name).
 */
export function LinksContent({ items, shape = "landscape", viewAllHref }: { items: LotLinkItem[]; shape?: NonNullable<LotRoom["itemShape"]>; viewAllHref?: string }) {
  return (
    <div className={styles.shortlist}>
      <ul className={styles.tileGrid} data-shape={shape}>
        {items.map((item, index) => (
          <li key={item.id}>
            <Link prefetch={false} className={styles.tile} data-cursor={`Open ${item.title}`} href={item.href}>
              <span className={styles.tileArt} data-logo={shape === "logo" || undefined}>
                {shape === "logo" ? <PartnerLogo item={item} /> : <Artwork alt="" sizes={shape === "hero" && index === 0 ? "(max-width: 900px) 100vw, 560px" : "(max-width: 700px) 45vw, 220px"} src={item.image} tone={index} />}
              </span>
              <span className={styles.tileCopy}>
                {shape === "press" && item.meta ? <span className={styles.tileMeta}>{item.meta}</span> : null}
                <span className={styles.tileName}>{item.title}</span>
                {shape !== "press" && shape !== "square" && item.meta ? <span className={styles.tileMeta}>{item.meta}</span> : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {viewAllHref ? (
        <Link prefetch={false} className={styles.primaryButton} href={viewAllHref}>
          View all
        </Link>
      ) : null}
    </div>
  );
}

/** Content Distribution card contents, rendered exactly as the /home showcase does. */
function PartnerLogo({ item }: { item: LotLinkItem }) {
  const logo = item.logo;
  if (!logo) return <span className={styles.logoName}>{item.title}</span>;
  return (
    <span className={styles.logoFrame} style={{ width: `${logo.frame.width * 100}%`, height: `${logo.frame.height * 100}%` }}>
      {logo.kind === "image" ? (
        <Image alt={logo.alt} className="object-contain" fill sizes="220px" src={logo.src} unoptimized />
      ) : (
        <span aria-label={`${item.title} logo`} className={`flex h-full w-full items-center justify-center overflow-hidden text-center ${logo.className}`} role="img">
          {logo.label}
        </span>
      )}
    </span>
  );
}

export function RowContent({ programs, viewAllHref, layout = "vertical" }: { programs: LotProgram[]; viewAllHref?: string; layout?: LotRoom["layout"] }) {
  const orientation = layout === "vertical" ? "portrait" : "landscape";
  return (
    <div className={styles.shortlist}>
      <div className={styles.shelfRow} data-layout={layout}>
        {programs.map((program, index) => (
          <SlateCard index={index} key={program.slug} orientation={orientation} program={program} sizes={orientation === "portrait" ? "(max-width: 700px) 33vw, 160px" : "(max-width: 700px) 50vw, 260px"} />
        ))}
      </div>
      {viewAllHref ? (
        <Link prefetch={false} className={styles.primaryButton} href={viewAllHref}>
          View all
        </Link>
      ) : null}
    </div>
  );
}

/** The Studios Categories room, shown as /home shows it: the Studios catalog, then "More Studios categories". */
function StudiosCategoriesContent({ studios }: { studios: NonNullable<LotRoom["studios"]> }) {
  return (
    <div className={`${showcaseStyles.showcase} ${styles.studiosCategories}`}>
      {studios.categories.length ? (
        <div className={showcaseStyles.catalog}>
          <StudiosCatalog categories={studios.categories} showArticleSections={false} />
        </div>
      ) : null}
      {studios.otherCategories.length ? (
        <section aria-label="More Studios categories" className={showcaseStyles.otherCategories}>
          <StudiosCategoryAccordion categories={studios.otherCategories} />
        </section>
      ) : null}
    </div>
  );
}

/** Picks the right content for a room, so the 3D panel and the 2D guide always match. */
export function RoomContent({ room, screen }: { room: LotRoom; screen?: HallScreen }) {
  if (room.studios) return <StudiosCategoriesContent studios={room.studios} />;
  // Categories: /home's own BrandTiles, so hovering a tile lifts it and plays its video as on /home.
  if (room.brandTiles) return <div className={styles.brandTiles}><BrandTiles categories={room.brandTiles} /></div>;
  if (room.kind === "featured") return <FeaturedContent programs={room.programs} screen={screen} />;
  if (room.kind === "links" && room.itemShape === "hero") return <StoryScreenContent items={room.items} screen={screen} viewAllHref={room.viewAllHref} />;
  if (room.kind === "links") return <LinksContent items={room.items} shape={room.itemShape} viewAllHref={room.viewAllHref} />;
  return <RowContent layout={room.layout} programs={room.programs} viewAllHref={room.viewAllHref} />;
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className={styles.empty}>{children}</p>;
}

export function LotFooter() {
  return (
    <footer className={styles.footer}>
      <span>Thai PBS · Studio Lot prototype</span>
      <span>That’s a wrap.</span>
    </footer>
  );
}
