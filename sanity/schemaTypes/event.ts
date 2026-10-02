import { defineType, defineField } from "sanity";
import { contentRequired, descriptionField, timeField } from "./eventDetails";
export default defineType({
  name: "event",
  type: "document",
  title: "Evento",
  initialValue: { schemaVersion: 2, booking: { required: false } },
  groups: [
    { name: "presentation", title: "Presentazione", default: true },
    { name: "when", title: "Data e luogo" },
    { name: "details", title: "Dettagli" },
    { name: "booking", title: "Prenotazione" },
  ],
  orderings: [
    {
      title: "Data e ora",
      name: "date",
      by: [
        { field: "date", direction: "asc" },
        { field: "startTime", direction: "asc" },
      ],
    },
  ],
  fields: [
    defineField({ name: "schemaVersion", type: "number", hidden: true, initialValue: 2 }),
    defineField({
      name: "migration",
      type: "object",
      hidden: true,
      readOnly: true,
      fields: [
        defineField({ name: "sourceIds", type: "array", of: [{ type: "string" }] }),
        defineField({ name: "warnings", type: "array", of: [{ type: "string" }] }),
        defineField({ name: "id", type: "string" }),
      ],
    }),
    defineField({
      name: "program",
      title: "Programma",
      type: "reference",
      to: [{ type: "program" }],
      group: "presentation",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "kind",
      title: "Tipo di evento",
      type: "string",
      group: "presentation",
      options: {
        list: [
          { title: "Camminata", value: "walk" },
          { title: "Incontro", value: "meeting" },
          { title: "Festival", value: "series" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "title",
      title: "Titolo",
      type: "string",
      group: "presentation",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "presentation",
      options: {
        source: "title",
        isUnique: async (slug, context) => {
          const id = context.document?._id.replace(/^drafts\./, ""),
            program = (context.document?.program as { _ref?: string })?._ref;
          return !(await context
            .getClient({ apiVersion: "2026-05-01" })
            .fetch(
              'count(*[_type == "event" && schemaVersion == 2 && slug.current == $slug && program._ref == $program && !(_id in [$id, $draft])])',
              { slug, program: program || "", id: id || "", draft: `drafts.${id}` },
            ));
        },
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "summary",
      title: "Sintesi",
      type: "text",
      rows: 3,
      group: "presentation",
      description: "Breve presentazione mostrata nelle schede del programma. Indicativamente 1–3 frasi.",
      validation: (rule) => [rule.required(), rule.max(400).warning("Una sintesi breve è più leggibile nelle schede.")],
    }),
    { ...descriptionField, group: "presentation" },
    defineField({ name: "partners", title: "Collaborazioni", type: "text", rows: 3, group: "presentation" }),
    defineField({
      name: "date",
      title: "Data / Inizio della serie",
      type: "date",
      group: "when",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "endDate",
      title: "Data finale della serie",
      type: "date",
      group: "when",
      hidden: ({ document }) => document?.kind !== "series",
      validation: (rule) =>
        rule.custom((value, context) =>
          context.document?.kind !== "series" || !value || value >= String(context.document?.date)
            ? true
            : "La fine deve seguire l’inizio.",
        ),
    }),
    {
      ...timeField("startTime", "Ora di inizio / ritrovo"),
      group: "when",
      validation: (rule) => [
        rule.regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        rule.custom((value, context) =>
          context.document?.kind === "series" || context.document?.migration || !!value
            ? true
            : "Inserire l’orario di inizio.",
        ),
        rule
          .custom((value, context) =>
            context.document?.kind === "series" || !context.document?.migration || !!value
              ? true
              : "Orario assente nei contenuti migrati: da completare.",
          )
          .warning(),
      ],
    },
    { ...timeField("endTime", "Ora di fine"), group: "when" },
    defineField({
      name: "location",
      title: "Luogo",
      type: "string",
      group: "when",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "walk",
      title: "Dettagli della camminata",
      type: "walk",
      group: "details",
      hidden: ({ document }) => document?.kind !== "walk",
    }),
    defineField({
      name: "meeting",
      title: "Dettagli dell’incontro",
      type: "meeting",
      group: "details",
      hidden: ({ document }) => document?.kind !== "meeting",
    }),
    defineField({
      name: "series",
      title: "Festival",
      type: "series",
      group: "details",
      hidden: ({ document }) => document?.kind !== "series",
    }),
    defineField({
      name: "booking",
      title: "Prenotazione",
      type: "booking",
      group: "booking",
      hidden: ({ document }) => document?.kind === "series",
    }),
  ],
  validation: (rule) =>
    rule.custom((doc: any) => {
      if (!doc) return true;
      if (doc.startTime && doc.endTime && doc.endTime < doc.startTime && (!doc.endDate || doc.endDate === doc.date))
        return "La fine deve seguire l’inizio.";
      if (doc.kind && !doc[doc.kind]) return "Compilare i dettagli del tipo di evento scelto.";
      return true;
    }),
  preview: {
    select: { title: "title", date: "date", kind: "kind", year: "program.year" },
    prepare: ({ title, date, kind, year }) => ({
      title,
      subtitle: [
        year,
        date,
        ({ walk: "Camminata", meeting: "Incontro", series: "Festival" } as Record<string, string>)[kind],
      ]
        .filter(Boolean)
        .join(" · "),
    }),
  },
});
