import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArticlePdfPagesLoader } from "@/components/final-prototype/ArticlePdfPagesLoader";
import { FinalArticleRichText } from "@/components/final-prototype/FinalArticleRichText";
import { getColumnArticleBySlug, getGlobalRelatedStories, getRelatedColumnArticles } from "@/lib/column-articles";
import { columnArticleHref } from "@/lib/content";
import type { ColumnArticleDetail } from "@/lib/column-articles";
import styles from "./ColumnArticlePage.module.css";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function RelatedStoriesSkeleton() {
  return (
    <aside aria-label="Story recommendations loading" aria-busy="true" className={styles.relatedRail}>
      <span className={styles.skeletonSrOnly}>Loading related stories…</span>
      <div aria-hidden="true" className={styles.relatedSkeleton}>
        <span className={styles.skeletonHeading} />
        <div className={styles.skeletonList}>
          {Array.from({ length: 4 }, (_, index) => (
            <div className={styles.skeletonCard} key={index}>
              <span className={styles.skeletonImage} />
              <span className={styles.skeletonCopy}>
                <span />
                <span />
                <span />
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

async function RelatedStoriesRail({ article }: { article: ColumnArticleDetail }) {
  const globalStories = await getGlobalRelatedStories();
  const pinnedStories = [...globalStories, ...article.relatedStories].filter((story, index, all) =>
    story.id !== article.id && all.findIndex((candidate) => candidate.href === story.href) === index
  );
  const related = await getRelatedColumnArticles(article, 10, pinnedStories.flatMap((story) => story.id ? [story.id] : []));
  const recommendations = [
    ...pinnedStories,
    ...related.items.map((item) => ({
      id: item.id,
      href: columnArticleHref(item.slug),
      title: item.title,
      heroUrl: item.heroUrl,
      date: item.date,
    })),
  ];

  return (
    <aside aria-label="Story recommendations" className={styles.relatedRail}>
      <h2>{pinnedStories.length || related.hasMatches ? "Related Stories" : "More Stories"}</h2>
      {recommendations.length ? (
        <div className={styles.relatedList}>
          {recommendations.map((item) => (
            <Link className={styles.relatedCard} href={item.href} key={item.href}>
              <span className={styles.relatedImage}>
                {item.heroUrl ? <Image alt="" fill sizes="(max-width: 560px) 110px, 120px" src={item.heroUrl} /> : null}
              </span>
              <span className={styles.relatedCopy}>
                <strong>{item.title}</strong>
                {item.date ? <time dateTime={item.date}>{formatDate(item.date)}</time> : null}
              </span>
            </Link>
          ))}
        </div>
      ) : <p className={styles.relatedEmpty}>More stories are coming soon.</p>}
    </aside>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getColumnArticleBySlug(slug);
  if (!article) return { title: "Article not found" };

  return {
    title: `${article.title} | Thai PBS Studios`,
    description: article.description,
    openGraph: {
      description: article.description,
      images: article.heroUrl ? [{ alt: article.heroAlt, url: article.heroUrl }] : undefined,
      title: article.title,
      type: "article",
    },
  };
}

export default async function ColumnArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getColumnArticleBySlug(slug);
  if (!article) notFound();

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        {article.heroUrl ? (
          <Image
            alt={article.heroAlt}
            className={styles.heroImage}
            fill
            priority
            sizes="100vw"
            src={article.heroUrl}
          />
        ) : null}
        <div className={styles.heroShade} />
        <div className={styles.heroContent}>
          <Link className={styles.backLink} href="/home#catalog"><span aria-hidden>←</span> Studios</Link>
          {article.categories.length ? <p className={styles.eyebrow}>{article.categories.map((item) => item.name).join("  /  ")}</p> : null}
          <h1>{article.title}</h1>
          {article.description ? <p className={styles.lede}>{article.description}</p> : null}
        </div>
      </header>

      <div className={styles.articleShell}>
        <aside className={styles.meta} aria-label="Article information">
          <div><span>Published</span><time dateTime={article.date}>{formatDate(article.date)}</time></div>
          {article.author ? <div><span>Words by</span><strong>{article.author}</strong></div> : null}
          {article.categories.length ? <div><span>Category</span><p>{article.categories.map((item) => item.name).join(" · ")}</p></div> : null}
          {article.tags.length ? <div><span>Tags</span><p>{article.tags.join(" · ")}</p></div> : null}
        </aside>

        <article className={styles.body}>
          {article.pdfUrl ? (
            <ArticlePdfPagesLoader
              file={article.pdfUrl}
              title={article.pdfFilename || "Article PDF"}
            />
          ) : null}
          {article.video ? (
            <figure className={styles.video}>
              <video aria-label={article.video.alt} controls playsInline poster={article.heroUrl} preload="metadata">
                <source src={article.video.url} type={article.video.mimeType} />
              </video>
            </figure>
          ) : null}
          {!article.pdfUrl ? <FinalArticleRichText content={article.content} /> : null}
        </article>

        <Suspense fallback={<RelatedStoriesSkeleton />}>
          <RelatedStoriesRail article={article} />
        </Suspense>
      </div>
    </main>
  );
}
