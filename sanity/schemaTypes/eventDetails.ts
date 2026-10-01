import { defineField, defineType, type CustomValidator, type ValidationContext } from 'sanity';

export const timeField = (name: string, title: string) => defineField({ name, title, type: 'string', description: 'Formato HH:mm, per esempio 14:30.', validation: rule => rule.regex(/^([01]\d|2[0-3]):[0-5]\d$/).error('Inserire un orario HH:mm.') });
const relevant = (context: ValidationContext) => !['walk', 'meeting', 'series'].includes(String(context.path?.[0])) || context.document?.kind === context.path?.[0];
export const contentRequired = <T extends { custom: (validator: CustomValidator<any>) => T; warning: () => T }>(rule: T): T[] => [
  rule.custom((value: unknown, context: ValidationContext) => !relevant(context) || context.document?.migration || (Array.isArray(value) ? value.length > 0 : !!value) ? true : 'Campo obbligatorio.'),
  rule.custom((value: unknown, context: ValidationContext) => {
    if (!relevant(context) || !context.document?.migration) return true;
    const legacyInfo = (context.parent as { legacyInfo?: string })?.legacyInfo;
    if (context.path?.at(-1) === 'body' && legacyInfo && Array.isArray(value) && value.map((block: any) => (block.children || []).map((span: any) => span.text || '').join('')).join('\n') === legacyInfo) return 'La descrizione originale era assente: completare la presentazione dell’incontro.';
    return (Array.isArray(value) ? value.length > 0 : !!value) ? true : 'Informazione assente nei contenuti migrati: da completare.';
  }).warning(),
];
export const descriptionField = defineField({ name: 'body', title: 'Descrizione', type: 'array', of: [{ type: 'block' }], description: 'Descrizione completa mostrata nella pagina di dettaglio.', validation: contentRequired });
export const peopleField = (name: string, title: string) => defineField({ name, title, type: 'array', of: [{ type: 'participation' }], validation: contentRequired });
export const participation = defineType({ name: 'participation', title: 'Partecipazione', type: 'object', fields: [
  defineField({ name: 'person', title: 'Persona', type: 'reference', to: [{ type: 'person' }], validation: rule => rule.required() }),
  defineField({ name: 'label', title: 'Qualifica per questo evento', type: 'string' }),
], preview: { select: { title: 'person.name', subtitle: 'label' } } });
export const bookingContact = defineType({ name: 'bookingContact', title: 'Contatto per prenotare', type: 'object', fields: [
  defineField({ name: 'name', title: 'Nome / organizzazione', type: 'string' }),
  defineField({ name: 'phone', title: 'Telefono', type: 'string' }),
  defineField({ name: 'email', title: 'Email', type: 'string', validation: rule => rule.email() }),
  defineField({ name: 'url', title: 'Link di prenotazione', type: 'url', validation: rule => rule.uri({ scheme: ['http', 'https'] }) }),
], validation: rule => rule.custom((value, context) => !(context.parent as { required?: boolean })?.required || !value || value.phone || value.email || value.url ? true : 'Inserire almeno un telefono, una email o un link.') });
export const booking = defineType({ name: 'booking', title: 'Prenotazione', type: 'object', fields: [
  defineField({ name: 'required', title: 'Prenotazione obbligatoria', type: 'boolean', initialValue: false }),
  defineField({ name: 'maxParticipants', title: 'Numero massimo di partecipanti', type: 'number', hidden: ({ parent }) => !parent?.required, validation: rule => rule.integer().positive() }),
  defineField({ name: 'contact', title: 'Contatto per prenotare', type: 'bookingContact', hidden: ({ parent }) => !parent?.required }),
] });
export const walk = defineType({ name: 'walk', title: 'Dettagli della camminata', type: 'object', fields: [
  defineField({ name: 'meetingPoint', title: 'Punto di ritrovo', type: 'text', rows: 2, validation: contentRequired }),
  defineField({ name: 'distanceKm', title: 'Distanza (km)', type: 'number', validation: rule => rule.positive() }),
  defineField({ name: 'elevationGainM', title: 'Dislivello in salita (m)', type: 'number', validation: rule => rule.min(0) }),
  defineField({ name: 'durationMinutes', title: 'Durata (minuti)', type: 'number', validation: rule => rule.integer().positive() }),
  defineField({ name: 'difficulty', title: 'Difficoltà', type: 'string', description: 'Facoltativa. Per esempio T, E, EE.' }),
  defineField({ name: 'equipment', title: 'Equipaggiamento', type: 'text', rows: 3 }),
  peopleField('guides', 'Guide e accompagnatori'),
] });
export const meeting = defineType({ name: 'meeting', title: 'Dettagli dell’incontro', type: 'object', fields: [peopleField('speakers', 'Relatori'), defineField({ name: 'moderator', title: 'Moderatore', type: 'participation' })] });
export const seriesMeeting = defineType({ name: 'seriesMeeting', title: 'Incontro della serie', type: 'object', fields: [
  defineField({ name: 'legacyInfo', type: 'string', hidden: true, readOnly: true }),
  defineField({ name: 'title', title: 'Titolo', type: 'string', validation: rule => rule.required() }), descriptionField,
  defineField({ name: 'date', title: 'Data diversa dalla serie', type: 'date', description: 'Vuoto: usa la data della serie.' }),
  { ...timeField('startTime', 'Ora di inizio'), validation: rule => [...contentRequired(rule), rule.regex(/^([01]\d|2[0-3]):[0-5]\d$/)] }, timeField('endTime', 'Ora di fine'),
  defineField({ name: 'location', title: 'Luogo diverso dalla serie', type: 'string', description: 'Vuoto: usa il luogo della serie.' }),
  peopleField('speakers', 'Relatori'), defineField({ name: 'moderator', title: 'Moderatore', type: 'participation' }),
  defineField({ name: 'booking', title: 'Prenotazione', type: 'booking', hidden: ({ document }) => (document?.series as { bookingMode?: string })?.bookingMode !== 'sessions' }),
], preview: { select: { title: 'title', time: 'startTime', speakers: 'speakers' }, prepare: ({ title, time, speakers }) => ({ title, subtitle: [time, `${speakers?.length ?? 0} relatori`].filter(Boolean).join(' · ') }) }, validation: rule => rule.custom((value, context) => {
  if (!value || !relevant(context)) return true;
  const start = context.document?.date as string, end = (context.document?.endDate as string) || start;
  if (value.date && (value.date < start || value.date > end)) return 'La data deve essere compresa nelle date della serie.';
  if (value.startTime && value.endTime && value.endTime < value.startTime) return 'La fine deve seguire l’inizio.';
  return true;
}) });
export const series = defineType({ name: 'series', title: 'Serie di incontri', type: 'object', fields: [
  defineField({ name: 'meetings', title: 'Incontri', type: 'array', of: [{ type: 'seriesMeeting' }], description: 'Aggiungere gli incontri e trascinarli nell’ordine desiderato.', validation: contentRequired }),
  defineField({ name: 'bookingMode', title: 'Gestione prenotazioni', type: 'string', options: { list: [{ title: 'Nessuna', value: 'none' }, { title: 'Intera serie', value: 'series' }, { title: 'Singoli incontri', value: 'sessions' }], layout: 'radio' }, initialValue: 'none', validation: rule => rule.required() }),
  defineField({ name: 'booking', title: 'Prenotazione dell’intera serie', type: 'booking', hidden: ({ parent }) => parent?.bookingMode !== 'series' }),
] });
