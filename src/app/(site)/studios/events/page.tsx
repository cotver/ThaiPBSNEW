import Link from 'next/link';
import { MarketEventGroupGrid } from '@/components/MarketEvents';
import { SectionContactLink } from '@/components/SectionContacts';
import { getMarketEventGroups } from '@/lib/market-events';
import styles from '@/components/MarketEvents.module.css';

export const dynamic = 'force-dynamic';

export default async function MarketEventsPage() {
  const groups = await getMarketEventGroups();
  return <main className={styles.page}><div className={styles.inner}>
    <div className={styles.headingRow}><div>
      <Link className={styles.back} href="/home#market-events">‹ Back to Studios</Link>
      <h1 className={styles.heading}>Market &amp; Events</h1>
    </div></div>
    {groups.length ? <MarketEventGroupGrid groups={groups} /> : <p className={styles.empty}>No market and event groups are available yet.</p>}
    <SectionContactLink section="market-events" />
  </div></main>;
}
