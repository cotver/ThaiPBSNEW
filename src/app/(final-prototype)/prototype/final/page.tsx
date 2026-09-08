import { FinalPrototype } from "@/components/final-prototype/FinalPrototype";
import { buildFinalArticleCollections, getFinalArticles } from "@/lib/payload-articles";

export const dynamic = "force-dynamic";

export default async function FinalPrototypePage() {
  const articles = await getFinalArticles();
  const collections = buildFinalArticleCollections(articles);

  return <FinalPrototype collections={collections} />;
}
