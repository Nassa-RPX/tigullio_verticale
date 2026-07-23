// @ts-check
import { defineConfig } from "astro/config";

import sanity from "@sanity/astro";

// https://astro.build/config
export default defineConfig({
  integrations: [
    sanity({
      projectId: "879g27iz",
      dataset: "test2",
      useCdn: false, // for static builds
    }),
  ],
});
