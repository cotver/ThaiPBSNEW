import type { ColumnCategory, ColumnSubcategory } from "../../payload-types";

type PageTaxonomy = ColumnCategory | ColumnSubcategory;

export function visiblePageTaxonomy<T extends PageTaxonomy>(items: (number | T)[] | null | undefined): T[] {
  return (items || [])
    .filter((item): item is T => typeof item === "object" && item.showInPage !== false)
    .sort((a, b) => (a.showInPageSortOrder ?? 0) - (b.showInPageSortOrder ?? 0) || a.id - b.id);
}
