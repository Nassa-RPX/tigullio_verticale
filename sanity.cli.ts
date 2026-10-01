import { defineCliConfig } from "sanity/cli";
import { sanityEnvironment } from "./config/environment.mjs";

const { projectId, dataset } = sanityEnvironment(process.env);

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  deployment: {
    appId: "o9n9j13dnpqgqe9k0bvon8or",
  },
});
