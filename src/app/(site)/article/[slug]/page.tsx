import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FinalArticleRichText } from "@/components/final-prototype/FinalArticleRichText";
import { getColumnArticleBySlug } from "@/lib/column-articles";
import styles from "./ColumnArticlePage.module.css";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);
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
          {article.tags.length ? <div><span>Filed under</span><p>{article.tags.join(" · ")}</p></div> : null}
        </aside>

        <article className={styles.body}>
          {article.video ? (
            <figure className={styles.video}>
              <video aria-label={article.video.alt} controls playsInline poster={article.heroUrl} preload="metadata">
                <source src={article.video.url} type={article.video.mimeType} />
              </video>
            </figure>
          ) : null}
          <FinalArticleRichText content={article.content} />
        </article>
      </div>
    </main>
  );
}
