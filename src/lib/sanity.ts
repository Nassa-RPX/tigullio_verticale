import { createClient } from '@sanity/client';
import { sanityEnvironment } from '../../config/environment.mjs';
import { normalizeContent, type SiteContent } from './content';
const { projectId, dataset } = sanityEnvironment({ ...process.env, ...import.meta.env });
export const sanityClient = createClient({ projectId, dataset, apiVersion: import.meta.env.SANITY_API_VERSION ?? '2026-05-01', useCdn: false, perspective: 'published', token: import.meta.env.SANITY_READ_TOKEN || undefined });
export type { Program, PracticalInfo, EditorialContent, EventDoc, DateDoc, EventKind, Participation, Booking, Walk, Meeting, Series, SeriesMeeting, LegacyRoute } from './content';
let content: Promise<SiteContent> | undefined;
let contentFetchedAt = 0;
export function getContent(): Promise<SiteContent> {
  // Build pages share one consistent snapshot. The long-running dev server
  // refreshes CMS content, including after publishing from the local Studio.
  if (import.meta.env.DEV && Date.now() - contentFetchedAt >= 5000) content = undefined;
  if (!content) contentFetchedAt = Date.now();
  return content ??= (async () => {
    const local = process.env.SANITY_CONTENT_FILE;
    const documents = local
      ? JSON.parse(await (await import('node:fs/promises')).readFile(local, 'utf8'))
      : await sanityClient.fetch<Record<string, any>[]>('*[_type in ["program", "appuntamento", "event", "person", "migrationState"]]');
    return normalizeContent(documents);
  })().catch(error => { content = undefined; throw new Error(error.statusCode || error.code ? 'Sanity content fetch failed (' + (error.statusCode || error.code) + ').' : error.message); });
}
