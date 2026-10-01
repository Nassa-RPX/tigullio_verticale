import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transform, groupHash, STATE_ID, assertTarget, canonical, restoreOperations } from '../scripts/migrations/program-events-v2.mjs';
import { normalizeContent } from '../src/lib/content';
const body = (text: string, key = 'block') => [{ _key: key, _type: 'block', style: 'normal', children: [{ _type: 'span', _key: 'span', marks: [], text }], markDefs: [] }];
const parent = { _id: 'appointment', _type: 'appuntamento', _rev: 'r1', _createdAt: '2025-01-01', title: 'Giornata', slug: { current: 'giornata' }, date: '2026-10-02', programYear: { _ref: 'p26' }, location: 'Luogo', body: body('Presentazione') };
const child = { _id: 'activity', _type: 'event', _rev: 'r2', _createdAt: '2025-01-02', date: { _ref: 'appointment' }, title: 'Incontro', slug: { current: 'incontro' }, body: body('Descrizione'), info: '14:00, Relatrice', hasDescription: false };
const program = { _id: 'p26', _type: 'program', year: 2026 };
const decision = () => ({ appointment: { mode: 'single', kind: 'meeting', startTime: '14:00', speakers: [['Nome', 'Autrice']], sourceHash: groupHash(parent, [child]) } });
test('single activity preserves source Portable Text, hidden description and both duplicate block keys', () => {
  const result = transform([program, parent, child], decision());
  const event = result.documents.find(doc => doc._type === 'event')!;
  assert.equal(event._id, child._id); assert.equal(event.date, parent.date); assert.equal(event.program._ref, program._id);
  assert.equal(event.slug.current, 'giornata'); assert.equal(event.body[0].children[0].text, 'Presentazione');
  assert.ok(event.body.some((block: any) => block.children[0].text === 'Descrizione'));
  assert.equal(new Set(event.body.map((block: any) => block._key)).size, event.body.length);
  assert.deepEqual(result.retireIds, ['appointment']);
  assert.equal(child.date._ref, 'appointment');
  assert.ok(result.documents.every(doc => !doc._id.includes('.') && doc._id.length <= 128));
  assert.ok(!STATE_ID.includes('.'));
});
test('changed source content and new unmapped documents cannot reuse stale decisions', () => {
  assert.throws(() => transform([program, { ...parent, title: 'Changed' }, child], decision()), /Content changed/);
  assert.throws(() => transform([program, parent, child, { ...child, _id: 'new', date: { _ref: 'unknown' } }], decision()), /Unmapped/);
});
test('drafts cannot silently become published and Content Releases require explicit mapping', () => {
  assert.throws(() => transform([program, parent, child, { ...child, _id: 'drafts.activity' }], decision()), /Draft mapping/);
  assert.throws(() => transform([program, parent, child, { ...child, _id: 'versions.release.activity' }], decision()), /Content Releases/);
});
test('explicit draft mapping preserves unpublished changes separately from published content', () => {
  const draft = { ...child, _id: 'drafts.activity', body: body('Unpublished description') };
  const settings: any = decision(); settings.appointment.draft = { sourceHash: groupHash(parent, [draft]) };
  const result = transform([program, parent, child, draft], settings);
  const published = result.documents.find(doc => doc._id === 'activity')!;
  const migratedDraft = result.documents.find(doc => doc._id === 'drafts.activity')!;
  assert.ok(migratedDraft.body.some((block: any) => block.children[0].text === 'Unpublished description'));
  assert.ok(!published.body.some((block: any) => block.children[0].text === 'Unpublished description'));
});
test('series consolidates children in order, preserving booking scope and legacy anchors', () => {
  const result = transform([program, parent, child], { appointment: { mode: 'series', sourceHash: groupHash(parent, [child]), activities: { activity: { startTime: '14:00', speakers: [['Nome', 'Autrice']] } } } });
  const series = result.documents.find(doc => doc._type === 'event')!;
  assert.equal(series.kind, 'series'); assert.equal(series.series.meetings[0].title, 'Incontro');
  assert.deepEqual(result.retireIds.sort(), ['activity', 'appointment']);
  assert.equal(result.routes[0].anchors[0].meetingKey, 'meeting-activity');
});
test('completed dataset is idempotent but staging completion never suppresses another dataset run', () => {
  assert.equal(transform([{ _id: STATE_ID, status: 'complete', routes: [] }], {}).complete, true);
  assert.equal(transform([program, parent, child], decision()).complete, false);
  assert.throws(() => transform([{ _id: STATE_ID, status: 'complete' }, parent], {}), /New legacy/);
  assert.throws(() => assertTarget('879g27iz', 'main'), /locked/);
  assert.doesNotThrow(() => assertTarget('879g27iz', 'main', true, true));
  assert.throws(() => assertTarget('879g27iz', 'test2', true, true), /Explicit project/);
  assert.doesNotThrow(() => assertTarget('879g27iz', 'staging', true));
  assert.throws(() => assertTarget('other', 'staging'), /Explicit project/);
});
test('normalized new content and legacy content preserve routes and omit drafts', () => {
  const old = normalizeContent([program, parent, child]); assert.equal(old.dates[0].events[0].title, child.title);
  const result = transform([program, parent, child], decision());
  const current = normalizeContent([program, ...result.documents, { _id: STATE_ID, status: 'complete', routes: result.routes }, { ...result.documents.find(doc => doc._type === 'event'), _id: 'drafts.activity', title: 'Unpublished' }]);
  assert.equal(current.dates.length, 1); assert.equal(current.dates[0].kind, 'meeting');
  assert.equal(current.dates[0].meeting!.speakers[0].name, 'Nome');
  assert.deepEqual(canonical(program), canonical({ ...program, _rev: 'new' }));
});
test('incoming references to retired parents prevent content loss', () => {
  assert.throws(() => transform([program, parent, child, { _id: 'other', _type: 'other', parent: { _ref: 'appointment' } }], decision()), /Incoming reference/);
});
test('rollback restores updated and retired documents, removes only created documents and refuses later edits', () => {
  const source = [program, parent, child], result = transform(source, decision());
  const current = [program, ...result.documents.map(doc => ({ ...doc, _rev: 'migrated' }))];
  const operations = restoreOperations(source, current, current, [...result.documents.map(doc => doc._id), ...result.retireIds]);
  const restored = new Map(current.map(doc => [doc._id, doc]));
  for (const operation of operations) { if (operation.original) restored.set(operation.id, operation.original); else restored.delete(operation.id); }
  assert.deepEqual([...restored.values()].map(canonical).sort((a, b) => a._id.localeCompare(b._id)), source.map(canonical).sort((a, b) => a._id.localeCompare(b._id)));
  assert.throws(() => restoreOperations(source, current.map(doc => ({ ...doc, _rev: 'edited' })), current, result.documents.map(doc => doc._id)), /Changed since migration/);
});
