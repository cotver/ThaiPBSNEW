/**
 * The site shell's own wrapper classes (AppShell), shared with the places that render a site page outside
 * it — the Studio Lot's list view (/home/studio?view=list) and its modals — so they never drift from it.
 * A plain module, not AppShell itself: a server component importing from a "use client" file gets a
 * client reference, not the string.
 */
export const siteShellClassName = "min-h-screen overflow-x-clip bg-[#030714] text-white";
export const siteContentClassName = "app-shell-content relative pb-20";
