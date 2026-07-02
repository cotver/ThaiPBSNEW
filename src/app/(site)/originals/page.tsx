import { BrandTiles } from "@/components/BrandTiles";
import { ContentRow } from "@/components/ContentRow";
import { getCatalogCollections, getCategoryTiles } from "@/lib/payload-content";

export const dynamic = "force-dynamic";

export default async function OriginalsPage() {
  const [collections, categories] = await Promise.all([
    getCatalogCollections(),
    getCategoryTiles(),
  ]);

  return (
    <section className="space-y-10 px-5 pb-16 sm:px-8 lg:px-10">
      <div className="max-w-3xl">
        <p className="text-sm font-bold uppercase text-cyan-200">Exclusive stories</p>
        <h1 className="mt-3 text-4xl font-black sm:text-6xl">Originals</h1>
        <p className="mt-4 leading-7 text-white/68">
          Signature ThaiPBS Parvilions originals with premium adventures, animated stories, and
          cinematic family viewing.
        </p>
      </div>
      <BrandTiles categories={categories} />
      <ContentRow layout="vertical" title="ThaiPBS Parvilions Originals" titles={collections.originals} />
      <ContentRow layout="vertical" title="Because You Watched" titles={collections.recommended} />
    </section>
  );
}
