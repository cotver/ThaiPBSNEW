import Link from "next/link";
import { notFound } from "next/navigation";
import { StudiosArticleCard, type CatalogFilter } from "@/components/StudiosCatalog";
import { getStudioCategoryCatalogBySlug } from "@/components/StudiosShowcase";
import styles from "@/components/StudiosShowcase.module.css";

export const dynamic = "force-dynamic";

const filterLabels: Record<CatalogFilter | "all", string> = {
  all: "All",
  new: "New",
  newEpisodes: "New Episodes",
  comingSoon: "Coming Soon",
};

export default async function StudiosCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const category = await getStudioCategoryCatalogBySlug(slug);
  if (!category) notFound();

  const filter: CatalogFilter | "all" = query.filter === "new" || query.filter === "newEpisodes" || query.filter === "comingSoon"
    ? query.filter
    : "all";
  const articles = category.articles[filter];

  return (
    <section className={styles.browsePage}>
      <div className={styles.browseHeading}>
        <Link href="/home#catalog">‹ Back to Studios</Link>
        <h1>{category.name}</h1>
        <p>{filterLabels[filter]} · {articles.length} article{articles.length === 1 ? "" : "s"}</p>
      </div>
      {articles.length ? (
        <div className={styles.browseGrid}>
          {articles.map((article) => <StudiosArticleCard article={article} key={article.id} />)}
        </div>
      ) : (
        <p className={styles.browseEmpty}>No articles in this view yet.</p>
      )}
    </section>
  );
}
