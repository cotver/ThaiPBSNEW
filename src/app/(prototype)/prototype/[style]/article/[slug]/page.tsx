import { notFound } from "next/navigation";
import { BlogPrototypeArticle } from "@/components/prototype/blog/BlogPrototype";
import { parsePrototypeStyle, withPrototypeFallback } from "@/components/prototype/blog/blog-data";
import { getCatalogTitle, getCatalogTitles } from "@/lib/payload-content";

export const dynamic = "force-dynamic";

export default async function StyleArticlePage({ params }: { params: Promise<{ slug: string; style: string }> }) {
  const { slug, style: value } = await params;
  const style = parsePrototypeStyle(value);
  if (!style) notFound();
  const [record, sourceTitles] = await Promise.all([getCatalogTitle(slug), getCatalogTitles()]);
  const catalog = withPrototypeFallback(sourceTitles);
  const title = record ?? catalog.find((item) => item.slug === slug);
  if (!title || title.isDiscontinued) notFound();
  const related = catalog.filter((item) => item.slug !== title.slug).slice(0, 3);
  return <BlogPrototypeArticle related={related} style={style} title={title} />;
}
