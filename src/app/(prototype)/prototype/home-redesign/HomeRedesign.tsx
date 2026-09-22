"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Title } from "@/lib/content";
import { titleHref, titleInlineText } from "@/lib/content";
import type { CategoryTile, TitleCollections } from "@/lib/payload-content";
import styles from "./page.module.css";

type Props = {
  categories: CategoryTile[];
  collections: TitleCollections;
  studiosShowcase: ReactNode;
};

type PrototypeTitle = Title & {
  prototypeId?: string;
  prototypeSourceSlug?: string;
};

const Arrow = ({ direction = "right" }: { direction?: "left" | "right" }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d={direction === "left" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"} />
  </svg>
);

const Play = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="m9 6 9 6-9 6V6Z" />
  </svg>
);

const Search = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </svg>
);

const Menu = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M4 8h16M4 16h16" />
  </svg>
);

function Visual({ alt, className, eager, src }: { alt: string; className?: string; eager?: boolean; src?: string }) {
  if (!src) return <span aria-hidden="true" className={`${styles.fallback} ${className ?? ""}`} />;

  return (
    <Image
      alt={alt}
      className={className}
      fill
      loading={eager ? "eager" : "lazy"}
      sizes="(max-width: 700px) 100vw, (max-width: 1100px) 60vw, 45vw"
      src={src}
    />
  );
}

