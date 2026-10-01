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
      validation: Rule => Rule.required().integer().positive().custom(async (value, context) => {
        if (!value) return true;
        const id = context.document?._id.replace(/^drafts\./, '');
        const count = await context.getClient({ apiVersion: '2026-05-01' }).fetch('count(*[_type == "program" && year == $year && !(_id in [$id, $draft])])', { year: value, id: id || '', draft: `drafts.${id}` });
        return count ? 'Esiste già un programma per questo anno.' : true;
      }),
    }),
    defineField({
      name: 'title',
      type: 'string',
      title: 'Titolo',
    }),
  ],
});
