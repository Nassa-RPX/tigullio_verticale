# Redesign development and release

> The structural Program → Event migration supersedes the additive-schema instructions below. Current operations are documented in `docs/content-migration-runbook.md` and `docs/sanity-staging-migration-plan.md`. Keep production dataset `test2` untouched until the user explicitly requests its migration. The earlier initial-copy counts and compatibility results below describe the pre-migration baseline.

The staging migration completed on 2026-10-01 (`staging-v2-public`): 2 programs, 11 published events, 15 people, 1 preserved event draft, and 1 migration-state document. See [the execution report](sanity-staging-migration-report.md). No production reads, mutations or hosted deployments were performed for this migration.

The local website and Studio use project `879g27iz`, dataset `staging`. The live dataset is `test2`. The initial copy contains 2 programs, 9 appointments (`appuntamento`), and 12 activities (`event`), with unchanged IDs, references and Portable Text. A website-content backup was exported to `C:/Users/cgiov/Downloads/tv-test2-content-2026-10-01.tar.gz`.

## Local commands

- `npm run dev`: staging website.
- The development server refreshes Sanity content on the next request once its five-second cache expires. Static builds keep one consistent content snapshot. If a server was started before a schema migration, restart it on `localhost:4321`; `astro preview` serves the last build separately.
- `npm run build` and `npm run preview`: staging build and preview; newsletter submissions are mocked.
- `npm run sanity:dev`: local Studio labelled **Tigullio Verticale — Staging**.
- `npm test`: calendar, content integrity, environment and newsletter tests.
- `node scripts/seed-staging.mjs`: guarded seed. It reads `test2`, writes only `staging`, never replaces existing documents, and refuses staging content that differs from production. It uses `SANITY_AUTH_TOKEN` or a temporary editor token for import, or the CLI's authenticated session. Do not commit tokens.

The bootstrap compares canonical content, ignoring only Sanity revision and creation/update timestamps. It does not overwrite backups. When content already matches it performs no import. Keep backups outside Git.

Local `.env` sets `PUBLIC_SANITY_DATASET=staging` and `SANITY_STUDIO_DATASET=staging`. Frontend, Studio and CLI must agree on the project/dataset. Builds use `SANITY_READ_TOKEN` if provided; public datasets can be read without a token. `SANITY_EDITOR_TOKEN` is never used by website builds.

## Editing the optional fields

The `program` schema is unchanged. Both appointments and activities support:

- **Sottotitolo**: short introductory text.
- **Conducono**: one name and role per list entry.
- **Collaborazioni**: collaborators and acknowledgements.
- **Informazioni pratiche**: meeting point, distance, elevation, difficulty, duration, equipment and booking text. All fields accept descriptive wording.

Enter shared details on the appointment. Enter activity-specific details on that activity's event document. The website displays separately titled practical panels for activities and does not combine values. Keep narrative descriptions in existing Portable Text bodies. Existing activity description visibility and required-booking flags remain effective. Empty optional sections are omitted.

No automatic body extraction or content enrichment has been applied. A Studio schema edit itself does not rewrite documents. Do not rename existing document types, change IDs/slugs or remove reference fields.

## Preview hosting

Configure the hosting provider's **Preview** environment:

```dotenv
PUBLIC_SANITY_PROJECT_ID=879g27iz
PUBLIC_SANITY_DATASET=staging
SANITY_STUDIO_PROJECT_ID=879g27iz
SANITY_STUDIO_DATASET=staging
PUBLIC_KIT_SUBMIT_MODE=mock
```

For non-Vercel previews use `TV_ENV=staging`; Vercel previews are detected from `VERCEL_ENV`. Production hosting keeps both dataset values at `test2`, with `TV_ENV=production` on non-Vercel hosts. Production defaults to live Kit submission and requires `PUBLIC_KIT_API`. The current direct-browser integration intentionally retains a browser-visible Kit key.

Development and previews never call Kit. `?newsletter-test=error` and `?newsletter-test=network` simulate recoverable errors. Success explicitly states that no subscription was sent. A deliberate live test outside production requires `PUBLIC_KIT_SUBMIT_MODE=live` and `TV_ALLOW_LIVE_KIT_TEST=true`; use a designated test address.

## Compatibility check and launch

1. Keep production authoritative. Confirm its actual hosting project and environment variables before release.
2. Build against current production with read-only access: temporarily set `TV_ENV=production-readonly`, both dataset variables to `test2`, and `PUBLIC_KIT_SUBMIT_MODE=mock` in the command environment, then run `npm run build -- --outDir .qa/production-compat`. Keep local `.env` on staging.
3. Confirm generated routes, existing bodies and all child activities. Missing optional fields must not block rendering.
4. Replace the exposed Sanity editor token in all consumers before revoking it through Sanity Manage. Local builds already omit it. Administrator access and production hosting configuration are needed for coordinated rotation.
5. Review the preview and run a controlled Kit test after credentials are configured. Retain the previous frontend deployment for rollback.
6. Deploy the compatible frontend, then deploy the optional Studio schema. Studio deployment requires production environment settings and `TV_ALLOW_STUDIO_DEPLOY=true`; the development command is guarded.
7. Editors can gradually populate optional fields in production. Content publication requires a website rebuild. Verify any existing production deployment webhook excludes `staging`.

Never import staging over production at launch. Never refresh staging with replacement flags after enrichment: preserve the staging work first and review any intended merge separately.

## Verification artifacts

Browser QA screenshots and reports are stored locally in ignored `.qa/`. The viewport matrix is 360, 390, 430, 600, 820, 1024, 1366, 1440 and 1920 pixels, in both themes. Checks include content without JavaScript, drawer focus and isolation, form success/errors without live Kit calls, and layout geometry against the prototype. Reference markup remains in `tv-clone`.

The staging and read-only production compatibility builds both generated 16 pages. Ten automated tests, TypeScript checking, local Studio schema extraction, and 180 browser route/theme/viewport checks passed. Hosting preview variables, production token rotation and a controlled live Kit submission remain release prerequisites.
