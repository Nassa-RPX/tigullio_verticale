import { defineType, defineField } from 'sanity';
import { editorialFields } from './practicalInfo';

export default defineType({
  name: 'appuntamento',
  type: 'document',
  title: 'Appuntamento',
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
      name: 'date',
      type: 'date',
      title: 'Data',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'timeInfo',
      type: 'string',
      title: 'Orario / Info',
    }),
    defineField({
      name: 'body',
      type: 'array',
      title: 'Contenuto',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'programYear',
      type: 'reference',
      title: 'Programma',
      to: [{ type: 'program' }],
      validation: Rule => Rule.required(),
    }),
  ],
});
