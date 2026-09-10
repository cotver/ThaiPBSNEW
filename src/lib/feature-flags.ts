function isEnabled(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

export function hiddenCatalogSectionsEnabled() {
  return isEnabled(process.env.SHOW_HIDDEN_CATALOG_SECTIONS);
}

export function watchlistNavigationEnabled() {
  return isEnabled(process.env.SHOW_WATCHLIST_NAVIGATION);
}
