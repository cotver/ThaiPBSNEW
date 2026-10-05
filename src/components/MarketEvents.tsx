import Image from 'next/image';
import Link from 'next/link';
import type { MarketEventContent, MarketEventGroup, Program } from '../../payload-types';
import { ArticleRichText } from './article/ArticleRichText';
import { titleHref } from '@/lib/content';
import { formatMarketEventDate, marketEventGroupHref, marketEventImage } from '@/lib/market-events';
import styles from './MarketEvents.module.css';

export function MarketEventGroupGrid({ groups }: { groups: MarketEventGroup[] }) {
  return <div className={styles.grid}>
    {groups.map((group) => {
      const cover = marketEventImage(group.coverImage);
      return <Link prefetch={false} className={styles.groupCard} data-studios-reveal-item href={marketEventGroupHref(group.slug)} key={group.id}>
        <span className={styles.groupImage}>{cover?.url ? <Image alt={cover.alt || group.name} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" src={cover.url} /> : null}</span>
        <span className={styles.groupName}>{group.name}</span>
      </Link>;
    })}
  </div>;
}

function programArtwork(program: Program) {
  const cover = typeof program.coverImage === 'object' ? program.coverImage : undefined;
  const image = typeof program.image === 'object' ? program.image : undefined;
  return cover?.url ? cover : image?.url ? image : undefined;
}

export function MarketEventGroupDetail({ group, events }: { group: MarketEventGroup; events: MarketEventContent[] }) {
  const cover = marketEventImage(group.coverImage);
  return <div className={styles.detail}>
    <div className={styles.detailCover}>
      {cover?.url ? <Image alt={cover.alt || group.name} fill priority sizes="(max-width: 760px) 100vw, 760px" src={cover.url} /> : <strong>{group.name}</strong>}
    </div>
    <div className={styles.detailBody}>
      <p className={styles.eyebrow}>Market &amp; Events</p>
      <h1 className={styles.detailTitle}>{group.name}</h1>
      {events.length ? events.map((event) => {
        const programs = (event.programs || []).filter((program): program is Program => typeof program === 'object');
        const eventCover = marketEventImage(event.coverImage);
        const photos = (event.images || [])
          .map((item) => ({ item, media: marketEventImage(item.image) }))
          .filter(({ media }) => Boolean(media?.url && media.id !== eventCover?.id));
        return <section className={styles.detailEvent} id={`event-${event.id}`} key={event.id}>
          <h2>{event.name}</h2>
          {event.dateTime || event.location ? <p className={styles.eventMeta}>
            {event.dateTime ? <time dateTime={event.dateTime}>{formatMarketEventDate(event.dateTime)}</time> : null}
            {event.dateTime && event.location ? <span aria-hidden="true">·</span> : null}
            {event.location ? <span>{event.location}</span> : null}
          </p> : null}
          {programs.length ? <div className={styles.programSection}>
            <h3>Programs</h3>
            <div className={styles.programGrid}>{programs.map((program) => {
              const artwork = programArtwork(program);
              const title = program.titleEn || program.titleTh || program._displayTitle || program.slug;
              return <Link prefetch={false} aria-label={`View ${title}`} className={styles.programCard} href={titleHref(program.slug)} key={program.id}>
                <span className={styles.programPoster}>{artwork?.url ? <Image alt={artwork.alt || title} fill sizes="(max-width: 600px) 42vw, 180px" src={artwork.url} /> : <span>{title}</span>}</span>
                <span className={styles.programTitle}>{title}</span>
              </Link>;
            })}</div>
          </div> : null}
          {event.content ? <div className={styles.richText}><ArticleRichText content={event.content} /></div> : null}
          {eventCover?.url || photos.length ? <div className={styles.gallerySection}>
            <h3>Event</h3>
            <div className={styles.photoGrid}>
              {eventCover?.url ? <figure><Image alt={eventCover.alt || event.name} height={eventCover.height || 900} sizes="(max-width: 760px) 100vw, 360px" src={eventCover.url} width={eventCover.width || 1200} /></figure> : null}
              {photos.map(({ item, media }) => media?.url ? <figure key={item.id || media.id}>
                <Image alt={media.alt || event.name} height={media.height || 900} sizes="(max-width: 760px) 100vw, 360px" src={media.url} width={media.width || 1200} />
                {item.caption ? <figcaption>{item.caption}</figcaption> : null}
              </figure> : null)}
            </div>
          </div> : null}
        </section>;
      }) : <p className={styles.empty}>No events in this group yet.</p>}
    </div>
  </div>;
}
