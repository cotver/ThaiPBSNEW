import { SearchExperience } from "@/components/SearchExperience";
import { getCatalogTitles } from "@/lib/payload-content";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const titles = await getCatalogTitles();

  return <SearchExperience titles={titles} />;
}
