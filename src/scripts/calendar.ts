import { activeSeason, splitDates, today, millisecondsUntilTomorrow } from '@/lib/calendar';

export function refreshCalendar(scope: Document = document, day = today()) {
  scope.querySelectorAll<HTMLElement>('[data-date-list]').forEach(list => {
    const cards = Array.from(list.querySelectorAll<HTMLAnchorElement>('[data-appointment]')).map(node => ({ node, _id: node.dataset.id!, date: node.dataset.date!, endDate: node.dataset.endDate, startTime: node.dataset.startTime, year: Number(node.dataset.year) }));
    const groups = splitDates(cards, day);
    const noUpcoming = list.querySelector<HTMLElement>('[data-no-upcoming]');
    if (noUpcoming) noUpcoming.hidden = !cards.length || groups.upcoming.length > 0;
    for (const name of ['upcoming', 'past'] as const) {
      const group = list.querySelector<HTMLElement>(`[data-group="${name}"]`)!;
      const mount = group.querySelector<HTMLElement>(`[data-list="${name}"]`)!;
      group.hidden = groups[name].length === 0;
      const label = group.querySelector('[data-group-label]');
      if (label) label.textContent = `${name === 'upcoming' ? 'Prossimi eventi' : 'Già svolti'} · ${groups[name].length}`;
      groups[name].forEach(({ node }, index) => {
        const next = name === 'upcoming' && index === 0;
        node.classList.toggle('event-card--past', name === 'past'); node.classList.toggle('event-card--next', next);
        node.querySelector<HTMLElement>('[data-next-badge]')!.hidden = !next;
        node.querySelector('[data-card-index]')!.textContent = String(index + 1 + (list.dataset.preview === 'true' && name === 'past' ? groups.upcoming.length : 0)).padStart(2, '0');
        mount.appendChild(node);
      });
    }
    list.querySelector<HTMLElement>('[data-list-empty]')!.hidden = cards.length > 0;
  });
  const seasons = Array.from(scope.querySelectorAll<HTMLElement>('[data-home-season]'));
  if (seasons.length) {
    const dates = Array.from(scope.querySelectorAll<HTMLElement>('[data-home-season] [data-appointment]')).map(node => ({ _id: node.dataset.id!, date: node.dataset.date!, endDate: node.dataset.endDate, startTime: node.dataset.startTime, year: Number(node.dataset.year) }));
    const season = activeSeason(seasons.map(node => ({ year: Number(node.dataset.season) })), dates, day);
    seasons.forEach(node => { node.hidden = Number(node.dataset.season) !== season; });
    scope.querySelectorAll('[data-season-year]').forEach(node => { node.textContent = season === undefined ? '' : String(season); });
    scope.querySelectorAll<HTMLAnchorElement>('[data-current-program]').forEach(node => { node.href = season === undefined ? '/programma' : `/programma/${season}`; });
  }
  const featured = Array.from(scope.querySelectorAll<HTMLElement>('[data-feature-date]'));
  const next = featured.filter(node => (node.dataset.featureEndDate || node.dataset.featureDate)! >= day).sort((a, b) => a.dataset.featureDate!.localeCompare(b.dataset.featureDate!) || (a.dataset.featureStartTime || '').localeCompare(b.dataset.featureStartTime || '') || a.dataset.featureId!.localeCompare(b.dataset.featureId!))[0];
  featured.forEach(node => { node.hidden = node !== next; });
  const empty = scope.querySelector<HTMLElement>('[data-feature-empty]');
  if (empty) empty.hidden = !!next;
  const label = scope.querySelector('[data-feature-label]');
  if (label) label.textContent = next ? 'Prossimo appuntamento' : 'Restiamo in cammino';
}

if (typeof document !== 'undefined') {
  let timer: ReturnType<typeof setTimeout>;
  const refresh = () => {
    clearTimeout(timer); refreshCalendar();
    document.querySelectorAll('[data-current-year]').forEach(node => { node.textContent = today().slice(0, 4); });
    timer = setTimeout(refresh, millisecondsUntilTomorrow() + 25);
  };
  refresh();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.addEventListener('pageshow', refresh);
  window.addEventListener('pagehide', () => clearTimeout(timer));
}
