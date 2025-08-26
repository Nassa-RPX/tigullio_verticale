import { Date as DbDate, db, Program, Event, Speaker } from 'astro:db';

// https://astro.build/db/seed
export default async function seed() {
	// TODO
	await db.insert(Program).values([
		{ title: 'Programma 2025', year: 2025 }
	])

	await db.insert(DbDate).values([
		{
			title: 'Ritornare sul Territorio',
			location: 'Lavagna (GE)',
			programYear: 2025,
			slug: 'ritornare-sul-territorio',
			timeInfo: '09:30 dalla chiesa di Santa Giulia',
			date: new Date('2025-09-13')
		},

		{
			title: 'Ricostruire il Territorio',
			location: 'Rapallo (GE)',
			programYear: 2025,
			slug: 'ricostruire-sul-territorio',
			timeInfo: '13:30 presso l\'azienda agricola "Fescion Farmer"',
			date: new Date('2025-09-20')
		},
		{
			title: "Riconoscere il Territorio",
			location: 'Santa Margherita Ligure (GE)',
			programYear: 2025,
			slug: 'riconoscere-il-territorio',
			timeInfo: '12:00 - 17:00 presso il Parco degli Elfi',
			date: new Date('2025-09-27')
		},
		{
			title: "L'altra Santa",
			location: 'Santa Margherita Ligure (GE)',
			programYear: 2025,
			slug: 'altra-santa',
			timeInfo: '10:00 - 17:00',
			date: new Date('2025-09-28')
		}
	])

	await db.insert(Event).values([
		{
			slug: 'civilta-pietra-acqua',
			title: "La civilta' della pietra e dell’acqua",
			location: 'Lavagna(GE)',
			date: new Date('2025-09-13'),
			requiredPrenotation: true,
			dateId: 1,
		},
	])

}
