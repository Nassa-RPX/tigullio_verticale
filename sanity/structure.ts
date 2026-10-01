import type { StructureResolver } from 'sanity/structure';
export const structure: StructureResolver = S => S.list().title('Tigullio Verticale').items([
  S.listItem().title('Programmi').child(S.documentTypeList('program').title('Programmi annuali').defaultOrdering([{ field: 'year', direction: 'desc' }]).child(id => S.list().title('Programma').items([
    S.listItem().title('Dati del programma').child(S.document().schemaType('program').documentId(id)),
    S.listItem().title('Eventi del programma').child(S.documentList().title('Eventi').schemaType('event').filter('_type == "event" && schemaVersion == 2 && program._ref == $program').params({ program: id }).defaultOrdering([{ field: 'date', direction: 'asc' }, { field: 'startTime', direction: 'asc' }]).initialValueTemplates(['walk', 'meeting', 'series'].map(kind => S.initialValueTemplateItem(`event-${kind}`, { programId: id })))),
  ]))),
  S.documentTypeListItem('person').title('Persone'),
]);
