import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { getCatalogCollections } from "@/lib/payload-content";
import { parseSavedTitlesCookie, savedTitlesCookieName } from "@/lib/saved-titles";
import { parseWatchHistoryCookie, watchHistoryCookieName } from "@/lib/watch-history";
import { EmptyNote, LotFooter } from "../_components/LotSections";
import { PreviewSlate } from "../_components/PreviewSlate";
import { ShortlistButton } from "../_components/ShortlistButton";
import { lotBase, readablePrograms, toLotProgram } from "../_lib/data";
import pages from "../pages.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shortlist" };

export default async function LotShortlistPage() {
  const cookieStore = await cookies();
  const history = parseWatchHistoryCookie(cookieStore.get(watchHistoryCookieName)?.value);
  const saved = parseSavedTitlesCookie(cookieStore.get(savedTitlesCookieName)?.value);
  const collections = await getCatalogCollections(history, saved);
  const shortlist = readablePrograms(collections.watchlist).map(toLotProgram);
  const recent = readablePrograms(collections.continueWatching).slice(0, 6).map(toLotProgram);

  return (
    <main className={pages.page}>
      <header className={pages.pageHero}>
        <p className={pages.kicker}>รายการที่บันทึกไว้</p>
        <h1 className={pages.pageTitle}>
          Your <em>Shortlist</em>
        </h1>
        <p className={pages.lede}>Programs you have marked while walking the gallery. Bring this list to a screening or a market meeting.</p>
        {shortlist.length ? (
          <dl className={pages.heroStats}>
            <div>
              <dt>Saved</dt>
              <dd>{shortlist.length}</dd>
            </div>
            <div>
              <dt>Episodes</dt>
              <dd>{shortlist.reduce((total, program) => total + program.episodes, 0) || "—"}</dd>
            </div>
          </dl>
        ) : null}
      </header>

      {shortlist.length ? (
        <div className={pages.grid}>
          {shortlist.map((program, index) => (
            <div className={pages.shortlistItem} key={program.slug}>
              <PreviewSlate index={index} program={program} />
              <ShortlistButton initiallySaved slug={program.slug} title={program.title} variant="remove" />
            </div>
          ))}
        </div>
      ) : (
        <div className={pages.narrow}>
          <EmptyNote>Your shortlist is empty. Open any program and choose “Add to shortlist” to keep it here.</EmptyNote>
          <Link className={pages.ghostAction} href={`${lotBase}/programs`}>
            Browse the Archive Vault
          </Link>
        </div>
      )}

      {recent.length ? (
        <section className={pages.related}>
          <header className={pages.sectionHeader}>
            <p className={pages.kicker}>History</p>
            <h2>Recently screened</h2>
          </header>
          <div className={pages.relatedRow}>
            {recent.map((program, index) => (
              <PreviewSlate index={index} key={program.slug} program={program} />
            ))}
          </div>
        </section>
      ) : null}
      <LotFooter />
    </main>
  );
}
