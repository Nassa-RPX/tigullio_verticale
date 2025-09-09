import { column, defineDb, defineTable } from 'astro:db';

export const Program = defineTable({
  columns: {
    year: column.number({ unique: true, primaryKey: true }),
    title: column.text({ optional: true, default: '' })
  }
})

export const Date = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    slug: column.text({ unique: true }),
    title: column.text(),
    location: column.text(),
    date: column.date(),
    timeInfo: column.text({ optional: true }),
    description: column.text({ optional: true }),
    programYear: column.number({ references: () => Program.columns.year })
  }
})

export const Event = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    slug: column.text({ unique: true }),
    title: column.text(),
    location: column.text(),
    info: column.text(),
    hasDescription: column.boolean({ optional: true, default: false }),
    requiredPrenotation: column.boolean({ default: false }),
    dateId: column.number({ references: () => Date.columns.id, optional: true }),
  }
})

export const Speaker = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    name: column.text(),
    bio: column.text({ optional: true }),
  }
})

export const EventSpeaker = defineTable({
  columns: {
    eventId: column.number({ references: () => Event.columns.id, primaryKey: true }),
    speakerId: column.number({ references: () => Speaker.columns.id, primaryKey: true }),
  },
})


// https://astro.build/db/config
export default defineDb({
  tables: { Program, Date, Event, Speaker }
});
