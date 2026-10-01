import type { TypedObject } from "astro-portabletext/types";
export interface Program { _id: string; year: number; title?: string }
export type PracticalInfo = Partial<Record<'meeting' | 'distance' | 'elevation' | 'difficulty' | 'duration' | 'equipment' | 'booking', string>>;
export interface EditorialContent { subtitle?: string; leaders?: string[]; partners?: string; practicalInfo?: PracticalInfo; body?: TypedObject[] }
export type EventKind = 'walk' | 'meeting' | 'series';
export interface Participation { _key: string; name: string; label?: string; bio?: string }
export interface Booking { required?: boolean; maxParticipants?: number; contact?: { name?: string; phone?: string; email?: string; url?: string } }
export interface Walk { meetingPoint?: string; distanceKm?: number; elevationGainM?: number; durationMinutes?: number; difficulty?: string; equipment?: string; guides: Participation[] }
export interface Meeting { speakers: Participation[]; moderator?: Participation }
export interface SeriesMeeting extends Meeting { _key: string; title: string; body?: TypedObject[]; date?: string; startTime?: string; endTime?: string; location?: string; booking?: Booking }
export interface Series { bookingMode: 'none' | 'series' | 'sessions'; booking?: Booking; meetings: SeriesMeeting[] }
export interface EventDoc extends EditorialContent { _id: string; slug: string; title: string; location?: string; info?: string; hasDescription?: boolean; requiredPrenotation?: boolean }
export interface DateDoc extends EditorialContent { _id: string; slug: string; title: string; location: string; date: string; timeInfo?: string; year: number; programId: string; events: EventDoc[]; kind?: EventKind; summary?: string; startTime?: string; endTime?: string; endDate?: string; walk?: Walk; meeting?: Meeting; series?: Series; booking?: Booking; legacyAnchors?: string[] }
export interface LegacyRoute { year: number; slug: string; title: string; targetIds: string[]; anchors: { oldId: string; targetId: string; meetingKey?: string }[] }
export interface SiteContent { programs: Program[]; dates: DateDoc[]; legacyRoutes: LegacyRoute[] }
export function validateContent(programs: Program[], dates: DateDoc[]) {
  const years = new Set<number>();
  for (const program of programs) { if (!Number.isInteger(program.year) || years.has(program.year)) throw new Error('Invalid or duplicate program year: ' + program._id); years.add(program.year); }
  const paths = new Set<string>();
  for (const date of dates) {
    const route = date.year + '/' + date.slug;
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date.date) && !Number.isNaN(Date.parse(date.date)) && new Date(date.date + 'T12:00:00Z').toISOString().slice(0, 10) === date.date;
    if (!years.has(date.year) || !programs.some(program => program._id === date.programId) || !date.slug || /[/?#]/.test(date.slug) || !validDate || paths.has(route)) throw new Error('Invalid reference, date, or duplicate route on appointment ' + date._id);
    paths.add(route);
    if (date.kind) {
      if (!date.summary?.trim() || !['walk', 'meeting', 'series'].includes(date.kind)) throw new Error('Invalid event presentation: ' + date._id);
      if (date.endDate && (date.kind !== 'series' || date.endDate < date.date)) throw new Error('Invalid series dates: ' + date._id);
      const validTime = (value?: string) => !value || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
      if (!validTime(date.startTime) || !validTime(date.endTime)) throw new Error('Invalid event time: ' + date._id);
      if (date.kind === 'walk' && !date.walk || date.kind === 'meeting' && !date.meeting || date.kind === 'series' && !date.series) throw new Error('Missing event details: ' + date._id);
      if (date.series) {
        const keys = new Set<string>();
        for (const slot of date.series.meetings) {
          if (!slot._key || keys.has(slot._key) || !slot.title || !validTime(slot.startTime) || !validTime(slot.endTime) || slot.date && (slot.date < date.date || slot.date > (date.endDate || date.date))) throw new Error('Invalid series meeting: ' + date._id);
          keys.add(slot._key);
        }
      }
    }
  }
}

/** Both source models normalize to the calendar/card view; legacy support never writes CMS data. */
export function normalizeContent(documents: Record<string, any>[]): SiteContent {
  const published = documents.filter(doc => !doc._id.startsWith('drafts.') && !doc._id.startsWith('versions.'));
  const programs: Program[] = published.filter(doc => doc._type === 'program').map(doc => ({ _id: doc._id, year: doc.year, title: doc.title })).sort((a, b) => b.year - a.year);
  const state = published.find(doc => doc._id === 'migration-program-events-v2');
  const allV2 = published.filter(doc => doc._type === 'event' && doc.schemaVersion === 2);
  if (allV2.length && !state && published.some(doc => doc._type === 'appuntamento')) throw new Error('Mixed content model without a verified migration state.');
  const legacyRoutes: LegacyRoute[] = state?.routes || [];
  const people = new Map(published.filter(doc => doc._type === 'person').map(doc => [doc._id, doc]));
  const participants = (values: any[] = []): Participation[] => values.map(value => {
    const person = people.get(value.person?._ref);
    if (!person?.name) throw new Error('Broken person reference: ' + value.person?._ref);
    return { _key: value._key, name: person.name, label: value.label, bio: person.bio };
  });
  const moderator = (value: any) => value ? participants([value])[0] : undefined;
  const dates = (state || allV2.length ? allV2.map(doc => {
    const year = programs.find(program => program._id === doc.program?._ref)?.year;
    return { ...doc, slug: doc.slug?.current, year, programId: doc.program?._ref, events: [],
      ...(doc.kind === 'walk' ? { walk: { ...doc.walk, guides: participants(doc.walk?.guides) } } : { walk: undefined }),
      ...(doc.kind === 'meeting' ? { meeting: { ...doc.meeting, speakers: participants(doc.meeting?.speakers), moderator: moderator(doc.meeting?.moderator) } } : { meeting: undefined }),
      ...(doc.kind === 'series' ? { series: { ...doc.series, meetings: (doc.series?.meetings || []).map((slot: any) => ({ ...slot, speakers: participants(slot.speakers), moderator: moderator(slot.moderator) })) } } : { series: undefined }),
      timeInfo: [doc.startTime, doc.endTime].filter(Boolean).join(' – '),
      legacyAnchors: legacyRoutes.flatMap(route => route.anchors || []).filter(anchor => anchor.targetId === doc._id && !anchor.meetingKey).map(anchor => `activity-${anchor.oldId}`),
    };
  }) : published.filter(doc => doc._type === 'appuntamento').map(doc => ({ ...doc, slug: doc.slug?.current, year: programs.find(program => program._id === doc.programYear?._ref)?.year, programId: doc.programYear?._ref,
    events: published.filter(child => child._type === 'event' && child.date?._ref === doc._id).sort((a, b) => a._createdAt.localeCompare(b._createdAt) || a._id.localeCompare(b._id)).map(child => ({ ...child, slug: child.slug?.current })) }))) as DateDoc[];
  dates.sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || '') || a._id.localeCompare(b._id));
  validateContent(programs, dates);
  return { programs, dates, legacyRoutes };
}
