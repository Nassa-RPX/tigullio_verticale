import type { TypedObject } from "astro-portabletext/types";
export interface Program { _id: string; year: number; title?: string }
export type PracticalInfo = Partial<Record<'meeting' | 'distance' | 'elevation' | 'difficulty' | 'duration' | 'equipment' | 'booking', string>>;
export interface EditorialContent { subtitle?: string; leaders?: string[]; partners?: string; practicalInfo?: PracticalInfo; body?: TypedObject[] }
export interface EventDoc extends EditorialContent { _id: string; slug: string; title: string; location?: string; info?: string; hasDescription?: boolean; requiredPrenotation?: boolean }
export interface DateDoc extends EditorialContent { _id: string; slug: string; title: string; location: string; date: string; timeInfo?: string; year: number; programId: string; events: EventDoc[] }
export function validateContent(programs: Program[], dates: DateDoc[]) {
  const years = new Set<number>();
  for (const program of programs) { if (!Number.isInteger(program.year) || years.has(program.year)) throw new Error('Invalid or duplicate program year: ' + program._id); years.add(program.year); }
  const paths = new Set<string>();
  for (const date of dates) {
    const route = date.year + '/' + date.slug;
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date.date) && !Number.isNaN(Date.parse(date.date)) && new Date(date.date + 'T12:00:00Z').toISOString().slice(0, 10) === date.date;
    if (!years.has(date.year) || !programs.some(program => program._id === date.programId) || !date.slug || /[/?#]/.test(date.slug) || !validDate || paths.has(route)) throw new Error('Invalid reference, date, or duplicate route on appointment ' + date._id);
    paths.add(route);
  }
}
