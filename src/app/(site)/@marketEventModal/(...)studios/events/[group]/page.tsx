import { notFound } from 'next/navigation';
import { MarketEventGroupDetail } from '@/components/MarketEvents';
import { MarketEventModalShell } from '@/components/studios/MarketEventModalShell';
import { getMarketEventGroup, getMarketEventsInGroup } from '@/lib/market-events';

export const dynamic = 'force-dynamic';

export default async function MarketEventModalPage({ params }: { params: Promise<{ group: string }> }) {
  const { group: slug } = await params;
  const group = await getMarketEventGroup(slug);
  if (!group) notFound();
  const events = await getMarketEventsInGroup(group.id);
  return <MarketEventModalShell title={group.name}><MarketEventGroupDetail events={events} group={group} /></MarketEventModalShell>;
}
