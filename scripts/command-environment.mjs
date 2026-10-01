import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";

export function commandEnvironment(command, args, inherited = process.env, cwd = process.cwd()) {
  const development = ["astro", "sanity"].includes(command) && args[0] === "dev";
  const envFile = development ? ".env.staging" : ".env";
  let fileEnv = {};
  try {
    fileEnv = parseEnv(readFileSync(join(cwd, envFile), "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    if (development)
      throw new Error("Missing .env.staging. Create it before starting the development website or Studio.");
  }
  // Explicit shell/CI values retain precedence; dataset guards reject production in dev.
  const env = { ...fileEnv, ...inherited };
  const cliArgs = [...args];
  if (development) {
    env.TV_ENV = "staging";
    env.SANITY_STUDIO_TV_ENV = "staging";
    env.VERCEL_ENV = "development";
    if (command === "sanity") env.SANITY_ACTIVE_ENV = "staging";
    if (command === "astro") {
      const modeIndex = args.findIndex((arg) => arg === "--mode" || arg.startsWith("--mode="));
      const mode =
        modeIndex === -1
          ? undefined
          : args[modeIndex] === "--mode"
            ? args[modeIndex + 1]
            : args[modeIndex].slice("--mode=".length);
      if (modeIndex !== -1 && mode !== "staging")
        throw new Error("Development uses .env.staging; --mode must be staging.");
      if (modeIndex === -1) cliArgs.push("--mode", "staging");
    }
  }
  return { env, args: cliArgs, envFile };
}
