import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudioNewsBySection, StudiosEventCard, StudiosPressCard } from "@/components/StudiosShowcase";
import styles from "@/components/StudiosShowcase.module.css";

export const dynamic = "force-dynamic";

export default async function StudiosNewsPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section !== "press-releases" && section !== "markets-and-events") notFound();

  const items = await getStudioNewsBySection(section);
  const isPress = section === "press-releases";
  const title = isPress ? "Press Releases" : "Markets and Events";

  return (
    <main className={`${styles.lightSection} ${styles.newsArchive}`}>
      <div className={styles.newsArchiveHeading}>
        <Link href="/home#news">‹ Back to Studios</Link>
        <h1>{title}</h1>
        <p>{items.length} article{items.length === 1 ? "" : "s"}</p>
      </div>
      {items.length ? (
        <div className={isPress ? styles.pressGrid : styles.eventGrid}>
          {items.map((item) => isPress
            ? <StudiosPressCard item={item} key={item.id} />
            : <StudiosEventCard item={item} key={item.id} />)}
        </div>
      ) : <p className={styles.emptyNews}>No articles in this section yet.</p>}
    </main>
  );
}
