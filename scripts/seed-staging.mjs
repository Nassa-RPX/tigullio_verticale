import { createClient } from '@sanity/client';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { sanityEnvironment } from '../config/environment.mjs';

const inherited = { ...process.env };
loadEnvFile('.env');
Object.assign(process.env, inherited);
const { projectId, dataset } = sanityEnvironment(process.env);
if (dataset !== 'staging' || projectId !== '879g27iz') throw new Error('Seeding is allowed only into project 879g27iz / staging.');
const types = ['program', 'appuntamento', 'event'];
const token = process.env.SANITY_AUTH_TOKEN || process.env.SANITY_EDITOR_TOKEN;
const client = createClient({ projectId, dataset, apiVersion: '2026-05-01', perspective: 'raw', useCdn: false, token });
const query = '*[_type in $types] | order(_id asc)';
const require = createRequire(import.meta.url);
const binary = join(dirname(require.resolve('sanity/package.json')), 'bin/sanity');
const backup = resolve(process.argv[2] || join(process.env.USERPROFILE, 'Downloads', 'tv-test2-content-2026-10-01.tar.gz'));
const run = args => new Promise((resolveRun, reject) => {
  const child = spawn(process.execPath, [binary, ...args], { stdio: 'inherit', env: { ...process.env, SANITY_AUTH_TOKEN: token } });
  child.on('error', () => reject(new Error('Could not start Sanity CLI.')));
  child.on('exit', code => code === 0 ? resolveRun() : reject(new Error(`Sanity CLI exited with ${code}.`)));
});
try {
  const source = await client.withConfig({ dataset: 'test2' }).fetch(query, { types });
  const target = await client.fetch(query, { types });
  const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
  const normalize = docs => JSON.stringify(stable(docs.map(({ _createdAt, _updatedAt, _rev, ...content }) => content)));
  if (target.length) {
    if (normalize(source) !== normalize(target)) throw new Error('Staging already contains different content. Refusing to overwrite or merge.');
    console.log('Staging already matches production website content; no import needed.');
  } else {
    if (existsSync(backup)) throw new Error('Backup path already exists. Choose a new filename; existing backups are never overwritten.');
    await run(['datasets', 'export', 'test2', backup, '--project-id', projectId, '--types', types.join(',')]);
    await run(['datasets', 'import', backup, '--project-id', projectId, '--dataset', 'staging']);
    const imported = await client.fetch(query, { types });
    if (normalize(source) !== normalize(imported)) throw new Error('Imported content differs; inspect staging before proceeding.');
    console.log(`Verified ${imported.length} website documents with unchanged content and references. Backup: ${backup}`);
  }
} catch (error) {
  // SDK errors can contain authorization headers: never print raw error objects.
  console.error(error.statusCode || error.code ? `Sanity operation failed (${error.statusCode || error.code}).` : error.message);
  process.exitCode = 1;
}
