import { defineField, defineType } from 'sanity';
export default defineType({ name: 'person', title: 'Persona', type: 'document', fields: [defineField({ name: 'name', title: 'Nome e cognome', type: 'string', validation: rule => rule.required() }), defineField({ name: 'bio', title: 'Breve biografia', type: 'text', rows: 4 })], preview: { select: { title: 'name', subtitle: 'bio' } } });
