import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { titleInlineText, type TitleCredit } from "@/lib/content";
import { getCatalogTitle, getCatalogTitles } from "@/lib/payload-content";
import { parseSavedTitlesCookie, savedTitlesCookieName } from "@/lib/saved-titles";
import { LotFooter } from "@/components/studio/LotSections";
import { PreviewSlate } from "@/components/studio/PreviewSlate";
import { ScreeningRoom } from "@/components/studio/ScreeningRoom";
import { ShortlistButton } from "@/components/studio/ShortlistButton";
import { lotBase, lotGalleryHref, readablePrograms, slateNumber, toLotProgram } from "@/lib/studio/data";
import pages from "@/components/studio/pages.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = await getCatalogTitle(slug);
  return title ? { title: titleInlineText(title), description: title.description } : {};
}

function creditLine(list: TitleCredit[] | undefined, fallback: string | undefined) {
  return list?.length ? list.map((credit) => credit.name).join(", ") : fallback?.trim();
}

export default async function LotProgramPage({ params }: Props) {
  const { slug } = await params;
  const [title, catalog, cookieStore] = await Promise.all([getCatalogTitle(slug), getCatalogTitles(), cookies()]);
  if (!title || title.isDiscontinued) notFound();

  const saved = parseSavedTitlesCookie(cookieStore.get(savedTitlesCookieName)?.value).includes(title.slug);
  const program = toLotProgram(title);
  const related = readablePrograms(catalog)
    .filter((item) => item.slug !== title.slug)
    .map((item) => ({
      item,
      score: (item.genre === title.genre ? 2 : 0) + (item.type === title.type ? 1 : 0) + (item.typeSlugs ?? []).filter((value) => title.typeSlugs?.includes(value)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ item }) => toLotProgram(item));

  const credits = [
    ["Directed by", creditLine(title.directors, title.director)],
    ["Produced by", creditLine(title.producers, title.producer)],
    ["Written by", creditLine(title.writers, title.writer)],
    ["Starring", creditLine(title.artists, title.artist)],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  const specs = [
    ["Format", title.type],
    ["Genre", title.genre],
    ["Year", title.year],
    ["Runtime", title.duration],
    ["Rating", title.rating],
    ["Seasons", program.seasons ? String(program.seasons) : ""],
    ["Episodes", program.episodes ? String(program.episodes) : ""],
    ["Production", title.companyProduce ?? ""],
  ].filter(([, value]) => value?.trim());

  const seasons = (title.seasons ?? []).filter((season) => season.episodes.length);

  return (
    <main className={pages.page}>
      <nav aria-label="Breadcrumb" className={pages.breadcrumb}>
        <Link prefetch={false} href={lotGalleryHref}>Gallery</Link>
        <span aria-hidden="true">/</span>
        <Link prefetch={false} href={`${lotBase}/programs`}>Archive Vault</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Screening room</span>
      </nav>

      <ScreeningRoom poster={program.hero} title={program.title} trailerMimeType={program.trailerMimeType} trailerUrl={program.trailerUrl} />

      <section className={pages.programIntro}>
        <div className={pages.programHeading}>
          <p className={pages.kicker}>
            Scene {slateNumber(title.slug)} · {title.type} · {title.year}
          </p>
          <h1 className={pages.programTitle}>{program.title}</h1>
          {program.categories.length ? (
            <ul className={pages.tagList}>
              {program.categories.slice(0, 5).map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className={pages.programCopy}>
          <p className={pages.synopsis}>{title.description}</p>
          <div className={pages.actions}>
            <ShortlistButton initiallySaved={saved} slug={title.slug} title={program.title} />
            <Link prefetch={false} className={pages.ghostAction} data-cursor="Licensing & screeners" href="/studios/events">
              Licensing & market events
            </Link>
          </div>
        </div>
      </section>

      <section aria-label="Program specification" className={pages.specSheet}>
        <dl className={pages.specs}>
          {specs.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {credits.length ? (
          <dl className={pages.credits}>
            {credits.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </section>

      {seasons.length ? (
        <section className={pages.episodes}>
          <header className={pages.sectionHeader}>
            <p className={pages.kicker}>Running order</p>
            <h2>Episodes</h2>
          </header>
          {seasons.map((season, seasonIndex) => (
            <details className={pages.season} key={season.id} open={seasonIndex === 0}>
              <summary>
                <span>{season.title || `Season ${season.seasonNumber ?? seasonIndex + 1}`}</span>
                <small>{season.episodes.length} episodes</small>
              </summary>
              <ol>
                {season.episodes.slice(0, 30).map((episode, index) => (
                  <li key={episode.id}>
                    <span className={pages.episodeNumber}>{String(episode.episodeNumber ?? index + 1).padStart(2, "0")}</span>
                    <span className={pages.episodeTitle}>{episode.title}</span>
                    {episode.duration ? <span className={pages.episodeDuration}>{episode.duration}</span> : null}
                  </li>
                ))}
              </ol>
            </details>
          ))}
        </section>
      ) : null}

      {related.length ? (
        <section className={pages.related}>
          <header className={pages.sectionHeader}>
            <p className={pages.kicker}>Also in the collection</p>
            <h2>Screen next</h2>
          </header>
          <div className={pages.relatedRow}>
            {related.map((item, index) => (
              <PreviewSlate index={index} key={item.slug} program={item} />
            ))}
          </div>
        </section>
      ) : null}
      <LotFooter />
    </main>
  );
}
