/**
 * Every home page section that can carry contact people, in page order. Shared by the CMS (the section
 * picker on Section Contacts) and the site (the "Contact Information" link and page). `hidden` marks the
 * sections only shown when the hidden catalog sections flag is on.
 *
 * To add a section: add it here, render <SectionContactLink section={...}> under it, and run
 * `npx payload migrate:create` (the section list is a database enum).
 */
export const contactSections = [
  { value: 'studios-hero', label: 'Studios Featured Stories', backHref: '/home#studios' },
  { value: 'catalog', label: 'Studios Categories & Articles', backHref: '/home#catalog' },
  { value: 'other-categories', label: 'More Studios Categories', backHref: '/home#studios' },
  { value: 'press-releases', label: 'Press Releases', backHref: '/home#news' },
  { value: 'content-distribution', label: 'Content Distribution', backHref: '/home#news' },
  { value: 'market-events', label: 'Market & Events', backHref: '/home#market-events' },
  { value: 'hero-carousel', label: 'Hero Carousel', backHref: '/home' },
  { value: 'brand-tiles', label: 'Brand Tiles', backHref: '/home' },
  { value: 'recommended', label: 'Recommended For You', backHref: '/home' },
  { value: 'type-row', label: 'Program Type Row', backHref: '/home' },
  { value: 'continue-watching', label: 'Continue Watching', backHref: '/home', hidden: true },
  { value: 'continue-programs', label: 'Continue Programs', backHref: '/home', hidden: true },
  { value: 'discontinued-programs', label: 'Discontinued Programs', backHref: '/home', hidden: true },
  { value: 'year-row', label: 'ThaiPBS Year Row', backHref: '/home', hidden: true },
  { value: 'thai-programs', label: 'Thai Programs', backHref: '/home', hidden: true },
  { value: 'international-programs', label: 'International Programs', backHref: '/home', hidden: true },
] as const

export type ContactSectionValue = (typeof contactSections)[number]['value']

/**
 * A section as the site addresses it. Type and year rows repeat on the page, so each one is told apart
 * by its program type slug or its year.
 */
export type ContactSection =
  | Exclude<ContactSectionValue, 'type-row' | 'year-row'>
  | { type: string }
  | { year: number }

export function contactSectionKey(section: ContactSection): string {
  if (typeof section === 'string') return section
  return 'type' in section ? `type-${section.type}` : `year-${section.year}`
}

export function findContactSection(value: string) {
  return contactSections.find((section) => section.value === value)
}

export function contactSectionOptionLabel(section: (typeof contactSections)[number]): string {
  return 'hidden' in section && section.hidden ? `${section.label} (hidden section)` : section.label
}

export function sectionContactHref(section: ContactSection): string {
  return `/studios/contact/${encodeURIComponent(contactSectionKey(section))}`
}
