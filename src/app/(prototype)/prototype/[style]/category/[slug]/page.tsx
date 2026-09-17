import { notFound, redirect } from "next/navigation";
import { BlogPrototypeCategory } from "@/components/prototype/blog/BlogPrototype";
import { parsePrototypeStyle, titleCategories, titleMatchesCategory, withPrototypeFallback } from "@/components/prototype/blog/blog-data";
import { getCatalogTitles, getHeroImageTitles } from "@/lib/payload-content";

export const dynamic = "force-dynamic";

export default async function StyleCategoryPage({ params }: { params: Promise<{ slug: string; style: string }> }) {
  const { slug, style: value } = await params;
  const style = parsePrototypeStyle(value);
  if (!style) notFound();
  if (slug === "all") redirect(`/prototype/${style}`);
  const [sourceTitles, heroTitles] = await Promise.all([getCatalogTitles(), getHeroImageTitles()]);
  const catalog = [...heroTitles, ...withPrototypeFallback(sourceTitles)].filter((title) => !title.isDiscontinued);
  const category = catalog.flatMap(titleCategories).find((item) => item.slug === slug);
  if (!category) notFound();
  const titles = catalog.filter((title) => titleMatchesCategory(title, slug));
  return <BlogPrototypeCategory category={category} style={style} titles={titles} />;
}
