import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemaTypes";
import { sanityEnvironment } from "./config/environment.mjs";

const env = typeof process !== 'undefined' ? { ...process.env, ...import.meta.env } : import.meta.env;
const { projectId, dataset } = sanityEnvironment(env);

export default defineConfig({
  name: "tigullio-verticale",
  title: dataset === 'staging' ? 'Tigullio Verticale — Staging' : 'Tigullio Verticale',
  projectId,
  dataset,
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
});
