# AGENTS

## Project Reality (Verified)

- Astro 5 static site (not SSR) with Sanity CMS as the content backend.
- Main runtime data comes from Sanity documents (`program`, `date`, `event`).
- Long-form text is stored as Sanity Portable Text on `date.body` and `event.body`.
- Program/date/event pages fetch data at build time via `@sanity/client` from `src/lib/sanity.ts`.

## Commands You Should Actually Use

- Install deps: `npm install`.
- Dev server: `npm run dev`.
- Production build: `npm run build`.
- Preview build output: `npm run preview`.
- Sanity Studio (local): `npm run sanity:dev`.
- Sanity Studio (deploy): `npm run sanity:deploy`.

## Important Gotchas

- Newsletter submit calls Kit API directly from browser in `src/scripts/newsletter.script.ts` and expects `import.meta.env.PUBLIC_KIT_API`; without it, the request auth header is empty.

## High-Value File Map

- `src/layouts/Layout.astro`: global shell; imports all global styles and common scripts.
- `src/pages/index.astro`: home entrypoint and GSAP-triggered navigation.
- `src/pages/programma/index.astro`: archive page listing available program years from Sanity.
- `src/pages/programma/[year]/index.astro`: static paths generated from `program` Sanity documents.
- `src/pages/programma/[year]/[slug]/index.astro`: date detail page; fetches date + events from Sanity and renders Portable Text.
- `src/lib/sanity.ts`: shared Sanity client and document TypeScript interfaces.
- `sanity.config.ts`: Sanity Studio configuration.
- `sanity/schemaTypes/*.ts`: Sanity content schemas (`program`, `date`, `event`).

## Conventions That Matter Here

- Path alias `@/*` -> `src/*` is enabled in `tsconfig.json`; existing code uses it heavily.
- Theme/fonts/colors are centralized in `src/styles/theme.css`; global reset/typography in `src/styles/global.css`.
- Page transitions and interactions rely on GSAP scripts in `src/scripts/**`; preserve CSS selectors/classes used by those scripts when editing markup.
