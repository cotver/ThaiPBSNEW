import { SearchExperience } from "@/components/SearchExperience";
import { getCatalogTitles } from "@/lib/payload-content";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const titles = await getCatalogTitles();

  return <SearchExperience initialQuery={params?.q ?? ""} titles={titles} />;
}
