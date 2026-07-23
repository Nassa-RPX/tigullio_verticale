import { createClient } from "@sanity/client";

export const sanityClient = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET,
  apiVersion: import.meta.env.SANITY_API_VERSION ?? "2026-05-01",
  useCdn: false,
  token: import.meta.env.SANITY_EDITOR_TOKEN,
});

export interface Program {
  _id: string;
  year: number;
  title?: string;
}

export interface DateDoc {
  _id: string;
  slug: { current: string };
  title: string;
  location: string;
  date: string;
  timeInfo?: string;
  body?: unknown[];
  programYear: { _ref: string };
}

export interface EventDoc {
  _id: string;
  slug: { current: string };
  title: string;
  location: string;
  info?: string;
  hasDescription?: boolean;
  requiredPrenotation?: boolean;
  body?: unknown[];
  date: { _ref: string };
}
