import Image from "next/image";
import Link from "next/link";
import { finalArticleHref } from "@/lib/content";
import type { FinalArticleCard } from "@/lib/payload-articles";

export function FinalArticlesSection({ articles }: { articles: FinalArticleCard[] }) {
  if (!articles.length) return null;

  return (
    <section className="final-articles" aria-label="Latest Articles">
      <header>
        <div>
          <p>Stories from Thai PBS programmes</p>
          <h2>Latest Articles</h2>
        </div>
        <span>{String(articles.length).padStart(2, "0")} stories</span>
      </header>
      <div className="final-articles__grid">
        {articles.map((article, index) => (
          <article className="final-articles__card" key={article.slug}>
            <Link href={finalArticleHref(article.slug)}>
              <div className="final-articles__image">
                {article.imageUrl ? (
                  <Image alt={article.imageAlt} fill priority={index < 2} sizes="(max-width: 640px) 100vw, (max-width: 1023px) 50vw, 25vw" src={article.imageUrl} />
                ) : (
                  <span aria-hidden="true">{article.programTitle.slice(0, 1)}</span>
                )}
                <b>{article.categoryNames[0] || article.targetLabel}</b>
              </div>
              <div className="final-articles__copy">
                <small>{article.programTitle} · {formatArticleDate(article.publishedDate)}</small>
                <h3><span>{article.title}</span></h3>
                {article.excerpt ? <p>{article.excerpt}</p> : null}
                <strong>Read the full article <span aria-hidden="true">→</span></strong>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatArticleDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Latest";
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
