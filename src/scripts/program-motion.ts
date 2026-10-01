import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createScrollReveal } from './scroll-reveal';

gsap.registerPlugin(ScrollTrigger);
const hero = document.querySelector('[data-program-motion]');
const list = document.querySelector('[data-program-list]');
const years = document.querySelector('[data-program-years]');
const reveal = createScrollReveal();
const prepared = new WeakSet<Element>();
const cardTweens = new WeakMap<Element, gsap.core.Tween>();
let heroAnimated = false;
let yearsAnimated = false;
let listInitialized = matchMedia('(prefers-reduced-motion: reduce)').matches;
let yearsTween: gsap.core.Tween | undefined;

function finish(tween?: gsap.core.Tween) {
  tween?.scrollTrigger?.kill(false, true);
  tween?.progress(1).kill();
}
function finishFocused(event: Event) {
  if (!(event.target instanceof Element)) return;
  if (years?.contains(event.target)) finish(yearsTween);
  const card = event.target.closest('[data-appointment]');
  if (card) { finish(cardTweens.get(card)); cardTweens.delete(card); }
}
list?.addEventListener('focusin', finishFocused);
list?.addEventListener('pointerdown', finishFocused);

function prepareList(initial = false) {
  if (!list) return;
  list.querySelectorAll<HTMLElement>('[data-group-label], [data-no-upcoming], [data-list-empty]').forEach(node => {
    if (prepared.has(node) || !node.getClientRects().length) return;
    prepared.add(node);
    if (!initial && node.getBoundingClientRect().top <= innerHeight * .9) return;
    gsap.from(node, {
      opacity: 0, y: 16, duration: .7, ease: 'power3.out', clearProps: 'opacity,transform',
      scrollTrigger: { trigger: node, start: 'top 90%', once: true },
    });
  });
  let visibleIndex = 0;
  list.querySelectorAll<HTMLElement>('[data-appointment]').forEach(card => {
    if (prepared.has(card) || !card.getClientRects().length) return;
    prepared.add(card);
    const visible = card.getBoundingClientRect().top <= innerHeight * .9;
    if (!initial && visible) return;
    // Fade through a CSS variable so hover and calendar changes retain their own opacity.
    const tween = gsap.fromTo(card, { '--program-card-reveal': 0 }, {
      '--program-card-reveal': 1, duration: .75, delay: visible ? .16 + visibleIndex++ * .1 : 0,
      ease: 'power2.out', immediateRender: true, clearProps: '--program-card-reveal',
      onComplete: () => { cardTweens.delete(card); },
      scrollTrigger: { trigger: card, start: 'top 90%', once: true },
    });
    cardTweens.set(card, tween);
    if (card.contains(document.activeElement)) { finish(tween); cardTweens.delete(card); }
  });
}

const media = gsap.matchMedia();
media.add('(prefers-reduced-motion: no-preference)', context => {
  if (!hero) return;
  if (!heroAnimated) {
    heroAnimated = true;
    gsap.from(hero.querySelectorAll('.page-hero__inner > *'), {
      opacity: 0, y: 24, duration: .95, stagger: .12, ease: 'power3.out', clearProps: 'opacity,transform',
    });
  }
  gsap.to(hero.querySelector('.contour'), {
    yPercent: 14, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .6 },
  });
  if (years && !yearsAnimated) {
    yearsAnimated = true;
    yearsTween = gsap.from(years.querySelectorAll('.section-head__text > *, .tabs'), {
      opacity: 0, y: 24, duration: .8, stagger: .12, ease: 'power3.out', clearProps: 'opacity,transform',
      scrollTrigger: { trigger: years, start: 'top 90%', once: true },
    });
    if (years.contains(document.activeElement)) finish(yearsTween);
  }
  const sync = context.add('syncProgramList', prepareList);
  sync(!listInitialized);
  listInitialized = true;
  const cta = document.querySelector('[data-program-cta]');
  if (cta) reveal(cta, cta);

  // Calendar regrouping moves existing cards; recalculate positions without replaying them.
  let frame = 0;
  const observer = new MutationObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => { sync(); ScrollTrigger.refresh(); });
  });
  if (list) observer.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
  return () => {
    observer.disconnect(); cancelAnimationFrame(frame); yearsTween = undefined;
    list?.querySelectorAll('[data-appointment]').forEach(card => cardTweens.delete(card));
  };
});

document.fonts.ready.then(() => ScrollTrigger.refresh());
