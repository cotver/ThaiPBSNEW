import { notFound } from "next/navigation";
import { BlogPrototypeHome } from "@/components/prototype/blog/BlogPrototype";
import { parsePrototypeStyle, withPrototypeFallback } from "@/components/prototype/blog/blog-data";
import { getCatalogTitles, getCategoryTiles } from "@/lib/payload-content";

export const dynamic = "force-dynamic";

export default async function StyleHomePage({ params }: { params: Promise<{ style: string }> }) {
  const { style: value } = await params;
  const style = parsePrototypeStyle(value);
  if (!style) notFound();
  const [sourceTitles, categoryTiles] = await Promise.all([getCatalogTitles(), getCategoryTiles()]);
  const titles = withPrototypeFallback(sourceTitles);
  return <BlogPrototypeHome categoryTiles={categoryTiles} style={style} titles={titles} />;
}
