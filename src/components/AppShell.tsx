"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navItems, type NavItem } from "@/lib/content";

export function AppShell({
  children,
  typeNavItems = [],
}: {
  children: React.ReactNode;
  typeNavItems?: NavItem[];
}) {
  const pathname = usePathname();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const appNavItems = [...navItems, ...typeNavItems];

  useEffect(() => {
    const activeElement = document.activeElement;

    if (activeElement instanceof HTMLElement && sidebarRef.current?.contains(activeElement)) {
      activeElement.blur();
    }

    setSidebarExpanded(false);
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

  if (pathname === "/") {
    return <main className="min-h-screen bg-black text-white">{children}</main>;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#030714] text-white">
      <aside
        className={`disney-sidebar fixed left-0 top-0 z-40 hidden h-screen flex-col bg-gradient-to-r from-[#030714] via-[#030714]/98 to-transparent py-7 lg:flex ${
          sidebarExpanded ? "w-[292px]" : "w-[92px]"
        }`}
        onPointerLeave={() => setSidebarExpanded(false)}
        ref={sidebarRef}
      >
        <Link
          aria-label="ThaiPBS Parvilions home"
          className="ml-5 flex w-12 shrink-0 flex-col items-center justify-start"
          href="/"
          onClick={(event) => event.currentTarget.blur()}
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
                onClick={(event) => event.currentTarget.blur()}
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

      <div className="relative pb-20 lg:pl-[92px]">{children}</div>

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
