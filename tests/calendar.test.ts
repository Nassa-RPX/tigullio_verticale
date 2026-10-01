import { test } from 'node:test';
import assert from 'node:assert/strict';
import { today, splitDates, activeSeason, dateParts, millisecondsUntilTomorrow } from '../src/lib/calendar';
import { JSDOM } from 'jsdom';
import { refreshCalendar } from '../src/scripts/calendar';

const item = (_id: string, date: string, year = 2026) => ({ _id, date, year });
test('series remains upcoming until its end date, and same-day events sort by time', () => {
  const series = { ...item('series', '2026-10-01'), endDate: '2026-10-03' };
  assert.equal(splitDates([series], '2026-10-02').upcoming.length, 1);
  assert.equal(splitDates([series], '2026-10-04').past.length, 1);
  assert.deepEqual(splitDates([{ ...item('a', '2026-10-01'), startTime: '15:00' }, { ...item('b', '2026-10-01'), startTime: '12:00' }], '2026-10-01').upcoming.map(x => x._id), ['b', 'a']);
});
test('Rome calendar stays correct across midnight and DST', () => {
  assert.equal(today(new Date('2026-10-01T22:01:00Z')), '2026-10-02');
  assert.equal(today(new Date('2026-03-28T23:30:00Z')), '2026-03-29');
  assert.equal(today(new Date('2026-10-24T22:30:00Z')), '2026-10-25');
  assert.equal(millisecondsUntilTomorrow(new Date('2026-03-28T23:00:00Z')), 23 * 3600000);
  assert.equal(millisecondsUntilTomorrow(new Date('2026-10-24T22:00:00Z')), 25 * 3600000);
  assert.equal(dateParts('2026-10-17').long, '17 ottobre 2026');
});
test('same-day is upcoming, past is descending, ties are stable', () => {
  const { upcoming, past } = splitDates([item('d', '2026-09-10'), item('c', '2026-10-02'), item('b', '2026-10-01'), item('a', '2026-10-01'), item('e', '2026-09-20')], '2026-10-01');
  assert.deepEqual(upcoming.map(x => x._id), ['a', 'b', 'c']); assert.deepEqual(past.map(x => x._id), ['e', 'd']);
});
test('home season chooses newest upcoming, newest published fallback, or empty', () => {
  const programs = [{ year: 2025 }, { year: 2027 }, { year: 2026 }];
  assert.equal(activeSeason(programs, [item('a', '2026-10-17')], '2026-10-01'), 2026);
  assert.equal(activeSeason(programs, [], '2026-10-01'), 2027); assert.equal(activeSeason([], []), undefined);
});
test('DOM refresh moves existing cards after an event, clears featured metadata, and survives repeat refresh', () => {
  const dom = new JSDOM(`<span data-feature-label></span><div data-feature-date="2026-10-17" data-feature-id="a">17 ottobre</div><div data-feature-empty hidden></div><span data-season-year></span><a data-current-program></a><div data-home-season data-season="2026"><div data-date-list data-preview="true"><div data-group="upcoming"><div data-list="upcoming"><a data-appointment data-date="2026-10-17" data-year="2026" data-id="a"><span data-next-badge></span><span data-card-index></span></a></div></div><div data-group="past"><div data-list="past"></div></div><p data-list-empty></p></div></div>`);
  const doc = dom.window.document;
  const noUpcoming = doc.createElement('p');
  noUpcoming.setAttribute('data-no-upcoming', ''); noUpcoming.hidden = true;
  doc.querySelector('[data-date-list]')!.appendChild(noUpcoming);
  refreshCalendar(doc, '2026-10-17');
  assert.equal(noUpcoming.hidden, true);
  refreshCalendar(doc, '2026-10-18'); refreshCalendar(doc, '2026-10-18');
  assert.equal(noUpcoming.hidden, false);
  assert.equal(doc.querySelector('[data-list="past"]')!.children.length, 1);
  assert.equal(doc.querySelector('[data-list="upcoming"]')!.children.length, 0);
  assert.equal((doc.querySelector('[data-next-badge]') as HTMLElement).hidden, true);
  assert.equal((doc.querySelector('[data-feature-date]') as HTMLElement).hidden, true);
  assert.equal((doc.querySelector('[data-feature-empty]') as HTMLElement).hidden, false);
  assert.equal(doc.querySelector('[data-current-program]')!.getAttribute('href'), '/programma/2026');
  dom.window.close();
});
