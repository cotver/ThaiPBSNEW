import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FinalArticleRichText } from "@/components/final-prototype/FinalArticleRichText";
import { getFinalArticle, getRelatedFinalArticles } from "@/lib/payload-articles";
import { LotFooter } from "../../_components/LotSections";
import { StoryList } from "../../_components/StoryList";
import { formatLotDate, lotBase, lotProgramHref } from "../../_lib/data";
import pages from "../../pages.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getFinalArticle(slug);
  return article ? { title: article.seoTitle || article.title, description: article.seoDescription || article.excerpt } : {};
}

export default async function LotArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getFinalArticle(slug);
  if (!article) notFound();
  const related = await getRelatedFinalArticles(article, 3);
  // Program links come back as main-site /title/<slug> hrefs; keep readers inside the lot.
  const programSlug = article.programHref?.startsWith("/title/") ? decodeURIComponent(article.programHref.slice("/title/".length)) : undefined;

  return (
    <main className={pages.page}>
      <article>
        <header className={pages.articleHeader}>
          <nav aria-label="Breadcrumb" className={pages.breadcrumb}>
            <Link href={lotBase}>Gallery</Link>
            <span aria-hidden="true">/</span>
            <Link href={`${lotBase}/news`}>Newsroom</Link>
          </nav>
          <p className={pages.kicker}>
            {article.categoryNames[0] ?? "Story"}
            {formatLotDate(article.publishedDate) ? ` · ${formatLotDate(article.publishedDate)}` : ""}
          </p>
          <h1 className={pages.articleTitle}>{article.title}</h1>
          {article.description ? <p className={pages.articleDeck}>{article.description}</p> : null}
          <p className={pages.byline}>
            <span>{article.author || "Thai PBS editorial"}</span>
            {programSlug ? (
              <Link data-cursor="Screen the program" href={lotProgramHref(programSlug)}>
                On {article.programTitle} →
              </Link>
            ) : null}
          </p>
        </header>
        {article.imageUrl ? (
          <figure className={pages.articleFigure}>
            <span className={pages.articleArt}>
              <Image alt={article.imageAlt || ""} className={pages.cover} fill priority sizes="(max-width: 1200px) 100vw, 1200px" src={article.imageUrl} />
            </span>
            {article.imageAlt ? <figcaption>{article.imageAlt}</figcaption> : null}
          </figure>
        ) : null}
        <div className={pages.articleBody}>
          <FinalArticleRichText content={article.content} />
          {article.tags.length ? (
            <ul className={pages.tagList}>
              {article.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </article>

      {related.length ? (
        <section className={pages.related}>
          <header className={pages.sectionHeader}>
            <p className={pages.kicker}>From the same desk</p>
            <h2>Keep reading</h2>
          </header>
          <StoryList articles={related} />
        </section>
      ) : null}
      <LotFooter />
    </main>
  );
}
