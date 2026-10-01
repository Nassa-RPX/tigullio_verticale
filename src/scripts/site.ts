export {};
const root = document.documentElement;
const system = matchMedia('(prefers-color-scheme: light)');
let saved: string | null = null;
try { saved = localStorage.getItem('tv-theme'); } catch {}
function applyTheme(theme: string) {
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach(button => {
    button.setAttribute('aria-label', theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro');
    button.setAttribute('aria-pressed', String(theme === 'light'));
  });
}
applyTheme(saved === 'light' || saved === 'dark' ? saved : system.matches ? 'light' : 'dark');
document.querySelectorAll('[data-theme-toggle]').forEach(button => button.addEventListener('click', () => {
  saved = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('tv-theme', saved); } catch {}
  applyTheme(saved);
}));
system.addEventListener('change', () => { if (saved !== 'light' && saved !== 'dark') applyTheme(system.matches ? 'light' : 'dark'); });

// Let ordinary same-site links leave the current page with a short, subtle fade.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let leaving = false;
document.addEventListener('click', event => {
  if (event.defaultPrevented || !(event.target instanceof Element)) return;
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest<HTMLAnchorElement>('a[href]');
  if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
  const destination = new URL(link.href, location.href);
  if (destination.origin !== location.origin) return;
  if (destination.pathname === location.pathname && destination.search === location.search) return;
  if (reducedMotion.matches || leaving) return;

  event.preventDefault();
  leaving = true;
  document.documentElement.classList.add('is-leaving');
  window.setTimeout(() => location.assign(destination.href), 180);
});

const header = document.querySelector('[data-header]');
const onScroll = () => header?.classList.toggle('is-scrolled', scrollY > 24);
onScroll();
addEventListener('scroll', onScroll, { passive: true });

const drawer = document.getElementById('site-drawer');
const opener = document.querySelector<HTMLButtonElement>('[data-menu-open]');
let previous: HTMLElement | null = null;
let isolated: { node: HTMLElement; inert: boolean }[] = [];
function closeDrawer() {
  if (!drawer || !drawer.classList.contains('is-open')) return;
  drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true'); drawer.inert = true;
  document.body.classList.remove('drawer-open'); opener?.setAttribute('aria-expanded', 'false');
  isolated.forEach(({ node, inert }) => { node.inert = inert; }); isolated = [];
  previous?.focus();
}
opener?.addEventListener('click', () => {
  if (!drawer) return;
  previous = document.activeElement as HTMLElement;
  isolated = Array.from(document.body.children).filter((node): node is HTMLElement => node instanceof HTMLElement && node !== drawer && node.tagName !== 'SCRIPT').map(node => ({ node, inert: node.inert }));
  isolated.forEach(({ node }) => { node.inert = true; });
  drawer.inert = false; drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('drawer-open'); opener.setAttribute('aria-expanded', 'true');
  drawer.querySelector<HTMLButtonElement>('button[data-menu-close]')?.focus();
});
drawer?.querySelectorAll('[data-menu-close], a').forEach(node => node.addEventListener('click', closeDrawer));
document.addEventListener('keydown', event => {
  if (!drawer?.classList.contains('is-open')) return;
  if (event.key === 'Escape') { event.preventDefault(); closeDrawer(); }
  if (event.key === 'Tab') {
    const controls = Array.from(drawer.querySelectorAll<HTMLElement>('button, a[href]')).filter(node => !node.hidden);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
});
matchMedia('(min-width: 861px)').addEventListener('change', event => { if (event.matches) closeDrawer(); });
document.querySelectorAll('[data-current-year]').forEach(node => { node.textContent = String(new Date().getFullYear()); });
