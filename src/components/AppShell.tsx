"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { navItems, type NavItem } from "@/lib/content";
import { siteContentClassName, siteShellClassName } from "@/components/site-shell";

// Keep the Studios top navigation ready for a later switch back.
const ENABLE_STUDIOS_TOP_NAVIGATION = false;
const studiosNavItem: NavItem = { label: "Studios", href: "/home#studios", icon: "news" };
const studiosSectionNavItems: NavItem[] = [
  { label: "Press Releases", href: "/studios/news/press-releases", icon: "news" },
  { label: "Content Distribution", href: "/studios/news/content-distribution", icon: "screen" },
  { label: "Market & Events", href: "/studios/events", icon: "calendar" },
];

export function AppShell({
  children,
  availableStudiosHrefs,
  columnNavItems = [],
  showWatchlist = false,
  typeNavItems = [],
}: {
  children: React.ReactNode;
  availableStudiosHrefs?: string[];
  columnNavItems?: NavItem[];
  showWatchlist?: boolean;
  typeNavItems?: NavItem[];
}) {
  const pathname = usePathname();
  const isPrototype = pathname.startsWith("/prototype");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [studiosMenuOpen, setStudiosMenuOpen] = useState(false);
  const [studiosNavState, setStudiosNavState] = useState({ path: "", fullWidth: false, topNav: false });
  const [studiosMenuShift, setStudiosMenuShift] = useState(0);
  const sidebarRef = useRef<HTMLElement>(null);
  const studiosTriggerRef = useRef<HTMLButtonElement>(null);
  const studiosPanelRef = useRef<HTMLDivElement>(null);
  const studiosNavPhaseRef = useRef({ fullWidth: false, topNav: false });
  const studiosRelatedPage = pathname.startsWith("/studios") || pathname.startsWith("/article");
  const homeStudiosFullWidth = pathname === "/home" && studiosNavState.path === pathname && studiosNavState.fullWidth;
  const homeStudiosTopNav = pathname === "/home" && studiosNavState.path === pathname && studiosNavState.topNav;
  const studiosFullWidth = ENABLE_STUDIOS_TOP_NAVIGATION && (studiosRelatedPage || homeStudiosFullWidth);
  const studiosTopNav = ENABLE_STUDIOS_TOP_NAVIGATION && (studiosRelatedPage || homeStudiosTopNav);
  const appNavItems = [
    ...navItems.filter((item) => showWatchlist || item.href !== "/watchlist"),
    ...(!isPrototype ? [studiosNavItem] : []),
    ...typeNavItems,
  ];
  const studiosMenuItems = [studiosNavItem, ...columnNavItems, ...studiosSectionNavItems]
    .filter((item) => !availableStudiosHrefs || availableStudiosHrefs.includes(item.href));
  const sidebarNavItems = appNavItems.filter((item) => item.href !== studiosNavItem.href || studiosMenuItems.length > 0);
  const mobileNavItems = isPrototype ? appNavItems : [...appNavItems, ...columnNavItems, ...studiosSectionNavItems];
  const isNavItemActive = (item: NavItem) => item.href === studiosNavItem.href
    ? studiosRelatedPage
    : item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

  useEffect(() => {
    const activeElement = document.activeElement;

    if (activeElement instanceof HTMLElement && sidebarRef.current?.contains(activeElement)) {
      activeElement.blur();
    }

  }, [pathname]);

  useLayoutEffect(() => {
    if (!studiosMenuOpen) return;

    const placeMenu = () => {
      const trigger = studiosTriggerRef.current;
      const panel = studiosPanelRef.current;
      if (!trigger || !panel) return;
      // Align with the trigger, nudging up only when the panel would run off-screen.
      const overflow = trigger.getBoundingClientRect().top + panel.offsetHeight - (window.innerHeight - 24);
      setStudiosMenuShift(overflow > 0 ? -overflow : 0);
    };

    placeMenu();
    window.addEventListener("resize", placeMenu);
    return () => window.removeEventListener("resize", placeMenu);
  }, [studiosMenuOpen]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const sidebar = sidebarRef.current;
      const activeElement = document.activeElement;

      if (
        sidebar &&
        activeElement instanceof HTMLElement &&
        sidebar.contains(activeElement) &&
        event.target instanceof Node &&
        !sidebar.contains(event.target)
      ) {
        activeElement.blur();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!ENABLE_STUDIOS_TOP_NAVIGATION || pathname !== "/home") return;

    let entrance: HTMLElement | null = null;
    let sectionDocumentTop = 0;
    let connected = false;

    const updateNavigation = () => {
      if (!entrance) return;
      const current = studiosNavPhaseRef.current;
      // Keep this threshold fixed while the content padding animates.
      const leaveAt = sectionDocumentTop - Math.max(80, window.innerHeight * 0.1);
      const fullWidth = window.scrollY >= (current.fullWidth ? leaveAt : sectionDocumentTop);
      const entranceRect = entrance.getBoundingClientRect();
      const travel = Math.max(1, entranceRect.height - window.innerHeight);
      const doorProgress = Math.min(1, Math.max(0, -entranceRect.top / travel));
      const doorOpenEnd = Number(entrance.dataset.doorOpenEnd || 0.86);
      const topNav = fullWidth && doorProgress >= doorOpenEnd - (current.topNav ? 0.015 : 0);

      if (fullWidth === current.fullWidth && topNav === current.topNav) return;
      if (fullWidth && !current.fullWidth) setSidebarExpanded(false);
      studiosNavPhaseRef.current = { fullWidth, topNav };
      setStudiosNavState({ path: pathname, fullWidth, topNav });
    };

    function connect() {
      if (connected) return;
      const showcase = document.querySelector<HTMLElement>("[data-studios-showcase]");
      const foundEntrance = showcase?.querySelector<HTMLElement>("[data-studios-entrance]");
      if (!showcase || !foundEntrance) return;
      connected = true;
      entrance = foundEntrance;
      sectionDocumentTop = showcase.getBoundingClientRect().top + window.scrollY;
      observer.disconnect();
      updateNavigation();
      window.addEventListener("scroll", updateNavigation, { passive: true });
      window.addEventListener("resize", updateNavigation);
    }

    // The showcase can arrive after the shell when the page streams in.
    const observer = new MutationObserver(connect);
    connect();
    if (!connected) observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateNavigation);
      window.removeEventListener("resize", updateNavigation);
      studiosNavPhaseRef.current = { fullWidth: false, topNav: false };
    };
  }, [pathname]);

  // The Studio Lot (/home/studio: the gallery and its pages) hides this shell
  // with CSS (studio-shell.css), not by path: a page opened over the gallery as a modal changes the path, and
  // swapping the shell here would remount the 3D gallery underneath it.
  if (pathname === "/" || pathname === "/prototype") {
    return <main className="min-h-screen bg-black text-white">{children}</main>;
  }

  return (
    <main data-site-shell={!isPrototype || undefined} data-top-navigation={(ENABLE_STUDIOS_TOP_NAVIGATION && studiosRelatedPage) || undefined} className={siteShellClassName}>
      <nav
        aria-hidden={!studiosTopNav}
        aria-label="Primary navigation"
        inert={!studiosTopNav}
        className={`fixed inset-x-0 top-0 z-40 hidden h-[76px] items-center border-b border-white/10 bg-[#030714]/95 px-5 shadow-lg shadow-black/20 backdrop-blur-xl transition-[opacity,transform] duration-700 ease-out lg:flex ${
          studiosTopNav ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
        }`}
      >
          <Link prefetch={false}
            aria-label="ThaiPBS Studio home"
            className="mr-7 flex shrink-0 items-baseline gap-1.5 whitespace-nowrap leading-none"
            href="/"
          >
            <span className="text-lg font-black text-white">ThaiPBS</span>
            <span className="text-sm font-semibold text-[#ff650f]">Studio</span>
          </Link>
          <div className="flex min-w-0 flex-1 items-center">
            <div className="flex min-w-0 max-w-full items-center gap-1 overflow-x-auto text-[12px] font-black uppercase text-white/52">
              {appNavItems.map((item) => {
                const active = isNavItemActive(item);

                return (
                  <Link prefetch={false}
                    aria-current={active ? "page" : undefined}
                    className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 transition duration-200 hover:bg-white/8 hover:text-white ${active ? "bg-white/10 text-white" : ""}`}
                    href={item.href}
                    key={item.href}
                  >
                    <Icon name={item.icon} active={active} small />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
            {columnNavItems.length ? (
              <div className="group/column relative ml-2 shrink-0 border-l border-white/10 pl-2">
                <button
                  aria-haspopup="true"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-[12px] font-black uppercase text-white/52 transition duration-200 hover:bg-white/8 hover:text-white group-focus-within/column:bg-white/10"
                  type="button"
                >
                  <Icon name="film" small />
                  <span>Column</span>
                  <svg aria-hidden="true" className="size-3 transition-transform duration-200 group-hover/column:rotate-180 group-focus-within/column:rotate-180" fill="none" viewBox="0 0 24 24">
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </button>
                <div className="pointer-events-none absolute left-0 top-full z-50 min-w-56 translate-y-2 rounded-md border border-white/12 bg-[#030714]/98 p-2 opacity-0 shadow-2xl shadow-black/40 backdrop-blur-xl transition-[opacity,transform] duration-200 group-hover/column:pointer-events-auto group-hover/column:translate-y-0 group-hover/column:opacity-100 group-focus-within/column:pointer-events-auto group-focus-within/column:translate-y-0 group-focus-within/column:opacity-100">
                  {columnNavItems.map((item) => {
                    const active = pathname.startsWith(item.href);

                    return (
                      <Link prefetch={false}
                        aria-current={active ? "page" : undefined}
                        className={`block rounded px-3 py-2 text-[11px] font-black uppercase transition hover:bg-white/10 hover:text-white ${active ? "bg-white/10 text-white" : "text-white/68"}`}
                        href={item.href}
                        key={item.href}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </nav>

      <aside
        aria-hidden={studiosFullWidth}
        className={`disney-sidebar fixed left-0 top-0 z-40 hidden h-screen flex-col bg-gradient-to-r from-[#030714] via-[#030714]/98 to-transparent py-7 transition-[width,opacity,transform] duration-500 ease-in-out lg:flex ${
          sidebarExpanded ? "w-[292px]" : "w-[92px]"
        } ${studiosFullWidth ? "pointer-events-none -translate-x-full opacity-0" : "translate-x-0 opacity-100"}`}
        inert={studiosFullWidth}
        onPointerLeave={() => { setSidebarExpanded(false); setStudiosMenuOpen(false); }}
        ref={sidebarRef}
      >
          {/* Two lines to fit the collapsed sidebar, centred where the icons sit below. */}
          <Link prefetch={false}
            aria-label="ThaiPBS Studio home"
            className="ml-3 flex w-16 shrink-0 flex-col items-center justify-start text-center leading-none"
            href="/"
            onClick={(event) => { event.currentTarget.blur(); setSidebarExpanded(false); }}
          >
            <span className="whitespace-nowrap text-[13px] font-black tracking-tight text-white">ThaiPBS</span>
            <span className="mt-1 whitespace-nowrap text-[11px] font-semibold tracking-[0.08em] text-[#ff650f]">Studio</span>
          </Link>
          <nav aria-label="Primary navigation" className="absolute inset-y-0 left-5 my-auto flex h-fit min-h-0 flex-col gap-[18px] text-[12px] font-black uppercase text-white/46">
            {sidebarNavItems.map((item) => {
              const active = isNavItemActive(item);

              if (item.href === studiosNavItem.href) {
                return (
                  <div
                    className="relative"
                    key={item.href}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget)) setStudiosMenuOpen(false);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") setStudiosMenuOpen(false);
                    }}
                    onPointerEnter={() => { setSidebarExpanded(true); setStudiosMenuOpen(true); }}
                    onPointerLeave={() => setStudiosMenuOpen(false)}
                  >
                    <button
                      aria-controls="desktop-studios-navigation"
                      aria-expanded={studiosMenuOpen}
                      aria-label="Studios navigation"
                      className={`relative z-20 flex h-10 items-center gap-7 whitespace-nowrap rounded-l-xl transition-[background-color,color] duration-200 hover:text-white ${sidebarExpanded ? "w-[248px]" : "w-12 overflow-hidden"} ${studiosMenuOpen ? "bg-[#0c1428] text-white" : ""} ${active ? "text-white" : ""}`}
                      onClick={() => setStudiosMenuOpen((open) => !open)}
                      onFocus={() => setSidebarExpanded(true)}
                      ref={studiosTriggerRef}
                      type="button"
                    >
                      <span className="flex h-10 w-12 shrink-0 items-center justify-center"><Icon name={item.icon} active={active} /></span>
                      <span className="disney-nav-label flex flex-1 items-center justify-between pr-4 opacity-0 transition duration-300">
                        Studios
                        <span aria-hidden="true" className={`transition-transform duration-200 ${studiosMenuOpen ? "translate-x-1" : ""}`}>›</span>
                      </span>
                    </button>
                    <div
                      aria-hidden={!studiosMenuOpen}
                      className={`absolute left-full top-0 z-10 transition-[opacity,transform] duration-200 ease-out ${
                        studiosMenuOpen ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-2 opacity-0"
                      }`}
                      id="desktop-studios-navigation"
                      inert={!studiosMenuOpen}
                      // Sits flush against the trigger so the two read as one surface.
                      style={{ marginTop: studiosMenuShift }}
                    >
                      <div
                        aria-label="Studios sections and categories"
                        className={`grid max-h-[calc(100dvh-48px)] max-w-[calc(100vw-320px)] grid-flow-col gap-1 rounded-xl bg-[#0c1428] p-2 shadow-2xl shadow-black/50 ${studiosMenuShift ? "" : "rounded-tl-none"}`}
                        ref={studiosPanelRef}
                        style={{ gridTemplateRows: `repeat(${Math.min(8, studiosMenuItems.length)}, minmax(0, 1fr))` }}
                      >
                        {studiosMenuItems.map((studioItem) => (
                          <Link prefetch={false}
                            aria-current={isNavItemActive(studioItem) ? "page" : undefined}
                            className={`flex min-w-40 max-w-60 items-center gap-3 rounded-md px-3 py-2 text-[11px] transition hover:bg-white/10 hover:text-white ${isNavItemActive(studioItem) ? "text-white" : "text-white/60"}`}
                            href={studioItem.href}
                            key={studioItem.href}
                            onClick={(event) => { event.currentTarget.blur(); setStudiosMenuOpen(false); setSidebarExpanded(false); }}
                          >
                            <Icon name={studioItem.icon} small />
                            {studioItem.href === studiosNavItem.href ? "Studios Overview" : studioItem.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link prefetch={false}
                  aria-current={active ? "page" : undefined}
                  className={`group/item flex h-10 items-center gap-7 whitespace-nowrap transition duration-200 hover:text-white ${
                    sidebarExpanded ? "w-[248px] overflow-visible" : "w-12 overflow-hidden"
                  } ${
                    active ? "text-white" : ""
                  }`}
                  href={item.href}
                  key={item.href}
                  onClick={(event) => { event.currentTarget.blur(); setSidebarExpanded(false); }}
                  onFocus={() => setSidebarExpanded(true)}
                >
                  <span
                    className="flex h-10 w-12 shrink-0 items-center justify-center"
                    onPointerEnter={() => setSidebarExpanded(true)}
                  >
                    <Icon name={item.icon} active={active} />
                  </span>
                  <span className="disney-nav-label block min-w-max translate-x-2 opacity-0 transition duration-300">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

      <div className={`${siteContentClassName} transition-[padding-left] duration-700 ease-in-out ${studiosFullWidth ? "lg:pl-0" : "lg:pl-[92px]"}`}>{children}</div>

      <nav
        aria-label="Mobile navigation"
        data-mobile-navigation={!isPrototype || undefined}
        className="fixed inset-x-0 bottom-0 z-40 grid h-16 border-t border-white/10 bg-[#030714]/95 px-1 backdrop-blur-xl lg:hidden"
        style={{ gridTemplateColumns: `repeat(${mobileNavItems.length}, minmax(0, 1fr))` }}
      >
        {mobileNavItems.map((item) => {
          const active = isNavItemActive(item);

          return (
            <Link prefetch={false}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase ${
                active ? "text-white" : "text-white/48"
              }`}
              href={item.href}
              key={item.href}
            >
              <Icon name={item.icon} active={active} small />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </main>
  );
}

/** The site navigation's icons; the Studio Lot's header uses the same ones (LotHeader). */
export function Icon({
  active,
  name,
  small,
}: {
  active?: boolean;
  name: string;
  small?: boolean;
}) {
  const size = small ? "size-4" : "size-[22px]";
  const stroke = active ? "stroke-white" : "stroke-current";

  return (
    <svg
      aria-hidden="true"
      className={`${size} shrink-0 ${stroke}`}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {name === "home" && <path d="M4 10.5 12 4l8 6.5V20H6v-7h12" />}
      {name === "search" && <path d="m20 20-4.6-4.6M10.8 17a6.2 6.2 0 1 1 0-12.4 6.2 6.2 0 0 1 0 12.4Z" />}
      {name === "plus" && <path d="M12 5v14M5 12h14" />}
      {name === "spark" && <path d="M12 3l1.9 5.4L20 10l-6.1 1.6L12 17l-1.9-5.4L4 10l6.1-1.6L12 3ZM18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8L18 16Z" />}
      {name === "film" && <path d="M5 4h14v16H5V4ZM8 4v16M16 4v16M5 8h3M5 16h3M16 8h3M16 16h3" />}
      {name === "screen" && <path d="M4 6h16v10H4V6ZM9 20h6M12 16v4" />}
      {name === "news" && <path d="M5 5h14v14H5V5ZM8 9h8M8 13h8M8 17h5" />}
      {name === "calendar" && <path d="M5 6h14v14H5V6ZM8 3v6M16 3v6M5 11h14M8 15h2M14 15h2" />}
      {name === "music" && <path d="M9 18V6l10-2v12M9 18a3 3 0 1 1-2-2.83M19 16a3 3 0 1 1-2-2.83" />}
      {name === "food" && <path d="M7 4v7M4 4v7a3 3 0 0 0 6 0V4M7 14v6M17 4v16M14 4h6" />}
      {name === "travel" && <path d="M4 16 20 8M7 7l10 10M9 5l2 12M13 7l4 8" />}
      {name === "kids" && <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 20a4 4 0 0 1 8 0M12 20a4 4 0 0 1 8 0" />}
      {name === "education" && <path d="m3 8 9-4 9 4-9 4-9-4ZM6 10v5c2 2 10 2 12 0v-5M21 8v6" />}
    </svg>
  );
}
