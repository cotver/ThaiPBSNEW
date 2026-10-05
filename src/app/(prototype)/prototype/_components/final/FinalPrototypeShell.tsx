"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { NavItem } from "@/lib/content";

const primaryItems: NavItem[] = [
  { href: "/prototype/final", icon: "home", label: "Home" },
  { href: "/search", icon: "search", label: "Search" },
  { href: "/watchlist", icon: "plus", label: "Watchlist" },
];

export function FinalPrototypeShell({
  children,
  typeNavItems = [],
}: {
  children: React.ReactNode;
  typeNavItems?: NavItem[];
}) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const items = [...primaryItems, ...typeNavItems];

  useEffect(() => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && sidebarRef.current?.contains(activeElement)) {
      activeElement.blur();
    }
  }, [pathname]);

  return (
    <div className="final-shell">
      <aside
        className="final-shell__sidebar"
        data-expanded={expanded}
        onPointerLeave={() => setExpanded(false)}
        ref={sidebarRef}
      >
        <Link
          aria-label="Final Thai PBS prototype home"
          className="final-shell__brand"
          href="/prototype/final"
          onClick={() => setExpanded(false)}
        >
          <Image alt="Thai PBS" height={48} loading="eager" src="/LOGO/Logo.png" width={48} />
          <span aria-hidden="true">
            <Image alt="" height={1772} loading="eager" src="/LOGO/tagline.png" width={1772} />
          </span>
        </Link>

        <nav className="final-shell__desktop-nav" aria-label="Prototype navigation">
          {items.map((item) => {
            const active = item.href === "/prototype/final"
              ? pathname === "/prototype/final"
              : pathname.startsWith(item.href);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                data-active={active}
                href={item.href}
                key={item.href}
                onClick={() => setExpanded(false)}
                onFocus={() => setExpanded(true)}
              >
                <span onPointerEnter={() => setExpanded(true)}>
                  <FinalShellIcon active={active} name={item.icon} />
                </span>
                <strong>{item.label}</strong>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="final-shell__content">{children}</div>

      <nav
        aria-label="Prototype mobile navigation"
        className="final-shell__mobile-nav"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active = item.href === "/prototype/final"
            ? pathname === "/prototype/final"
            : pathname.startsWith(item.href);

          return (
            <Link aria-current={active ? "page" : undefined} data-active={active} href={item.href} key={item.href}>
              <FinalShellIcon active={active} name={item.icon} small />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function FinalShellIcon({ active, name, small = false }: { active?: boolean; name: string; small?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={small ? "final-shell-icon final-shell-icon--small" : "final-shell-icon"}
      fill="none"
      stroke={active ? "white" : "currentColor"}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {name === "home" && <path d="M4 10.5 12 4l8 6.5V20H6v-7h12" />}
      {name === "search" && <path d="m20 20-4.6-4.6M10.8 17a6.2 6.2 0 1 1 0-12.4 6.2 6.2 0 0 1 0 12.4Z" />}
      {name === "plus" && <path d="M12 5v14M5 12h14" />}
      {name === "spark" && <path d="M12 3l1.9 5.4L20 10l-6.1 1.6L12 17l-1.9-5.4L4 10l6.1-1.6L12 3Z" />}
      {name === "film" && <path d="M5 4h14v16H5V4ZM8 4v16M16 4v16M5 8h3M16 8h3" />}
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
