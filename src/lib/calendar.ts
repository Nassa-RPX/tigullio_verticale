export interface CalendarItem { _id: string; date: string; year: number; endDate?: string; startTime?: string }
export const TIME_ZONE = 'Europe/Rome';
export function today(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)!.value).join('-');
}
export function dateParts(date: string) {
  const value = new Date(`${date}T12:00:00Z`);
  return { day: date.slice(8), year: date.slice(0, 4),
    month: new Intl.DateTimeFormat('it-IT', { month: 'long', timeZone: TIME_ZONE }).format(value),
    shortMonth: new Intl.DateTimeFormat('it-IT', { month: 'short', timeZone: TIME_ZONE }).format(value),
    long: new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TIME_ZONE }).format(value) };
}
export function splitDates<T extends CalendarItem>(items: T[], day = today()) {
  const tie = (a: T, b: T) => (a.startTime || '').localeCompare(b.startTime || '') || a._id.localeCompare(b._id);
  return {
    upcoming: items.filter(item => (item.endDate || item.date) >= day).sort((a, b) => a.date.localeCompare(b.date) || tie(a, b)),
    past: items.filter(item => (item.endDate || item.date) < day).sort((a, b) => b.date.localeCompare(a.date) || tie(a, b)),
  };
}
export function activeSeason(programs: { year: number }[], dates: CalendarItem[], day = today()): number | undefined {
  const years = programs.map(program => program.year).sort((a, b) => b - a);
  return years.find(year => dates.some(date => date.year === year && (date.endDate || date.date) >= day)) ?? years[0];
}
export function millisecondsUntilTomorrow(now = new Date()) {
  const day = today(now);
  let low = now.getTime(), high = low + 48 * 60 * 60 * 1000;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (today(new Date(middle)) === day) low = middle; else high = middle;
  }
  return high - now.getTime();
}
