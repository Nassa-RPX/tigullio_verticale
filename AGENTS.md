# AGENTS

## Project Reality (Verified)
- Astro 5 static site (not SSR) with `@astrojs/db` enabled in `astro.config.mjs`.
- Main runtime data comes from Astro DB tables in `db/config.ts` (`Program`, `Date`, `Event`, `Speaker`).
- Long-form text is Markdown content collections in `src/content/appuntamenti/*.md` (`date`) and `src/content/eventi/*.md` (`event`) defined in `src/content/config.ts`.
- Program/date/event pages depend on slug alignment between DB rows and Markdown entry ids (`getEntry("date", date.slug)` and `getEntry("event", slug)`).

## Commands You Should Actually Use
- Install deps: `npm install`.
- Dev server: `npm run dev`.
- Production build: `npm run build`.
- Preview build output: `npm run preview`.
- DB push (remote): `npm run db:push`.
- DB seed (remote): `npm run db:seed`.

## Important Gotchas
- `npm run build` currently fails in client build because `src/scripts/home/animations.ts` imports `reverseTigullioTimelineForMobile` from `src/scripts/layouts.scripts.ts`, but that export is missing.
- Build also warns about a CSS typo `wihth` in `src/pages/index.astro`.
- Newsletter submit calls Kit API directly from browser in `src/scripts/newsletter.script.ts` and expects `import.meta.env.PUBLIC_KIT_API`; without it, the request auth header is empty.
- `db:push` and `db:seed` scripts use `--remote`; avoid running them casually because they target remote DB.

## High-Value File Map
- `src/layouts/Layout.astro`: global shell; imports all global styles and common scripts.
- `src/pages/index.astro`: home entrypoint and GSAP-triggered navigation.
- `src/pages/programma/index.astro`: archive page listing available program years from DB.
- `src/pages/programma/[year]/index.astro`: static paths generated from `Program` DB rows.
- `src/pages/programma/[year]/[slug]/index.astro`: date detail page; joins DB tables and renders markdown + event cards.
- `db/seed.ts`: canonical seed data and expected slugs/years.

## Conventions That Matter Here
- Path alias `@/*` -> `src/*` is enabled in `tsconfig.json`; existing code uses it heavily.
- Theme/fonts/colors are centralized in `src/styles/theme.css`; global reset/typography in `src/styles/global.css`.
- Page transitions and interactions rely on GSAP scripts in `src/scripts/**`; preserve CSS selectors/classes used by those scripts when editing markup.
