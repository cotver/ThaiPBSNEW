import { notFound, redirect } from "next/navigation";
import { BlogPrototypeCategory } from "@/components/prototype/blog/BlogPrototype";
import { getPrototypeCategories, parsePrototypeStyle, titleMatchesCategory, withPrototypeFallback } from "@/components/prototype/blog/blog-data";
import { getCatalogTitles } from "@/lib/payload-content";

export const dynamic = "force-dynamic";

export default async function StyleCategoryPage({ params }: { params: Promise<{ slug: string; style: string }> }) {
  const { slug, style: value } = await params;
  const style = parsePrototypeStyle(value);
  if (!style) notFound();
  if (slug === "all") redirect(`/prototype/${style}`);
  const sourceTitles = await getCatalogTitles();
  const catalog = withPrototypeFallback(sourceTitles);
  const category = getPrototypeCategories(catalog).find((item) => item.slug === slug);
  if (!category) notFound();
  const titles = catalog.filter((title) => titleMatchesCategory(title, slug));
  return <BlogPrototypeCategory category={category} style={style} titles={titles} />;
}
