import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemaTypes";
import { sanityEnvironment } from "./config/environment.mjs";
import { structure } from './sanity/structure';

const env = typeof process !== 'undefined' ? { ...process.env, ...import.meta.env } : import.meta.env;
const { projectId, dataset } = sanityEnvironment(env);

export default defineConfig({
  name: "tigullio-verticale",
  title: dataset === 'staging' ? 'Tigullio Verticale — Staging' : 'Tigullio Verticale',
  projectId,
  dataset,
  plugins: [structureTool({ structure }), visionTool()],
  schema: {
    types: schemaTypes,
    templates: templates => [...templates.filter(template => !['event', 'appuntamento', 'migrationState'].includes(template.schemaType)), ...['walk', 'meeting', 'series'].map(kind => ({
      id: `event-${kind}`, title: ({ walk: 'Nuova camminata', meeting: 'Nuovo incontro', series: 'Nuova serie di incontri' } as Record<string, string>)[kind], schemaType: 'event',
      parameters: [{ name: 'programId', type: 'string' }], value: ({ programId }: { programId?: string }) => ({ schemaVersion: 2, kind, ...(programId ? { program: { _type: 'reference', _ref: programId } } : {}), booking: { required: false }, ...(kind === 'series' ? { series: { bookingMode: 'none', meetings: [] } } : { [kind]: {} }) }),
    }))],
  },
});
