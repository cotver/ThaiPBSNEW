import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionContactsPanel } from "@/components/SectionContacts";
import styles from "@/components/SectionContacts.module.css";
import { resolveSectionContactPage } from "@/lib/section-contacts";

export const dynamic = "force-dynamic";

type ContactPageProps = { params: Promise<{ section: string }> };

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const section = await resolveSectionContactPage(decodeURIComponent((await params).section));
  return section ? { title: `Contact Information · ${section.label}` } : {};
}

/** Contact Information as a full page, for direct visits and reloads; clicking a link opens it as a modal. */
export default async function SectionContactPage({ params }: ContactPageProps) {
  const section = await resolveSectionContactPage(decodeURIComponent((await params).section));
  if (!section) notFound();

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <Link className={styles.back} href={section.backHref}>‹ Back</Link>
        <SectionContactsPanel label={section.label} people={section.people} />
      </div>
    </main>
  );
}
