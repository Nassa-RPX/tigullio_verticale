import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { commandEnvironment } from '../scripts/command-environment.mjs';
import { sanityEnvironment } from '../config/environment.mjs';

function fixture(t: { after: (callback: () => void) => void }, staging = true) {
  const directory = mkdtempSync(join(tmpdir(), 'tv-command-env-'));
  t.after(() => {
    const target = resolve(directory);
    assert.equal(dirname(target), resolve(tmpdir()));
    assert.ok(basename(target).startsWith('tv-command-env-'));
    rmSync(target, { recursive: true, force: true });
  });
  const settings = (dataset: string) => `PUBLIC_SANITY_PROJECT_ID=879g27iz\nPUBLIC_SANITY_DATASET=${dataset}\nSANITY_STUDIO_PROJECT_ID=879g27iz\nSANITY_STUDIO_DATASET=${dataset}\nPUBLIC_KIT_SUBMIT_MODE=${dataset === 'main' ? 'live' : 'mock'}\n`;
  writeFileSync(join(directory, '.env'), settings('main'));
  if (staging) writeFileSync(join(directory, '.env.staging'), settings('staging'));
  return directory;
}

test('both development commands use staging even when .env contains main', t => {
  const directory = fixture(t);
  for (const command of ['astro', 'sanity']) {
    const result = commandEnvironment(command, ['dev', '--port', '1234'], {}, directory);
    assert.equal(result.envFile, '.env.staging');
    assert.equal(sanityEnvironment(result.env).dataset, 'staging');
    assert.equal(result.env.PUBLIC_KIT_SUBMIT_MODE, 'mock');
    if (command === 'astro') assert.deepEqual(result.args, ['dev', '--port', '1234', '--mode', 'staging']);
    else {
      assert.equal(result.env.SANITY_ACTIVE_ENV, 'staging');
      assert.deepEqual(result.args, ['dev', '--port', '1234']);
    }
  }
});

test('missing staging file fails instead of falling back to production .env', t => {
  const directory = fixture(t, false);
  for (const command of ['astro', 'sanity']) assert.throws(() => commandEnvironment(command, ['dev'], {}, directory), /Missing .env.staging/);
});

test('explicit shell overrides remain supported but cannot target main in development', t => {
  const directory = fixture(t);
  const result = commandEnvironment('astro', ['dev'], { SANITY_READ_TOKEN: 'test-read-token', TV_ENV: 'production', VERCEL_ENV: 'production' }, directory);
  assert.equal(result.env.SANITY_READ_TOKEN, 'test-read-token');
  assert.equal(sanityEnvironment(result.env).dataset, 'staging');
  const wrong = commandEnvironment('sanity', ['dev'], { PUBLIC_SANITY_DATASET: 'main', SANITY_STUDIO_DATASET: 'main' }, directory);
  assert.throws(() => sanityEnvironment(wrong.env), /must use staging/);
});

test('other commands keep .env; conflicting Astro development modes are rejected', t => {
  const directory = fixture(t);
  for (const [command, args] of [['astro', ['build']], ['astro', ['preview']], ['studio-deploy', ['--help']]] as const) {
    const result = commandEnvironment(command, [...args], {}, directory);
    assert.equal(result.envFile, '.env');
    assert.equal(result.env.PUBLIC_SANITY_DATASET, 'main');
    assert.deepEqual(result.args, args);
  }
  assert.throws(() => commandEnvironment('astro', ['dev', '--mode=production'], {}, directory), /mode must be staging/);
  assert.throws(() => commandEnvironment('astro', ['dev', '--mode'], {}, directory), /mode must be staging/);
  assert.deepEqual(commandEnvironment('astro', ['dev', '--mode', 'staging'], {}, directory).args, ['dev', '--mode', 'staging']);
});
