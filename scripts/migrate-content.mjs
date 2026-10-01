import { createClient } from '@sanity/client';
import { loadEnvFile } from 'node:process';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { dirname, resolve, join } from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { MIGRATION_ID, STATE_ID, assertTarget, canonical, hash, transform, groupHash, restoreOperations } from './migrations/program-events-v2.mjs';

const inherited = { ...process.env };
try { loadEnvFile('.env'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
Object.assign(process.env, inherited);
const args = process.argv.slice(2), action = args[0];
const option = name => { const index = args.indexOf(name); return index === -1 ? undefined : args[index + 1]; };
const dataset = option('--dataset'), projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
// Gate before creating a client or accessing a network endpoint, including dry runs.
assertTarget(projectId, dataset, action === 'apply', args.includes('--authorize-production') && process.env.TV_ALLOW_PRODUCTION_MIGRATION === 'true');
if (!['audit', 'plan', 'apply', 'verify', 'cleanup', 'rollback'].includes(action)) throw new Error('Use audit/plan/apply/verify/cleanup/rollback with --dataset.');
const runId = option('--run') || new Date().toISOString().replace(/[:.]/g, '-');
if (!/^[a-zA-Z0-9_-]+$/.test(runId)) throw new Error('Invalid run ID.');
const directory = resolve('.backups', MIGRATION_ID, dataset, runId);
const transformHash = hash(await readFile(new URL('./migrations/program-events-v2.mjs', import.meta.url), 'utf8'));
let token = process.env.SANITY_AUTH_TOKEN || process.env.SANITY_EDITOR_TOKEN;
if (!token && !option('--source')) {
  const fromSanity = createRequire(import.meta.resolve('sanity/cli'));
  const fromCli = createRequire(fromSanity.resolve('@sanity/cli'));
  const { getCliToken } = await import(pathToFileURL(fromCli.resolve('@sanity/cli-core')).href);
  token = await getCliToken();
  if (!token) throw new Error('Authenticated raw inventory required. Set SANITY_AUTH_TOKEN or sign in to the Sanity CLI.');
}
const client = createClient({ projectId, dataset, apiVersion: '2026-05-01', perspective: 'raw', useCdn: false, token });
const fetchAll = () => client.fetch('*[!(_type match "system.*")] | order(_id asc)');
const save = (name, data, exclusive = false) => writeFile(join(directory, name), JSON.stringify(data, null, 2) + '\n', { flag: exclusive ? 'wx' : 'w' });
const read = async name => JSON.parse(await readFile(join(directory, name), 'utf8'));
const sorted = docs => docs.slice().sort((a, b) => a._id.localeCompare(b._id));
function same(a, b) { return hash(canonical(a)) === hash(canonical(b)); }
function assertSnapshot(source, current) {
  if (!same(source.map(doc => [doc._id, doc._rev]), current.map(doc => [doc._id, doc._rev]))) throw new Error('Dataset changed after planning; prepare a fresh plan.');
}
function verifyDocuments(current, plan) {
  for (const expected of plan.documents) {
    const actual = current.find(doc => doc._id === expected._id);
    if (!actual || !same(expected, actual)) throw new Error(`Target verification failed: ${expected._id}`);
  }
  const state = current.find(doc => doc._id === STATE_ID);
  if (!state || state.runId !== runId || state.migrationId !== MIGRATION_ID || !['applied', 'complete'].includes(state.status)) throw new Error('Migration state does not match this run.');
}
function patchDocument(transaction, expected, existing) {
  const { _id, _type, ...fields } = canonical(expected);
  const stale = Object.keys(canonical(existing)).filter(key => !['_id', '_type'].includes(key) && !(key in fields));
  return transaction.patch(_id, patch => patch.ifRevisionId(existing._rev).set(fields).unset(stale));
}
async function exportBackup(source) {
  const require = createRequire(import.meta.url);
  const binary = join(dirname(require.resolve('sanity/package.json')), 'bin/sanity');
  const archive = join(directory, 'dataset.tar.gz');
  await new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, [binary, 'datasets', 'export', dataset, archive, '--project-id', projectId, '--raw'], { stdio: 'inherit', env: { ...process.env, SANITY_AUTH_TOKEN: token, PUBLIC_SANITY_PROJECT_ID: projectId, PUBLIC_SANITY_DATASET: dataset, SANITY_STUDIO_PROJECT_ID: projectId, SANITY_STUDIO_DATASET: dataset, TV_ENV: dataset === 'main' ? 'production-readonly' : 'staging', SANITY_STUDIO_TV_ENV: dataset === 'main' ? 'production' : 'staging', VERCEL_ENV: dataset === 'main' ? 'production' : 'development' } });
    child.on('error', () => reject(new Error('Could not start dataset export.')));
    child.on('exit', code => code === 0 ? resolveRun() : reject(new Error('Dataset export failed.')));
  });
  const compressed = await readFile(archive), tar = gunzipSync(compressed);
  let exported;
  for (let offset = 0; offset + 512 <= tar.length;) {
    const header = tar.subarray(offset, offset + 512);
    const name = header.subarray(0, 100).toString().replace(/\0.*$/, '');
    const size = parseInt(header.subarray(124, 136).toString().replace(/\0.*$/, '').trim() || '0', 8);
    if (name.endsWith('data.ndjson')) exported = tar.subarray(offset + 512, offset + 512 + size).toString().split('\n').filter(Boolean).map(line => JSON.parse(line));
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  if (!exported || !same(sorted(source), sorted(exported))) throw new Error('Export content differs from planned raw snapshot.');
  await save('backup-verification.json', { documents: source.length, archiveHash: hash(compressed.toString('base64')), verified: true, note: 'Raw document export; assets are not mutated by this migration. source.json preserves original asset references.' });
}
try {
  if (action === 'audit' || action === 'plan') {
    const source = option('--source') ? JSON.parse(await readFile(resolve(option('--source')), 'utf8')) : await fetchAll();
    if (action === 'audit') {
      await mkdir(directory, { recursive: true });
      await save('source.json', source, true);
      await save('group-fingerprints.json', source.filter(doc => doc._type === 'appuntamento').map(parent => ({ id: parent._id, title: parent.title, sourceHash: groupHash(parent, source.filter(doc => doc._type === 'event' && doc.date?._ref === parent._id)) })), true);
      console.log(JSON.stringify({ dataset, runId, directory, documents: source.length, types: source.reduce((counts, doc) => { counts[doc._type] = (counts[doc._type] || 0) + 1; return counts; }, {}) }, null, 2));
      process.exit(0);
    }
    const decisions = JSON.parse(await readFile(resolve(option('--decisions') || 'scripts/migrations/program-events-v2.decisions.json'), 'utf8'));
    const plan = transform(source, decisions);
    if (plan.complete) { console.log('Migration already complete: zero operations.'); process.exit(0); }
    await mkdir(directory, { recursive: true });
    await save('source.json', source, true);
    await save('plan.json', { migrationId: MIGRATION_ID, transformHash, projectId, dataset, runId, sourceHash: hash(source), ...plan }, true);
    await save('group-fingerprints.json', source.filter(doc => doc._type === 'appuntamento').map(parent => ({ id: parent._id, title: parent.title, sourceHash: groupHash(parent, source.filter(doc => doc._type === 'event' && doc.date?._ref === parent._id)) })), true);
    const targetMap = new Map(source.filter(doc => !plan.retireIds.includes(doc._id)).map(doc => [doc._id, doc]));
    for (const doc of plan.documents) targetMap.set(doc._id, doc);
    targetMap.set(STATE_ID, { _id: STATE_ID, _type: 'migrationState', migrationId: MIGRATION_ID, runId, status: 'complete', routes: plan.routes });
    await save('target.json', sorted([...targetMap.values()]), true);
    await writeFile(join(directory, 'target.ndjson'), [...targetMap.values()].map(doc => JSON.stringify(canonical(doc))).join('\n') + '\n', { flag: 'wx' });
    console.log(JSON.stringify({ dataset, runId, directory, newOrUpdatedDocuments: plan.documents.length, retireAfterVerification: plan.retireIds.length, warnings: plan.warnings }, null, 2));
  } else {
    if (!option('--run')) throw new Error('An explicit --run is required.');
    const plan = await read('plan.json'), source = await read('source.json');
    if (plan.projectId !== projectId || plan.dataset !== dataset || plan.runId !== runId || plan.migrationId !== MIGRATION_ID || plan.sourceHash !== hash(source)) throw new Error('Plan and snapshot target mismatch.');
    if (['apply', 'cleanup'].includes(action) && plan.transformHash !== transformHash) throw new Error('Transformation changed after simulation; generate and verify a new plan.');
    const current = await fetchAll();
    if (action === 'apply') {
      const state = current.find(doc => doc._id === STATE_ID);
      if (state?.status === 'complete') { console.log('Migration already complete: zero operations.'); process.exit(0); }
      if (state?.runId === runId && state.status === 'applied') {
        verifyDocuments(current, plan);
        await save('applied.json', current);
        await save('journal.json', { projectId, dataset, runId, migrationId: MIGRATION_ID, status: 'applied', targetRevisions: current.filter(doc => plan.documents.some(target => target._id === doc._id) || doc._id === STATE_ID).map(doc => ({ id: doc._id, rev: doc._rev })) });
        console.log('This run is already applied; recovery journal verified, no mutations.'); process.exit(0);
      }
      assertSnapshot(source, current);
      await exportBackup(source);
      assertSnapshot(source, await fetchAll());
      await save('journal.json', { projectId, dataset, runId, migrationId: MIGRATION_ID, status: 'prepared', operations: plan.documents.map(doc => ({ id: doc._id, existing: source.some(old => old._id === doc._id) })) });
      let transaction = client.transaction();
      for (const doc of plan.documents) { const existing = current.find(old => old._id === doc._id); transaction = existing ? patchDocument(transaction, doc, existing) : transaction.create(canonical(doc)); }
      transaction.create({ _id: STATE_ID, _type: 'migrationState', migrationId: MIGRATION_ID, runId, status: 'applied', routes: plan.routes });
      await transaction.commit();
      const after = await fetchAll(); verifyDocuments(after, plan);
      await save('applied.json', after);
      await save('journal.json', { projectId, dataset, runId, migrationId: MIGRATION_ID, status: 'applied', targetRevisions: after.filter(doc => plan.documents.some(target => target._id === doc._id) || doc._id === STATE_ID).map(doc => ({ id: doc._id, rev: doc._rev })) });
      console.log('Applied atomically and verified. Legacy documents retained for review.');
    } else if (action === 'verify') {
      verifyDocuments(current, plan); console.log(`Verified ${plan.documents.length} transformed documents in ${dataset}.`);
    } else if (action === 'cleanup') {
      verifyDocuments(current, plan);
      if (current.find(doc => doc._id === STATE_ID)?.status === 'complete') { console.log('Cleanup already complete: zero operations.'); process.exit(0); }
      let transaction = client.transaction();
      for (const id of plan.retireIds) {
        const existing = current.find(doc => doc._id === id), original = source.find(doc => doc._id === id);
        if (!existing || existing._rev !== original._rev) throw new Error(`Legacy document changed: ${id}`);
        transaction.patch(id, patch => patch.ifRevisionId(existing._rev).set({ migrationRetired: true })).delete(id);
      }
      const state = current.find(doc => doc._id === STATE_ID);
      transaction.patch(STATE_ID, patch => patch.ifRevisionId(state._rev).set({ status: 'complete' }));
      await transaction.commit();
      const after = await fetchAll(); verifyDocuments(after, plan);
      if (after.some(doc => plan.retireIds.includes(doc._id))) throw new Error('Legacy documents remain.');
      await save('completed.json', after);
      await save('journal.json', { projectId, dataset, runId, migrationId: MIGRATION_ID, status: 'complete', targetRevisions: after.filter(doc => plan.documents.some(target => target._id === doc._id) || doc._id === STATE_ID).map(doc => ({ id: doc._id, rev: doc._rev })) });
      console.log('Legacy documents retired; migration complete.');
    } else if (action === 'rollback') {
      const journal = await read('journal.json');
      if (journal.dataset !== dataset || journal.runId !== runId) throw new Error('Rollback journal target mismatch.');
      const changedIds = [...plan.documents.map(doc => doc._id), ...plan.retireIds, STATE_ID];
      const recorded = await read(journal.status === 'complete' ? 'completed.json' : 'applied.json');
      let transaction = client.transaction();
      for (const { id, original, actual } of restoreOperations(source, current, recorded, changedIds)) {
        if (original) transaction = actual ? patchDocument(transaction, original, actual) : transaction.create(canonical(original));
        else if (actual) transaction.patch(id, patch => patch.ifRevisionId(actual._rev).set({ rollback: true })).delete(id);
      }
      await transaction.commit();
      if (!same(sorted(source), sorted(await fetchAll()))) throw new Error('Rollback differs from original content.');
      await save('rollback.json', { dataset, runId, restored: true });
      console.log('Original dataset content restored and verified.');
    }
  }
} catch (error) {
  console.error(error.statusCode || error.code ? `Migration failed (${error.statusCode || error.code}).` : error.message);
  process.exitCode = 1;
}
