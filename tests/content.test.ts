import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateContent, type DateDoc } from '../src/lib/content';
import { sanityEnvironment } from '../config/environment.mjs';
const programs = [{ _id: 'p25', year: 2025 }, { _id: 'p26', year: 2026 }];
const date = (year: number, slug: string): DateDoc => ({ _id: String(year), year, programId: year === 2025 ? 'p25' : 'p26', date: `${year}-10-01`, slug, title: 'Title', location: 'Place', events: [] });
test('matching slugs in separate years are valid; duplicate routes and bad references fail', () => {
  validateContent(programs, [date(2025, 'same'), date(2026, 'same')]);
  assert.throws(() => validateContent(programs, [date(2026, 'same'), date(2026, 'same')]), /duplicate route/);
  assert.throws(() => validateContent(programs, [{ ...date(2026, 'a'), programId: 'missing' }]), /Invalid reference/);
  assert.throws(() => validateContent(programs, [{ ...date(2026, 'a'), date: '2026-02-30' }]), /Invalid reference/);
});
test('development and preview refuse production or mismatched Studio configuration', () => {
  const env = { PUBLIC_SANITY_PROJECT_ID: '879g27iz', PUBLIC_SANITY_DATASET: 'staging', SANITY_STUDIO_DATASET: 'staging' };
  assert.equal(sanityEnvironment(env).dataset, 'staging');
  assert.throws(() => sanityEnvironment({ ...env, SANITY_STUDIO_DATASET: 'test2' }), /disagree/);
  assert.throws(() => sanityEnvironment({ PUBLIC_SANITY_PROJECT_ID: '879g27iz', PUBLIC_SANITY_DATASET: 'test2', VERCEL_ENV: 'preview' }), /must use staging/);
  assert.equal(sanityEnvironment({ PUBLIC_SANITY_PROJECT_ID: '879g27iz', PUBLIC_SANITY_DATASET: 'test2', VERCEL_ENV: 'production' }).production, true);
  assert.equal(sanityEnvironment({ SANITY_STUDIO_PROJECT_ID: '879g27iz', SANITY_STUDIO_DATASET: 'test2', SANITY_STUDIO_TV_ENV: 'production' }).dataset, 'test2');
});
