import Image from "next/image";
import Link from "next/link";
import { sectionContactHref, type ContactSection } from "@/lib/contact-sections";
import { getSectionContacts, type SectionContactPerson } from "@/lib/section-contacts";
import styles from "./SectionContacts.module.css";

/**
 * The "Contact Information" link under a home page section. Renders nothing until someone adds contacts
 * to that section in the CMS (Column › Section Contacts), so it can be dropped under any section.
 */
export async function SectionContactLink({
  className,
  section,
  tone = "dark",
}: {
  className?: string;
  section: ContactSection;
  tone?: "dark" | "light";
}) {
  const contacts = await getSectionContacts(section);
  if (!contacts.length) return null;
  return (
    <div className={className ? `${styles.linkRow} ${className}` : styles.linkRow} data-section-contact-link data-tone={tone}>
      <Link className={styles.link} href={sectionContactHref(section)}>Contact Information</Link>
    </div>
  );
}

/** The contact cards for one section: the body of both the Contact Information modal and its full page. */
export function SectionContactsPanel({ label, people }: { label: string; people: SectionContactPerson[] }) {
  return (
    <>
      <h1 className={styles.heading}>Contact Information</h1>
      <p className={styles.sectionName}>{label}</p>
      {people.length ? (
        <div className={styles.grid}>
          {people.map((person) => <SectionContactCard key={person.id} person={person} />)}
        </div>
      ) : <p className={styles.empty}>No contacts for this section yet.</p>}
    </>
  );
}

function websiteHref(website: string): string {
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

const icons = {
  phone: <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" />,
  website: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m6.9 6h-2.95a15.7 15.7 0 0 0-1.38-3.56A8 8 0 0 1 18.9 8M12 4.04A14 14 0 0 1 13.9 8h-3.8A14 14 0 0 1 12 4.04M4.26 14a8.2 8.2 0 0 1 0-4h3.38a16.5 16.5 0 0 0 0 4zm.82 2h2.95a15.7 15.7 0 0 0 1.38 3.56A8 8 0 0 1 5.08 16m2.95-8H5.08a8 8 0 0 1 4.33-3.56A15.7 15.7 0 0 0 8.03 8M12 19.96A14 14 0 0 1 10.1 16h3.8A14 14 0 0 1 12 19.96M14.34 14H9.66a14.7 14.7 0 0 1 0-4h4.68a14.7 14.7 0 0 1 0 4m.25 5.56A15.7 15.7 0 0 0 15.97 16h2.95a8 8 0 0 1-4.33 3.56M16.36 14a16.5 16.5 0 0 0 0-4h3.38a8.2 8.2 0 0 1 0 4z" />,
  email: <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m0 4-8 5-8-5V6l8 5 8-5z" />,
  address: <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7m0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5" />,
};

function ContactLine({ href, icon, children }: { href?: string; icon: keyof typeof icons; children: React.ReactNode }) {
  return (
    <li>
      <span className={styles.icon} aria-hidden="true"><svg viewBox="0 0 24 24">{icons[icon]}</svg></span>
      {href ? <a href={href} rel={icon === "website" ? "noopener noreferrer" : undefined} target={icon === "website" ? "_blank" : undefined}>{children}</a> : <span>{children}</span>}
    </li>
  );
}

export function SectionContactCard({ person }: { person: SectionContactPerson }) {
  return (
    <article className={styles.card}>
      {person.imageUrl ? (
        <span className={styles.photo}><Image alt={person.imageAlt} fill sizes="96px" src={person.imageUrl} /></span>
      ) : null}
      {person.name ? <h2 className={styles.name}>{person.name}</h2> : null}
      {person.position ? <p className={styles.position}>{person.position}</p> : null}
      {person.phone || person.website || person.email || person.address ? (
        <ul className={styles.details}>
          {person.phone ? <ContactLine href={`tel:${person.phone.replace(/[^\d+]/g, "")}`} icon="phone">{person.phone}</ContactLine> : null}
          {person.website ? <ContactLine href={websiteHref(person.website)} icon="website">{person.website}</ContactLine> : null}
          {person.email ? <ContactLine href={`mailto:${person.email}`} icon="email">{person.email}</ContactLine> : null}
          {person.address ? <ContactLine icon="address">{person.address}</ContactLine> : null}
        </ul>
      ) : null}
    </article>
  );
}
