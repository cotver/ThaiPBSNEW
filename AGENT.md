# Agent Handoff

## Project Snapshot

- App: Disney+-inspired multi-page streaming UI named `Stream+`.
- Stack: Next.js `16.2.9`, React `19.2.4`, TypeScript, Tailwind CSS `4`.
- Routing: App Router under `src/app`.
- App shell: `src/components/AppShell.tsx`.
- Homepage hero carousel: `src/components/HeroCarousel.tsx`.
- Horizontal content rows: `src/components/ContentRow.tsx`.
- Primary routes: `/`, `/search`, `/watchlist`, `/originals`, `/movies`, `/series`, `/title/[slug]`.
- Content catalog: `src/lib/content.ts`.
- Global styles: `src/app/globals.css`.
- Project hero asset: `public/hero-cinematic.png`, generated as original artwork for this repo.
- Fonts: system font stack only, so production builds do not need to fetch Google Fonts.

## Important Next.js 16 Note

Read the local Next.js docs in `node_modules/next/dist/docs/` before changing framework-specific code. This scaffold includes the generated `AGENTS.md` warning because Next.js 16 has breaking changes compared with many older examples.

Useful local docs:

- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md`

## Commands

```bash
npm run dev
npm run lint
npm run build
```

On Windows PowerShell, if `npm` is blocked by execution policy, use `npm.cmd`:

```bash
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
```

## Design Direction

- Keep the UI streaming-service inspired, but do not use Disney logos, copyrighted character art, or exact brand assets.
- Use original or licensed imagery only.
- Keep cards at `8px` radius or less.
- Preserve responsive behavior for mobile, tablet, and desktop.
- Avoid marketing-page copy; this should feel like the usable app home screen.

## Current Limitations

- Content data is static in `src/lib/content.ts`.
- Poster cards are CSS-generated art rather than individual image files.
- Sidebar and mobile navigation are routed and active-state aware.
- Homepage hero loops automatically and supports dot navigation.
- Content row arrow buttons scroll their own horizontal rails.
- Search filters the local catalog client-side.
- Playback, auth, and persistent watchlist state are not wired yet.
