import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FinalArticleRichText } from "@/components/final-prototype/FinalArticleRichText";
import { finalArticleHref } from "@/lib/content";
import { getFinalArticle, getRelatedFinalArticles, type FinalArticleCard, type FinalArticleDetail } from "@/lib/payload-articles";

export const dynamic = "force-dynamic";

type ArticlePageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getFinalArticle(slug);

  if (article) {
    const image = absoluteImageUrl(article.socialImageUrl || article.imageUrl);
    const canonical = absolutePageUrl(finalArticleHref(article.slug));
    return {
      title: `${article.seoTitle} | Thai PBS`,
      description: article.seoDescription || article.excerpt,
      alternates: canonical ? { canonical } : undefined,
      authors: article.author ? [{ name: article.author }] : undefined,
      openGraph: {
        title: article.seoTitle,
        description: article.seoDescription || article.excerpt,
        type: "article",
        publishedTime: article.publishedDate,
        authors: article.author ? [article.author] : undefined,
        url: canonical,
        images: image ? [{ url: image, alt: article.imageAlt }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: article.seoTitle,
        description: article.seoDescription || article.excerpt,
        images: image ? [image] : [],
      },
    };
  }

  return {};
}

export default async function FinalArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getFinalArticle(slug);

  if (article) {
    const related = await getRelatedFinalArticles(article);
    return <PublishedArticle article={article} related={related} />;
  }

  notFound();
}

function PublishedArticle({ article, related }: { article: FinalArticleDetail; related: FinalArticleCard[] }) {
  return (
    <main className="min-h-screen bg-[#030714] pb-20 text-white">
      <article>
        <header className="final-article-hero relative isolate overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[#07101f]">
            {article.imageUrl ? (
              <div className="final-hero-background__image-align">
                <div className="final-hero-background__image-inner">
                  <Image alt={article.imageAlt} fill priority sizes="100vw" src={article.imageUrl} />
                  <span className="final-hero-background__image-left-fade" />
                  <span className="final-hero-background__image-bottom-fade" />
                </div>
              </div>
            ) : (
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,#164e63_0%,#07101f_36%,#030714_76%)]" />
            )}
            <div className="final-hero-background__detail-shadow" />
            <div className="final-hero__background-shade" />
          </div>
          <div className="relative mx-auto flex h-full max-w-[80rem] items-end px-5 pb-14 pt-28 sm:px-10 sm:pb-20">
            <div className="max-w-4xl">
              <Link className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-white/65 transition hover:text-[#f87724]" href="/prototype/final">← Back to home</Link>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#f87724]">{article.programTitle} · {article.targetLabel}</p>
              <h1 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">{article.title}</h1>
              {article.excerpt ? <p className="mt-6 max-w-3xl text-base leading-8 text-white/75 sm:text-xl sm:leading-9">{article.excerpt}</p> : null}
              <p className="mt-6 text-sm font-semibold text-white/60">{[formatArticleDate(article.publishedDate), article.author, ...article.categoryNames].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-[78rem] gap-y-12 px-5 py-16 sm:px-10 sm:py-24 xl:grid-cols-[minmax(0,56rem)_13rem] xl:gap-x-16 xl:gap-y-0">
          <div className="mx-auto w-full max-w-[56rem]">
            {article.description && article.description !== article.excerpt ? <p className="mb-10 text-xl font-semibold leading-9 text-white/82 sm:text-2xl sm:leading-10">{article.description}</p> : null}
            <FinalArticleRichText content={article.content} />
          </div>

          <aside className="h-fit border-t border-white/15 pt-6 xl:sticky xl:top-28 xl:col-start-2 xl:row-start-1 xl:w-52">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#f87724]">Article details</p>
            <dl className="mt-5 space-y-5 text-sm">
              <ArticleMeta label="Programme" value={article.programTitle} />
              <ArticleMeta label="Story level" value={article.targetLabel} />
              <ArticleMeta label="Published" value={formatArticleDate(article.publishedDate)} />
              {article.author ? <ArticleMeta label="Author" value={article.author} /> : null}
            </dl>
            {article.programHref ? <Link className="mt-7 inline-flex border-b border-[#f87724] pb-1 text-sm font-black text-[#f87724]" href={article.programHref}>Explore programme ↗</Link> : null}
            {article.tags.length ? <div className="mt-8 flex flex-wrap gap-2">{article.tags.map((tag) => <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60" key={tag}>#{tag}</span>)}</div> : null}
          </aside>
        </div>
      </article>

      {related.length ? <RelatedArticles articles={related} /> : null}
    </main>
  );
}

function RelatedArticles({ articles }: { articles: FinalArticleCard[] }) {
  return (
    <section className="mx-auto max-w-[80rem] px-5 pt-8 sm:px-10 sm:pt-12">
      <div className="mb-8 flex items-end justify-between border-b border-white/10 pb-5">
        <div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#f87724]">More from this programme</p><h2 className="mt-2 text-3xl font-black">Related articles</h2></div>
        <Link className="text-sm font-bold text-white/60 hover:text-white" href="/prototype/final">Back home</Link>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {articles.map((item) => (
          <Link className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]" href={finalArticleHref(item.slug)} key={item.slug}>
            <div className="relative aspect-[16/10] bg-[#07101f]">
              {item.imageUrl ? <Image alt={item.imageAlt} className="object-cover transition duration-500 group-hover:scale-105" fill sizes="(max-width: 768px) 100vw, 33vw" src={item.imageUrl} /> : null}
            </div>
            <div className="p-5"><p className="text-xs font-black uppercase text-[#f87724]">{item.targetLabel}</p><h3 className="mt-2 text-xl font-black leading-snug">{item.title}</h3>{item.excerpt ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/55">{item.excerpt}</p> : null}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ArticleMeta({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-bold text-white/40">{label}</dt><dd className="mt-1 font-bold text-white/80">{value}</dd></div>;
}

function formatArticleDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function absoluteImageUrl(value?: string): string | undefined {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!origin) return undefined;
  try {
    return new URL(value, origin).toString();
  } catch {
    return undefined;
  }
}

function absolutePageUrl(path: string): string | undefined {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!origin) return undefined;
  try {
    return new URL(path, origin).toString();
  } catch {
    return undefined;
  }
}
