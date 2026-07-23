import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'program',
  type: 'document',
  title: 'Programma',
  fields: [
    defineField({
      name: 'year',
      type: 'number',
      title: 'Anno',
      validation: Rule => Rule.required().integer().positive(),
    }),
    defineField({
      name: 'title',
      type: 'string',
      title: 'Titolo',
    }),
  ],
});
