import { notFound } from 'next/navigation';
import { SectionContactsPanel } from '@/components/SectionContacts';
import styles from '@/components/SectionContacts.module.css';
import { MarketEventModalShell } from '@/components/studios/MarketEventModalShell';
import { resolveSectionContactPage } from '@/lib/section-contacts';

export const dynamic = 'force-dynamic';

/** Contact Information opened from a link on the site: the same modal as Market & Events, wider. */
export default async function SectionContactModalPage({ params }: { params: Promise<{ section: string }> }) {
  const section = await resolveSectionContactPage(decodeURIComponent((await params).section));
  if (!section) notFound();
  return (
    <MarketEventModalShell closeLabel="Close Contact Information" dialogClassName={styles.modal} title={`Contact Information · ${section.label}`}>
      <div className={styles.modalBody}>
        <SectionContactsPanel label={section.label} people={section.people} />
      </div>
    </MarketEventModalShell>
  );
}
