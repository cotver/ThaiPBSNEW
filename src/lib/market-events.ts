import type { ColumnMedia, MarketEventContent, MarketEventGroup } from '../../payload-types';
import { getPayloadClient } from './payload-client';
import { buildSlugLookupKeys } from './slug-lookup';

export function marketEventImage(value: number | ColumnMedia | null | undefined): ColumnMedia | undefined {
  return value && typeof value === 'object' ? value : undefined;
}

export function marketEventGroupHref(slug: string): string {
  return `/studios/events/${encodeURIComponent(slug)}`;
}

export function marketEventHref(groupSlug: string, eventSlug: string): string {
  return `${marketEventGroupHref(groupSlug)}/${encodeURIComponent(eventSlug)}`;
}

export async function getMarketEventGroups(): Promise<MarketEventGroup[]> {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({ collection: 'market-event-groups', depth: 1, overrideAccess: true, pagination: false, sort: '_order' });
    return result.docs;
  } catch (error) {
    console.warn('Unable to load market and event groups', error);
    return [];
  }
}

export async function getMarketEventGroup(slug: string): Promise<MarketEventGroup | undefined> {
  const payload = await getPayloadClient();
  const result = await payload.find({ collection: 'market-event-groups', depth: 1, overrideAccess: true, limit: 1, where: { or: buildSlugLookupKeys(slug).map((key) => ({ slug: { equals: key } })) } });
  return result.docs[0];
}

export async function getMarketEventsInGroup(groupId: number): Promise<MarketEventContent[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({ collection: 'market-event-content', depth: 2, overrideAccess: true, pagination: false, sort: '-dateTime', where: { marketEventGroup: { equals: groupId } } });
  return result.docs;
}

export async function getMarketEvent(groupId: number, slug: string): Promise<MarketEventContent | undefined> {
  const payload = await getPayloadClient();
  const result = await payload.find({ collection: 'market-event-content', depth: 2, overrideAccess: true, limit: 1, where: { and: [{ marketEventGroup: { equals: groupId } }, { or: buildSlugLookupKeys(slug).map((key) => ({ slug: { equals: key } })) }] } });
  return result.docs[0];
}

export function formatMarketEventDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' }).format(date);
}