export function HomeRedesign({ categories, collections, studiosShowcase }: Props) {
  const uniqueCategories = useMemo(
    () => [...new Map(categories.filter((category) => hasReadableName(category.name)).map((category) => [category.id, category])).values()],
    [categories],
  );
  const hasCollectionRows = collections.typeRows.some((row) => hasReadableName(row.type.name) && row.titles.length);
  const heroes = useMemo(() => {
    const source = [...collections.heroes, ...collections.recommended, ...collections.typeRows.flatMap((row) => row.titles)];
    return uniqueTitles(source.filter((title) => hasReadableName(titleInlineText(title)))).slice(0, 6);
  }, [collections.heroes, collections.recommended, collections.typeRows]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [demoMode, setDemoMode] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const heroProgressRef = useRef<HTMLSpanElement>(null);
  const heroElapsedRef = useRef(0);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const activeHero = heroes[heroIndex];
  const nextHero = heroes.length > 1 ? heroes[(heroIndex + 1) % heroes.length] : undefined;
  const allTitles = useMemo(() => {
    const pool = [
      ...collections.heroes,
      ...collections.recommended,
      ...collections.typeRows.flatMap((row) => row.titles),
      ...collections.thaiPrograms,
      ...collections.internationalPrograms,
    ];
    return uniqueTitles(pool.filter((title) => hasReadableName(titleInlineText(title))));
  }, [collections]);
  const searchResults = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return allTitles.slice(0, 6);
    return allTitles
      .filter((title) => `${title.title} ${title.genre}`.toLocaleLowerCase().includes(normalized))
      .slice(0, 8);
  }, [allTitles, query]);
  const recommendedTitles = useMemo<PrototypeTitle[]>(
    () => demoMode ? makePrototypeTitles(collections.recommended, allTitles, 30) : uniqueTitles(collections.recommended.filter((title) => hasReadableName(titleInlineText(title)))).slice(0, 5),
    [allTitles, collections.recommended, demoMode],
  );

  useEffect(() => {
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0);
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    return () => window.removeEventListener("scroll", updateProgress);
  }, [demoMode]);

  useEffect(() => {
    if (!searchOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSearchOpen(false);
      if (event.key === "Tab") {
        const focusables = document.querySelectorAll<HTMLElement>("[data-prototype-search] input, [data-prototype-search] button, [data-prototype-search] a");
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    const previousOverflow = document.body.style.overflow;
    const searchTrigger = searchButtonRef.current;
    document.body.style.overflow = "hidden";
    searchInputRef.current?.focus();
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", close);
      searchTrigger?.focus();
    };
  }, [searchOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const node = heroRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting), { threshold: 0.2 });
    const visibility = () => setHeroVisible(!document.hidden && node.getBoundingClientRect().bottom > 0);
    observer.observe(node);
    document.addEventListener("visibilitychange", visibility);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", visibility); };
  }, [heroes.length]);

  useEffect(() => {
    heroElapsedRef.current = 0;
    if (heroProgressRef.current) heroProgressRef.current.style.transform = "scaleX(0)";
  }, [heroIndex]);

  useEffect(() => {
    if (heroes.length < 2 || reducedMotion || heroPaused || !heroVisible) return;
    let frame = 0;
    let previous = performance.now();
    const advance = (now: number) => {
      heroElapsedRef.current += now - previous;
      previous = now;
      const progress = Math.min(heroElapsedRef.current / 8000, 1);
      if (heroProgressRef.current) heroProgressRef.current.style.transform = `scaleX(${progress})`;
      if (progress >= 1) {
        setHeroIndex((current) => (current + 1) % heroes.length);
        return;
      }
      frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [heroIndex, heroes.length, reducedMotion, heroPaused, heroVisible]);

  const changeHero = (direction: -1 | 1) => {
    if (!heroes.length) return;
    setHeroIndex((current) => (current + direction + heroes.length) % heroes.length);
  };

  return (
    <div className={styles.page}>
      <div className={styles.scrollProgress} aria-hidden="true">
        <span style={{ transform: `scaleX(${scrollProgress})` }} />
      </div>

      <header className={styles.header} inert={searchOpen}>
        <Link className={styles.brand} href="/home" aria-label="Thai PBS home">
          <span className={styles.brandMark}><Image alt="" height={44} loading="eager" src="/LOGO/Logo.png" width={44} /></span>
          <span><b>Thai PBS</b><small>พื้นที่ของทุกคน</small></span>
        </Link>
        <nav aria-label="Prototype navigation" className={menuOpen ? styles.menuOpen : undefined} id="prototype-section-menu">
          <a href="#today" onClick={() => setMenuOpen(false)}>วันนี้</a>
          {uniqueCategories.length > 0 && <a href="#discover" onClick={() => setMenuOpen(false)}>ค้นพบ</a>}
          {hasCollectionRows && <a href="#collections" onClick={() => setMenuOpen(false)}>รายการ</a>}
          <a href="#studios" onClick={() => setMenuOpen(false)}>Studios</a>
        </nav>
        <div className={styles.headerActions}>
          <button
            aria-label={demoMode ? "ปิดข้อมูลตัวอย่าง 30 รายการ" : "เพิ่มข้อมูลตัวอย่าง 30 รายการ"}
            aria-pressed={demoMode}
            className={`${styles.demoButton} ${demoMode ? styles.demoButtonActive : ""}`}
            disabled={!allTitles.length}
            onClick={() => setDemoMode((current) => !current)}
            type="button"
          >
            <span aria-hidden="true">{demoMode ? "✓" : "+"}</span>
            <b>{demoMode ? "30 รายการแล้ว" : "เพิ่มข้อมูล 30 รายการ"}</b>
          </button>
          <button aria-label="ค้นหารายการ" className={styles.searchButton} onClick={() => setSearchOpen(true)} ref={searchButtonRef} type="button">
            <Search /><span>ค้นหา</span>
          </button>
          <button aria-controls="prototype-section-menu" aria-expanded={menuOpen} aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"} className={styles.menuButton} onClick={() => setMenuOpen((open) => !open)} type="button"><Menu /></button>
        </div>
      </header>

      <main inert={searchOpen}>
        {activeHero ? (
          <section
            className={styles.hero}
            aria-label="Featured programme"
            data-paused={heroPaused || !heroVisible || reducedMotion}
            onFocusCapture={() => setHeroPaused(true)}
            onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHeroPaused(false); }}
            onMouseEnter={() => setHeroPaused(true)}
            onMouseLeave={() => setHeroPaused(false)}
            ref={heroRef}
            onPointerLeave={(event) => {
              event.currentTarget.style.setProperty("--pointer-x", "72%");
              event.currentTarget.style.setProperty("--pointer-y", "32%");
            }}
            onPointerMove={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              event.currentTarget.style.setProperty("--pointer-x", `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
              event.currentTarget.style.setProperty("--pointer-y", `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
            }}
          >
            <div className={styles.heroMedia}>
              {heroes.map((hero, index) => (
                <div aria-hidden="true" className={`${styles.heroImageLayer} ${index === heroIndex ? styles.heroImageActive : ""}`} key={hero.slug}>
                  <Visual alt="" className={styles.heroImage} eager={index === 0} src={hero.heroImage ?? hero.posterImage} />
                </div>
              ))}
            </div>
            <div className={styles.heroWash} />
            <div className={styles.heroSpotlight} aria-hidden="true" />
            <div className={styles.heroMeta}>
              <span>ฉบับวันนี้</span>
              <span>{String(heroIndex + 1).padStart(2, "0")} / {String(heroes.length).padStart(2, "0")}</span>
            </div>
            <div className={styles.heroCopy} key={`hero-copy-${activeHero.slug}`}>
              <h1>{titleInlineText(activeHero)}</h1>
              <div className={styles.heroDetails}>
                <span>{activeHero.eyebrow || activeHero.genre || activeHero.type || "Thai PBS"}</span>
                <span>{activeHero.year}</span>
                <span>{activeHero.rating}</span>
                <span>{activeHero.duration}</span>
              </div>
              <p className={styles.heroDescription}>{activeHero.description}</p>
              <div className={styles.heroActions}>
                <Link className={styles.primaryButton} href={titleHref(activeHero.slug)}><Play />รับชมตอนนี้</Link>
                <Link className={styles.textButton} href={titleHref(activeHero.slug)}>อ่านรายละเอียด <Arrow /></Link>
              </div>
            </div>
            {nextHero ? (
              <div className={styles.heroControls}>
                <div className={styles.heroDots}>{heroes.map((hero, index) => (
                  <button aria-label={`แสดง ${titleInlineText(hero)}`} aria-current={index === heroIndex ? "true" : undefined} className={index === heroIndex ? styles.activeDot : ""} key={hero.slug} onClick={() => setHeroIndex(index)} type="button"><span ref={index === heroIndex ? heroProgressRef : undefined} /></button>
                ))}</div>
                <button className={styles.nextFeature} onClick={() => changeHero(1)} type="button" aria-label={`รายการถัดไป ${titleInlineText(nextHero)}`}>
                  <span className={styles.nextFeatureImage}><Visual alt="" src={nextHero.posterImage ?? nextHero.heroImage} /></span>
                  <span><small>รายการถัดไป</small><strong>{titleInlineText(nextHero)}</strong></span><Arrow />
                </button>
              </div>
            ) : null}
          </section>
        ) : (
          <section className={styles.heroEmpty}>
            <span>Thai PBS</span>
            <h1>เรื่องใหม่กำลังเดินทางมา</h1>
            <p>ตอนนี้ยังไม่มีรายการแนะนำ ลองสำรวจคลังรายการหรือกลับมาอีกครั้ง</p>
            <Link className={styles.primaryButton} href="/browse">สำรวจรายการ <Arrow /></Link>
          </section>
        )}

        {uniqueCategories.length ? <section className={styles.categoryStrip} id="discover" aria-label="Browse categories">
          <h2>เลือกดูตาม<br />ความสนใจ</h2>
          <div className={styles.categoryRail}>
            {uniqueCategories.map((category, index) => (
              <Link className={styles.categoryCard} href={`/category/${encodeURIComponent(category.slug)}`} key={category.id}>
                <Visual alt="" className={styles.categoryImage} src={category.imageUrl} />
                <span className={styles.categoryIndex}>{String(index + 1).padStart(2, "0")} / {String(uniqueCategories.length).padStart(2, "0")}</span>
                <strong>{category.name}</strong>
                <span className={styles.categoryArrow}><Arrow /></span>
              </Link>
            ))}
          </div>
        </section> : null}

        <section className={styles.today} id="today">
          <div className={styles.todayIntro}>
            <h2>เรื่องที่ควร<br /><em>ดูวันนี้</em></h2>
            <p>คัดสรรสารคดี ละคร และเรื่องราวที่กำลังถูกพูดถึง จากคลังรายการของไทยพีบีเอส</p>
            <Link href="/browse?section=recommended&label=Recommended%20For%20You">ดูทั้งหมด <Arrow /></Link>
          </div>
          <div className={styles.featureGrid}>
            {recommendedTitles.map((title, index) => (
              <ProgramCard feature={index === 0} key={title.prototypeId ?? title.slug} title={title} />
            ))}
            {!recommendedTitles.length ? <p className={styles.emptyCatalogue}>ยังไม่มีรายการแนะนำในขณะนี้ <Link href="/browse">สำรวจรายการทั้งหมด <Arrow /></Link></p> : null}
          </div>
        </section>

        {allTitles.length > 2 ? <section className={styles.marquee} aria-label="รายการเพิ่มเติม">
          <div>{allTitles.slice(0, 6).map((title) => <Link href={titleHref(title.slug)} key={title.slug}>{titleInlineText(title)} <Arrow /></Link>)}</div>
        </section> : null}

        {hasCollectionRows ? <section className={styles.collections} id="collections">
          <div className={styles.collectionsHeader}><h2>เลือกตาม<br />อารมณ์ของคุณ</h2></div>
          {collections.typeRows.filter((row) => hasReadableName(row.type.name) && row.titles.length).slice(0, 4).map((row) => (
            <ProgrammeRail
              href={`/browse?section=type&type=${encodeURIComponent(row.type.slug)}&label=${encodeURIComponent(row.type.name)}`}
              key={row.type.id}
              title={row.type.name}
              titles={demoMode ? makePrototypeTitles(row.titles, allTitles, 30) : uniqueTitles(row.titles).slice(0, 10)}
            />
          ))}
        </section> : null}

        {studiosShowcase}

        <section className={styles.closing}>
          <div className={styles.closingImage}>
            <Visual alt="" src={collections.internationalPrograms[0]?.heroImage ?? collections.thaiPrograms[0]?.heroImage} />
          </div>
          <div className={styles.closingCopy}>
            <span>ดูได้ทุกที่ ทุกเวลา</span>
            <h2>เรื่องดี ๆ<br />อยู่ใกล้กว่าที่คิด</h2>
            <p>เปิดประสบการณ์รับชมที่คัดสรรเพื่อคุณ ทั้งสารคดี ข่าว ละคร และแรงบันดาลใจจากประเทศไทยสู่โลก</p>
            <Link className={styles.darkButton} href="/browse">เริ่มสำรวจ <Arrow /></Link>
          </div>
        </section>
      </main>

      <footer className={styles.footer} inert={searchOpen}>
        <div className={styles.brand}><span className={styles.brandMark}><Image alt="" height={44} src="/LOGO/Logo.png" width={44} /></span><span><b>Thai PBS</b><small>พื้นที่ของทุกคน</small></span></div>
        <p>โทรทัศน์สาธารณะของประเทศไทย<br />เพื่อสังคมที่เข้าใจและเท่าทันโลก</p>
        <div><Link href="/home">หน้าหลักเดิม</Link><Link href="/prototype">Prototype index</Link><span>© 2026 Thai PBS</span></div>
      </footer>

      {searchOpen ? (
        <div className={styles.searchOverlay} role="dialog" aria-modal="true" aria-label="Search programmes" data-prototype-search>
          <div className={styles.searchTop}>
            <label><Search /><input onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหารายการ หรือประเภท..." ref={searchInputRef} value={query} /></label>
            <button onClick={() => setSearchOpen(false)} type="button">ปิด</button>
          </div>
          <div className={styles.searchBody}>
            <p>{query ? `ผลการค้นหา “${query}”` : "รายการแนะนำ"}</p>
            <div>{searchResults.map((title, index) => <SearchResult index={index} key={title.slug} title={title} />)}</div>
            {searchResults.length === 0 ? <strong className={styles.emptySearch}>ไม่พบรายการที่ตรงกับคำค้น</strong> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProgramCard({ feature, title }: { feature?: boolean; title: PrototypeTitle }) {
  return (
    <Link className={`${styles.programCard} ${feature ? styles.programCardFeature : ""}`} href={titleHref(title.prototypeSourceSlug ?? title.slug)}>
      <div><Visual alt="" className={styles.cardImage} src={title.heroImage ?? title.posterImage} /><span className={styles.playBadge}><Play /></span></div>
      <p>{title.genre || title.type}</p>
      <h3>{titleInlineText(title)}</h3>
      <span>{title.year} · {title.duration}</span>
    </Link>
  );
}

function ProgrammeRail({ href, title, titles }: { href: string; title: string; titles: PrototypeTitle[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scroll = (direction: -1 | 1) => railRef.current?.scrollBy({ behavior: "smooth", left: direction * railRef.current.clientWidth * 0.72 });
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const update = () => {
      setCanScrollLeft(rail.scrollLeft > 2);
      setCanScrollRight(rail.scrollLeft < rail.scrollWidth - rail.clientWidth - 2);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(rail);
    rail.addEventListener("scroll", update, { passive: true });
    return () => { observer.disconnect(); rail.removeEventListener("scroll", update); };
  }, [titles.length]);
  if (!titles.length) return null;

  return (
    <section className={styles.railSection}>
      <header>
        <h3>{title}</h3>
        <div className={styles.railActions}>
          <Link href={href}>ดูทั้งหมด</Link>
          <button aria-label={`เลื่อน ${title} ไปทางซ้าย`} disabled={!canScrollLeft} onClick={() => scroll(-1)} type="button"><Arrow direction="left" /></button>
          <button aria-label={`เลื่อน ${title} ไปทางขวา`} disabled={!canScrollRight} onClick={() => scroll(1)} type="button"><Arrow /></button>
        </div>
      </header>
      <div className={styles.programmeRail} ref={railRef}>
        {titles.map((item) => <ProgramCard key={item.prototypeId ?? item.slug} title={item} />)}
      </div>
    </section>
  );
}

function SearchResult({ index, title }: { index: number; title: Title }) {
  return (
    <Link className={styles.searchResult} href={titleHref(title.slug)}>
      <span>{String(index + 1).padStart(2, "0")}</span>
      <div><Visual alt="" src={title.heroImage ?? title.posterImage} /></div>
      <strong>{titleInlineText(title)}</strong>
      <small>{title.genre || title.type}</small>
      <Arrow />
    </Link>
  );
}

function makePrototypeTitles(source: Title[], fallback: Title[], count: number): PrototypeTitle[] {
  const pool = uniqueTitles(source.length ? source : fallback);
  if (!pool.length) return [];

  return Array.from({ length: count }, (_, index) => {
    const title = pool[index % pool.length];
    const edition = String(index + 1).padStart(2, "0");
    return {
      ...title,
      prototypeId: `${title.slug}-prototype-${edition}`,
      prototypeSourceSlug: title.slug,
      title: `${titleInlineText(title)} · ${edition}`,
    };
  });
}

function uniqueTitles(titles: Title[]): Title[] {
  return [...new Map(titles.map((title) => [title.slug, title])).values()];
}

function hasReadableName(value: string): boolean {
  const normalized = value.trim();
  return normalized.length >= 3 && !/^(.)\1{2,}$/u.test(normalized);
}
