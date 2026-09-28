import { notFound, redirect } from 'next/navigation';
import { getMarketEvent, getMarketEventGroup, marketEventGroupHref } from '@/lib/market-events';

export const dynamic = 'force-dynamic';

export default async function MarketEventPage({ params }: { params: Promise<{ group: string; event: string }> }) {
  const { group: groupSlug, event: eventSlug } = await params;
  const group = await getMarketEventGroup(groupSlug);
  if (!group) notFound();
  const event = await getMarketEvent(group.id, eventSlug);
  if (!event) notFound();
  redirect(`${marketEventGroupHref(group.slug)}#event-${event.id}`);
}
