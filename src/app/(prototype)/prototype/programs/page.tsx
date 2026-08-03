import { PrototypeProgramCatalog } from "@/components/prototype/PrototypeProgramCatalog";
import { PrototypeProgramFooter } from "@/components/prototype/PrototypeProgramHeader";
import { PrototypeProgramHero } from "@/components/prototype/PrototypeProgramHero";
import { getCatalogTitles } from "@/lib/payload-content";

export const dynamic = "force-dynamic";

export default async function PrototypeProgramsPage() {
  const titles = await getCatalogTitles();
  const availableTitles = titles.filter((title) => !title.isDiscontinued);
  const featured = availableTitles.find((title) => title.featured) ?? availableTitles[0];
  const heroTitles = featured
    ? [featured, ...availableTitles.filter((title) => title.slug !== featured.slug)].slice(0, 6)
    : [];

  return (
    <main className="program-prototype min-h-screen overflow-hidden">
      {heroTitles.length ? <PrototypeProgramHero titles={heroTitles} /> : <EmptyHero />}
      <PrototypeProgramCatalog titles={availableTitles} />
      <PrototypeProgramFooter />
    </main>
  );
}

function EmptyHero() {
  return <section className="mx-auto flex min-h-[28rem] max-w-[1440px] items-center px-5 sm:px-8 lg:px-12"><div><p className="text-xs font-black uppercase text-cyan-200">Thai PBS Stories</p><h1 className="mt-4 text-4xl font-black sm:text-6xl">เรื่องราวจาก Thai PBS</h1><p className="mt-4 text-white/55">ยังไม่มีเรื่องที่เผยแพร่</p></div></section>;
}
