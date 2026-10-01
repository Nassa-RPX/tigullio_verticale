import { defineType, defineField } from 'sanity';
export default defineType({ name: 'migrationState', title: 'Stato della migrazione', type: 'document', readOnly: true, fields: [
  defineField({ name: 'migrationId', type: 'string' }), defineField({ name: 'runId', type: 'string' }), defineField({ name: 'status', type: 'string' }),
  defineField({ name: 'routes', type: 'array', of: [{ type: 'object', fields: [
    defineField({ name: 'year', type: 'number' }), defineField({ name: 'slug', type: 'string' }), defineField({ name: 'title', type: 'string' }), defineField({ name: 'targetIds', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'anchors', type: 'array', of: [{ type: 'object', fields: [defineField({ name: 'oldId', type: 'string' }), defineField({ name: 'targetId', type: 'string' }), defineField({ name: 'meetingKey', type: 'string' })] }] }),
  ] }] }),
] });
