"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navItems, type NavItem } from "@/lib/content";

export function AppShell({
  children,
  columnNavItems = [],
  showWatchlist = false,
  typeNavItems = [],
}: {
  children: React.ReactNode;
  columnNavItems?: NavItem[];
  showWatchlist?: boolean;
  typeNavItems?: NavItem[];
}) {
  const pathname = usePathname();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [studiosNavState, setStudiosNavState] = useState({ path: "", fullWidth: false, topNav: false });
  const sidebarRef = useRef<HTMLElement>(null);
  const studiosNavPhaseRef = useRef({ fullWidth: false, topNav: false });
  const studiosFullWidth = pathname === "/home" && studiosNavState.path === pathname && studiosNavState.fullWidth;
  const studiosTopNav = pathname === "/home" && studiosNavState.path === pathname && studiosNavState.topNav;
  const appNavItems = [
    ...navItems.filter((item) => showWatchlist || item.href !== "/watchlist"),
    ...typeNavItems,
  ];

  useEffect(() => {
    const activeElement = document.activeElement;

    if (activeElement instanceof HTMLElement && sidebarRef.current?.contains(activeElement)) {
      activeElement.blur();
    }

  }, [pathname]);

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
    if (pathname !== "/home") return;

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

  if (pathname === "/" || pathname === "/prototype") {
    return <main className="min-h-screen bg-black text-white">{children}</main>;
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-[#030714] text-white">
      <nav
        aria-hidden={!studiosTopNav}
        aria-label="Primary navigation"
        inert={!studiosTopNav}
        className={`fixed inset-x-0 top-0 z-40 hidden h-[76px] items-center border-b border-white/10 bg-[#030714]/95 px-5 shadow-lg shadow-black/20 backdrop-blur-xl transition-[opacity,transform] duration-700 ease-out lg:flex ${
          studiosTopNav ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
        }`}
      >
          <Link
            aria-label="ThaiPBS Parvilions home"
            className="mr-7 flex h-12 w-12 shrink-0 items-center justify-center"
            href="/"
          >
            <Image alt="ThaiPBS Parvilions" className="h-11 w-11 object-contain" height={48} priority src="/LOGO/Logo.png" width={48} />
          </Link>
          <div className="flex min-w-0 flex-1 items-center">
            <div className="flex min-w-0 max-w-full items-center gap-1 overflow-x-auto text-[12px] font-black uppercase text-white/52">
              {appNavItems.map((item) => {
                const active = item.href !== "/" && pathname.startsWith(item.href);

                return (
                  <Link
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
                      <Link
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
        onPointerLeave={() => setSidebarExpanded(false)}
        ref={sidebarRef}
      >
          <Link
            aria-label="ThaiPBS Parvilions home"
            className="ml-5 flex w-12 shrink-0 flex-col items-center justify-start"
            href="/"
            onClick={(event) => { event.currentTarget.blur(); setSidebarExpanded(false); }}
          >
            <Image
              alt="ThaiPBS Parvilions"
              className="h-12 w-12 object-contain"
              height={48}
              priority
              src="/LOGO/Logo.png"
              width={48}
            />
            <span aria-hidden className="relative -mt-1 block h-[15px] w-16 overflow-hidden">
              <Image
                alt=""
                className="absolute left-0 top-0 h-16 w-16 max-w-none -translate-y-[25px] object-contain"
                height={1772}
                priority
                src="/LOGO/tagline.png"
                width={1772}
              />
            </span>
          </Link>
          <nav className="absolute left-5 top-1/2 flex -translate-y-1/2 flex-col gap-6 text-[12px] font-black uppercase text-white/46">
            {appNavItems.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <Link
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

      <div className={`app-shell-content relative pb-20 transition-[padding-left] duration-700 ease-in-out ${studiosFullWidth ? "lg:pl-0" : "lg:pl-[92px]"}`}>{children}</div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid h-16 border-t border-white/10 bg-[#030714]/95 px-1 backdrop-blur-xl lg:hidden"
        style={{ gridTemplateColumns: `repeat(${appNavItems.length}, minmax(0, 1fr))` }}
      >
        {appNavItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
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

function Icon({
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
      {name === "music" && <path d="M9 18V6l10-2v12M9 18a3 3 0 1 1-2-2.83M19 16a3 3 0 1 1-2-2.83" />}
      {name === "food" && <path d="M7 4v7M4 4v7a3 3 0 0 0 6 0V4M7 14v6M17 4v16M14 4h6" />}
      {name === "travel" && <path d="M4 16 20 8M7 7l10 10M9 5l2 12M13 7l4 8" />}
      {name === "kids" && <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 20a4 4 0 0 1 8 0M12 20a4 4 0 0 1 8 0" />}
      {name === "education" && <path d="m3 8 9-4 9 4-9 4-9-4ZM6 10v5c2 2 10 2 12 0v-5M21 8v6" />}
    </svg>
  );
}
