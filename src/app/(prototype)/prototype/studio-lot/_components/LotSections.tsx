import Image from "next/image";
import Link from "next/link";
import { lotProgramHref, slateNumber, type LotLinkItem, type LotProgram, type LotRoom } from "../_lib/data";
import styles from "../studio-lot.module.css";

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
    <Link className={styles.slateCard} data-cursor="Screen it" data-orientation={orientation} href={lotProgramHref(program.slug)}>
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

export function PremiereContent({ programs }: { programs: LotProgram[] }) {
  const [lead, ...rest] = programs;
  if (!lead) return <EmptyNote>No premieres scheduled tonight.</EmptyNote>;
  return (
    <div className={styles.premiere}>
      <Link className={styles.premiereLead} data-cursor="Enter the screening room" href={lotProgramHref(lead.slug)}>
        <span className={styles.premiereArt}>
          <Artwork alt="" priority sizes="(max-width: 900px) 100vw, 520px" src={lead.hero} />
          <span className={styles.premiereBadge}>
            <span className={styles.recDot} /> Now screening
          </span>
        </span>
        <span className={styles.premiereCopy}>
          <ProgramMeta program={lead} />
          <span className={styles.premiereTitle}>{lead.title}</span>
          <span className={styles.premiereText}>{lead.description}</span>
          <span className={styles.textLink}>{lead.trailerUrl ? "Screen the trailer" : "Open the program"} →</span>
        </span>
      </Link>
      {rest.length ? (
        <ol className={styles.runningOrder}>
          {rest.slice(0, 5).map((program, index) => (
            <li key={program.slug}>
              <Link data-cursor="Screen it" href={lotProgramHref(program.slug)}>
                <span className={styles.orderThumb}>
                  <Artwork alt="" sizes="96px" src={program.hero} tone={index} />
                </span>
                <span className={styles.orderCopy}>
                  <strong>{program.title}</strong>
                  <ProgramMeta program={program} />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
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
            <Link className={styles.tile} data-cursor={`Open ${item.title}`} href={item.href}>
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
        <Link className={styles.primaryButton} href={viewAllHref}>
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
        <Link className={styles.primaryButton} href={viewAllHref}>
          View all
        </Link>
      ) : null}
    </div>
  );
}

/** Picks the right content for a room, so the 3D panel and the 2D guide always match. */
export function RoomContent({ room }: { room: LotRoom }) {
  if (room.kind === "featured") return <PremiereContent programs={room.programs} />;
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
