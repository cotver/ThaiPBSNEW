import { cache } from 'react';
import type { Category, Contact, SectionContact } from '../../payload-types';
import { contactSectionKey, findContactSection, type ContactSection } from './contact-sections';
import { getPayloadClient } from './payload-client';

export type SectionContactPerson = {
  address?: string;
  email?: string;
  id: number;
  imageAlt: string;
  imageUrl?: string;
  name?: string;
  phone?: string;
  position?: string;
  website?: string;
};

export type SectionContactGroup = {
  backHref: string;
  label: string;
  people: SectionContactPerson[];
};

const clean = (value: string | null | undefined) => value?.trim() || undefined;

function toPerson(contact: number | Contact | null | undefined): SectionContactPerson | null {
  if (!contact || typeof contact !== 'object') return null;
  const image = contact.image && typeof contact.image === 'object' ? contact.image : undefined;
  const person: SectionContactPerson = {
    address: clean(contact.address),
    email: clean(contact.email),
    id: contact.id,
    imageAlt: clean(image?.alt) || clean(contact.name) || 'Contact',
    imageUrl: image?.url || undefined,
    name: clean(contact.name),
    phone: clean(contact.phone),
    position: clean(contact.position),
    website: clean(contact.website),
  };
  // Every field is optional, but a contact with nothing in it has nothing to show.
  const hasContent = [person.name, person.imageUrl, person.position, person.phone, person.website, person.email, person.address].some(Boolean);
  return hasContent ? person : null;
}

/** The site's key for a Section Contacts entry, or undefined while its type row / year is missing. */
function docSection(doc: SectionContact): { key: string; label: string; backHref: string } | undefined {
  const section = findContactSection(doc.section);
  if (!section) return undefined;
  if (doc.section === 'type-row') {
    const type = doc.programType && typeof doc.programType === 'object' ? (doc.programType as Category) : undefined;
    return type?.slug ? { key: contactSectionKey({ type: type.slug }), label: type.name, backHref: section.backHref } : undefined;
  }
  if (doc.section === 'year-row') {
    return doc.year ? { key: contactSectionKey({ year: doc.year }), label: `ThaiPBS Year ${doc.year}`, backHref: section.backHref } : undefined;
  }
  return { key: doc.section, label: section.label, backHref: section.backHref };
}

/** Contact people for every section that has any, keyed by contactSectionKey, loaded once per request. */
export const getAllSectionContacts = cache(async (): Promise<Map<string, SectionContactGroup>> => {
  const groups = new Map<string, SectionContactGroup>();
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({ collection: 'section-contacts', depth: 2, overrideAccess: true, pagination: false, sort: 'createdAt' });
    for (const doc of result.docs) {
      const section = docSection(doc);
      if (!section) continue;
      // Several entries may point at the same section; their contacts join up, each person once.
      const group = groups.get(section.key) || { backHref: section.backHref, label: section.label, people: [] };
      for (const person of (doc.contacts || []).map(toPerson)) {
        if (person && !group.people.some(({ id }) => id === person.id)) group.people.push(person);
      }
      if (group.people.length) groups.set(section.key, group);
    }
  } catch (error) {
    console.warn('Unable to load section contacts', error);
  }
  return groups;
});

export async function getSectionContactGroup(key: string): Promise<SectionContactGroup | undefined> {
  return (await getAllSectionContacts()).get(key);
}

/**
 * What the Contact Information modal / page shows for a URL key: a section with contacts, or a known fixed
 * section that has none yet. Type and year rows are only named through their contacts, so those 404 empty.
 */
export async function resolveSectionContactPage(key: string): Promise<SectionContactGroup | undefined> {
  const group = await getSectionContactGroup(key);
  if (group) return group;
  const section = findContactSection(key);
  if (!section || section.value === 'type-row' || section.value === 'year-row') return undefined;
  return { backHref: section.backHref, label: section.label, people: [] };
}

export async function getSectionContacts(section: ContactSection): Promise<SectionContactPerson[]> {
  return (await getSectionContactGroup(contactSectionKey(section)))?.people || [];
}
