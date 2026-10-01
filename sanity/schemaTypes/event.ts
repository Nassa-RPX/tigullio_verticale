import { defineType, defineField } from 'sanity';
import { editorialFields } from './practicalInfo';

export default defineType({
  name: 'event',
  type: 'document',
  title: 'Evento',
  fields: [
    ...editorialFields,
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: { source: 'title' },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'title',
      type: 'string',
      title: 'Titolo',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'location',
      type: 'string',
      title: 'Luogo',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'info',
      type: 'string',
      title: 'Info',
    }),
    defineField({
      name: 'hasDescription',
      type: 'boolean',
      title: 'Ha descrizione',
      initialValue: false,
    }),
    defineField({
      name: 'requiredPrenotation',
      type: 'boolean',
      title: 'Prenotazione obbligatoria',
      initialValue: false,
    }),
    defineField({
      name: 'body',
      type: 'array',
      title: 'Contenuto',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'date',
      type: 'reference',
      title: 'Appuntamento',
      to: [{ type: 'appuntamento' }],
      validation: Rule => Rule.required(),
    }),
  ],
});
