import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSignup, subscribe } from '../src/lib/newsletter';
test('compact and full signup have different name/consent requirements', () => {
  assert.deepEqual(validateSignup({ email: 'user@example.com' }, false, false), { email: '', name: '', consent: '' });
  const errors = validateSignup({ email: 'bad', name: 'A' }, true, false);
  assert.ok(errors.email && errors.name && errors.consent);
});
test('compact live submission omits first_name and only accepts successful responses', async () => {
  let payload: any;
  const fetcher = (async (url, options) => { assert.equal(url, 'https://api.kit.com/v4/subscribers'); payload = JSON.parse(options!.body as string); return new Response('{}', { status: 201 }); }) as typeof fetch;
  assert.deepEqual(await subscribe({ email: ' user@example.com ' }, { mode: 'live', key: 'test-only', fetcher }), { mocked: false });
  assert.deepEqual(payload, { email_address: 'user@example.com' });
  await assert.rejects(subscribe({ email: 'user@example.com' }, { mode: 'live', key: 'test-only', fetcher: (async () => new Response('{}', { status: 422 })) as typeof fetch }), /Controlla/);
});
test('missing config, HTTP errors, network failures and timeout are recoverable', async () => {
  await assert.rejects(subscribe({ email: 'user@example.com' }, { mode: 'live' }), /servizio/);
  await assert.rejects(subscribe({ email: 'user@example.com' }, { mode: 'live', key: 'test-only', fetcher: (async () => new Response('{}', { status: 503 })) as typeof fetch }), /servizio/);
  await assert.rejects(subscribe({ email: 'user@example.com' }, { mode: 'live', key: 'test-only', fetcher: (async () => { throw new TypeError('network'); }) as typeof fetch }), /Connessione/);
  await assert.rejects(subscribe({ email: 'user@example.com' }, { mode: 'live', key: 'test-only', timeoutMs: 5, fetcher: ((_url, options) => new Promise((_resolve, reject) => options!.signal!.addEventListener('abort', () => reject(new Error('abort'))))) as typeof fetch }), /Connessione/);
});
test('mock submissions never call the live endpoint', async () => {
  const fetcher = (async () => { throw new Error('Must not call network'); }) as typeof fetch;
  assert.deepEqual(await subscribe({ email: 'user@example.com' }, { mode: 'mock', fetcher }), { mocked: true });
  await assert.rejects(subscribe({ email: 'user@example.com' }, { mode: 'mock', mockScenario: 'error', fetcher }), /servizio/);
});
