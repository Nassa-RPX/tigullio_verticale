export function sanityEnvironment(env) {
  const production =
    env.VERCEL_ENV === "production" ||
    env.TV_ENV === "production" ||
    env.TV_ENV === "production-readonly" ||
    env.SANITY_STUDIO_TV_ENV === "production";
  const expected = production ? "main" : "staging";
  const projectId = env.PUBLIC_SANITY_PROJECT_ID || env.SANITY_STUDIO_PROJECT_ID;
  const dataset = env.PUBLIC_SANITY_DATASET || env.SANITY_STUDIO_DATASET;
  if (!projectId || !dataset) throw new Error("Set PUBLIC_SANITY_PROJECT_ID and PUBLIC_SANITY_DATASET.");
  if (env.SANITY_STUDIO_PROJECT_ID && env.SANITY_STUDIO_PROJECT_ID !== projectId)
    throw new Error("Website and Studio project IDs disagree.");
  if (env.SANITY_STUDIO_DATASET && env.SANITY_STUDIO_DATASET !== dataset)
    throw new Error("Website and Studio datasets disagree.");
  if (dataset !== expected)
    throw new Error(
      `This environment must use ${expected}, received ${dataset}. Use TV_ENV=production-readonly only for a deliberate read-only production build.`,
    );
  return { projectId, dataset, production };
}
