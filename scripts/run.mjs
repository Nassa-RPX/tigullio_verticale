import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { sanityEnvironment } from '../config/environment.mjs';

const inherited = { ...process.env };
try { loadEnvFile('.env'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
Object.assign(process.env, inherited);
const config = sanityEnvironment(process.env);
process.env.SANITY_STUDIO_PROJECT_ID = config.projectId;
process.env.SANITY_STUDIO_DATASET = config.dataset;
process.env.SANITY_STUDIO_TV_ENV = config.production ? 'production' : 'staging';
// Browser builds use no editor credential. Public datasets need no read token.
delete process.env.SANITY_EDITOR_TOKEN;
const [command, ...args] = process.argv.slice(2);
if (!['astro', 'sanity', 'studio-deploy'].includes(command)) throw new Error('Unknown command.');
if (command === 'sanity' && (args[0] !== 'dev' || config.dataset !== 'staging')) throw new Error('This development wrapper allows only the local staging Studio.');
if (command === 'studio-deploy' && (!config.production || process.env.TV_ALLOW_STUDIO_DEPLOY !== 'true')) {
  throw new Error('Studio deployment is disabled. A release requires TV_ENV=production and TV_ALLOW_STUDIO_DEPLOY=true.');
}
const live = process.env.PUBLIC_KIT_SUBMIT_MODE === 'live';
if (live && !config.production && process.env.TV_ALLOW_LIVE_KIT_TEST !== 'true') throw new Error('Live Kit testing requires TV_ALLOW_LIVE_KIT_TEST=true.');
if (!process.env.PUBLIC_KIT_SUBMIT_MODE) process.env.PUBLIC_KIT_SUBMIT_MODE = config.production && process.env.TV_ENV !== 'production-readonly' ? 'live' : 'mock';
if (process.env.PUBLIC_KIT_SUBMIT_MODE === 'live' && !process.env.PUBLIC_KIT_API) throw new Error('Live newsletter submission requires PUBLIC_KIT_API.');
const require = createRequire(import.meta.url);
const packagePath = require.resolve(`${command === 'astro' ? 'astro' : 'sanity'}/package.json`);
const packageInfo = JSON.parse(readFileSync(packagePath, 'utf8'));
const binary = join(dirname(packagePath), packageInfo.bin[command === 'astro' ? 'astro' : 'sanity']);
const child = spawn(process.execPath, [binary, ...(command === 'studio-deploy' ? ['deploy'] : args)], { stdio: 'inherit', env: process.env });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', code => { process.exitCode = code ?? 1; });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
