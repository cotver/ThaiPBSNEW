import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudioNewsBySection, StudiosMarketCompanyCard, StudiosPressCard } from "@/components/StudiosShowcase";
import styles from "@/components/StudiosShowcase.module.css";
import { getMarketCompanies } from "@/lib/d1-market";

export const dynamic = "force-dynamic";

export default async function StudiosNewsPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section !== "press-releases" && section !== "markets-and-events") notFound();

  const isPress = section === "press-releases";
  const [items, companies] = await Promise.all([
    isPress ? getStudioNewsBySection("press-releases") : Promise.resolve([]),
    isPress ? Promise.resolve([]) : getMarketCompanies(),
  ]);
  const marketLogoCompanies = companies;
  const title = isPress ? "Press Releases" : "Markets and Events";
  const itemCount = isPress ? items.length : marketLogoCompanies.length;

  return (
    <main className={`${styles.lightSection} ${styles.newsArchive}`}>
      <div className={styles.newsArchiveHeading}>
        <Link href="/home#news">‹ Back to Studios</Link>
        <h1>{title}</h1>
        <p>{itemCount} {isPress ? `article${itemCount === 1 ? "" : "s"}` : `market partner${itemCount === 1 ? "" : "s"}`}</p>
      </div>
      {isPress && items.length ? (
        <div className={styles.pressGrid}>
          {items.map((item) => <StudiosPressCard item={item} key={item.id} />)}
        </div>
      ) : !isPress && marketLogoCompanies.length ? (
        <div data-market-logo-grid>
          {marketLogoCompanies.map((company) => <StudiosMarketCompanyCard company={company} key={company.slug} />)}
        </div>
      ) : <p className={styles.emptyNews}>{isPress ? "No articles in this section yet." : "No market partners are available yet."}</p>}
    </main>
  );
}
