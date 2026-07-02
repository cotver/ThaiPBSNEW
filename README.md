# ThaiPBS Parvilions

A Disney+-inspired multi-page movie streaming UI built with Next.js `16.2.9`, React `19.2.4`, TypeScript, and Tailwind CSS `4`.

The UI uses original artwork and avoids Disney logos, copyrighted character assets, and exact brand media.

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

On Windows PowerShell, if `npm` is blocked by execution policy, use:

```bash
npm.cmd run dev
```

## Checks

```bash
npm run lint
npm run build
```

Use `npm.cmd` for the same commands if PowerShell blocks `npm`.

## Project Notes

- App shell and routed sidebar: `src/components/AppShell.tsx`
- Main route: `src/app/page.tsx`
- Pages: `/search`, `/watchlist`, `/originals`, `/movies`, `/series`, `/title/[slug]`
- Content catalog: `src/lib/content.ts`
- Global styles: `src/app/globals.css`
- Hero art: `public/hero-cinematic.png`
- Agent handoff: `AGENT.md`
