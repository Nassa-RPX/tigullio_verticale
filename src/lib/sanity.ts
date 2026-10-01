import { createClient } from '@sanity/client';
import { sanityEnvironment } from '../../config/environment.mjs';
const { projectId, dataset } = sanityEnvironment({ ...process.env, ...import.meta.env });
export const sanityClient = createClient({ projectId, dataset, apiVersion: import.meta.env.SANITY_API_VERSION ?? '2026-05-01', useCdn: false, perspective: 'published', token: import.meta.env.SANITY_READ_TOKEN || undefined });
export type { Program, PracticalInfo, EditorialContent, EventDoc, DateDoc } from "./content";
import { validateContent, type Program, type DateDoc } from "./content";
let content: Promise<{ programs: Program[]; dates: DateDoc[] }> | undefined;
export function getContent() {
  return content ??= sanityClient.fetch<{ programs: Program[]; dates: DateDoc[] }>(`{
    "programs": *[_type == "program"] | order(year desc) { _id, year, title },
    "dates": *[_type == "appuntamento"] | order(date asc, _id asc) {
      _id, "slug": slug.current, title, location, date, timeInfo, "year": programYear->year, "programId": programYear._ref,
      subtitle, leaders, partners, practicalInfo, body,
      "events": *[_type == "event" && date._ref == ^._id] | order(_createdAt asc, _id asc) {
        _id, "slug": slug.current, title, location, info, hasDescription, requiredPrenotation, subtitle, leaders, partners, practicalInfo, body
      }
    }
  }`).then(result => { validateContent(result.programs, result.dates); return result; }).catch(error => {
    throw new Error(error.statusCode || error.code ? 'Sanity content fetch failed (' + (error.statusCode || error.code) + ').' : error.message);
  });
}
