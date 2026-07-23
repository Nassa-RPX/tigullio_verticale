import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemaTypes";

const env = (import.meta as any).env || (process as any).env || {};

console.log("Sanity config env:", env, import.meta, process.env);

export default defineConfig({
  name: "tigullio-verticale",
  title: "Tigullio Verticale",
  projectId: env.SANITY_STUDIO_PROJECT_ID,
  dataset: env.SANITY_STUDIO_DATASET,
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
});
