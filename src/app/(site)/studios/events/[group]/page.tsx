import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MarketEventGroupDetail } from '@/components/MarketEvents';
import { getMarketEventGroup, getMarketEventsInGroup } from '@/lib/market-events';
import styles from '@/components/MarketEvents.module.css';

export const dynamic = 'force-dynamic';

export default async function MarketEventGroupPage({ params }: { params: Promise<{ group: string }> }) {
  const { group: slug } = await params;
  const group = await getMarketEventGroup(slug);
  if (!group) notFound();
  const events = await getMarketEventsInGroup(group.id);
  return <main className={styles.page}><div className={styles.inner}>
    <Link prefetch={false} className={styles.back} href="/studios/events">‹ All Market &amp; Events</Link>
    <div className={styles.standalone}><MarketEventGroupDetail events={events} group={group} /></div>
  </div></main>;
}
