import { defineType, defineField } from 'sanity';

export const editorialFields = [
  defineField({ name: 'subtitle', title: 'Sottotitolo', type: 'string', description: 'Una breve introduzione; facoltativa.' }),
  defineField({ name: 'leaders', title: 'Conducono', type: 'array', of: [{ type: 'string' }], description: 'Nome e ruolo di ciascuna guida o ospite.' }),
  defineField({ name: 'partners', title: 'Collaborazioni', type: 'text', rows: 3 }),
  defineField({ name: 'practicalInfo', title: 'Informazioni pratiche', type: 'practicalInfo', description: 'Informazioni relative a questo documento. Inserire i dettagli condivisi nell’appuntamento e quelli di una singola attività nel relativo evento.' }),
];

export default defineType({
  name: 'practicalInfo', title: 'Informazioni pratiche', type: 'object',
  fields: [
    ['meeting', 'Appuntamento'], ['distance', 'Distanza'], ['elevation', 'Dislivello'],
    ['difficulty', 'Difficoltà'], ['duration', 'Durata'], ['equipment', 'Equipaggiamento'], ['booking', 'Prenotazione'],
  ].map(([name, title]) => defineField({ name, title, type: 'text', rows: 2 })),
});
