// @ts-check
import { defineConfig } from "astro/config";

import sanity from "@sanity/astro";
import { sanityEnvironment } from "./config/environment.mjs";

const { projectId, dataset } = sanityEnvironment(process.env);

// https://astro.build/config
export default defineConfig({
  integrations: [
    sanity({
      projectId,
      dataset,
      useCdn: false, // for static builds
    }),
  ],
});
