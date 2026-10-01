import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getFinalArticles } from "@/lib/payload-articles";
import { EmptyNote, LotFooter } from "../_components/LotSections";
import { StoryList } from "../_components/StoryList";
import { formatLotDate, lotArticleHref } from "../_lib/data";
import pages from "../pages.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Newsroom" };

export default async function LotNewsPage() {
  const articles = await getFinalArticles();
  const [lead, ...rest] = articles;

  return (
    <main className={pages.page}>
      <header className={pages.pageHero}>
        <p className={pages.kicker}>ห้องข่าว</p>
        <h1 className={pages.pageTitle}>
          The <em>Newsroom</em>
        </h1>
        <p className={pages.lede}>Notes from set, interviews with the people behind the programs, and dispatches from the market floor.</p>
      </header>

      {lead ? (
        <Link className={pages.leadStory} data-cursor="Read story" href={lotArticleHref(lead.slug)}>
          <span className={pages.leadArt}>{lead.imageUrl ? <Image alt={lead.imageAlt || ""} className={pages.cover} fill priority sizes="(max-width: 900px) 100vw, 60vw" src={lead.imageUrl} /> : null}</span>
          <span className={pages.leadCopy}>
            <span className={pages.kicker}>
              {formatLotDate(lead.publishedDate)} · {lead.categoryNames[0] ?? lead.targetLabel}
            </span>
            <span className={pages.leadTitle}>{lead.title}</span>
            <span className={pages.leadExcerpt}>{lead.excerpt}</span>
            <span className={pages.readLink}>Read the story →</span>
          </span>
        </Link>
      ) : (
        <div className={pages.narrow}>
          <EmptyNote>No stories have been filed yet.</EmptyNote>
        </div>
      )}

      {rest.length ? <StoryList articles={rest} /> : null}
      <LotFooter />
    </main>
  );
}
