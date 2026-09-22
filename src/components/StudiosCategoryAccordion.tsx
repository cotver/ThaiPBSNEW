"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import styles from "./StudiosCategoryAccordion.module.css";

type Category = {
  id: number;
  name: string;
  slug: string;
  coverAlt: string;
  coverImageUrl?: string;
};

const panelsPerRow = 5;

function AccordionRow({ categories }: { categories: Category[] }) {
  const [active, setActive] = useState(Math.floor(categories.length / 2));
  const links = useRef<(HTMLAnchorElement | null)[]>([]);
  const openingTap = useRef<number | null>(null);
  const expandedGrow = categories.length > 1
    ? (0.52 * (categories.length - 1)) / 0.48
    : 1;

  return (
    <div className={styles.gallery}>
      {categories.map((category, index) => {
        const isActive = index === active;

        return (
          <Link
            aria-label={`Explore ${category.name}`}
            className={`${styles.panel} ${isActive ? styles.active : ""}`}
            href={`/studios/${encodeURIComponent(category.slug)}`}
            key={category.id}
            onClick={(event) => {
              if (openingTap.current === index) {
                openingTap.current = null;
                event.preventDefault();
              } else if (window.matchMedia("(hover: none)").matches && !isActive) {
                event.preventDefault();
                setActive(index);
              }
            }}
            onFocus={() => setActive(index)}
            onKeyDown={(event) => {
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
              event.preventDefault();
              const next = (index + (event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1) + categories.length) % categories.length;
              links.current[next]?.focus();
            }}
            onMouseEnter={() => setActive(index)}
            onPointerDown={(event) => {
              if (event.pointerType !== "mouse" && !isActive) {
                openingTap.current = index;
                setActive(index);
              }
            }}
            ref={(element) => { links.current[index] = element; }}
            style={{ flexGrow: isActive ? expandedGrow : 1 }}
          >
            <span className={styles.media}>
              {category.coverImageUrl ? (
                <Image
                  alt={category.coverAlt}
                  fill
                  sizes="(max-width: 520px) 100vw, (max-width: 1100px) 52vw, 52vw"
                  src={category.coverImageUrl}
                />
              ) : null}
            </span>
            <span aria-hidden="true" className={styles.shade} />
            <span className={styles.label}>
              <span aria-hidden="true" className={styles.bar} />
              <span className={styles.name}>{category.name}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function StudiosCategoryAccordion({ categories }: { categories: Category[] }) {
  const rowCount = Math.ceil(categories.length / panelsPerRow);
  const rows = Array.from({ length: rowCount }, (_, row) => {
    const baseSize = Math.floor(categories.length / rowCount);
    const start = row * baseSize + Math.min(row, categories.length % rowCount);
    const size = baseSize + (row < categories.length % rowCount ? 1 : 0);
    return categories.slice(start, start + size);
  });

  return (
    <div className={styles.rows}>
      {rows.map((row) => (
        <AccordionRow
          categories={row}
          key={row[0].id}
        />
      ))}
    </div>
  );
}
