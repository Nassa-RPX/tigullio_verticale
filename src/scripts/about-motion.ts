import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createScrollReveal } from './scroll-reveal';

gsap.registerPlugin(ScrollTrigger);
const hero = document.querySelector('[data-about-motion]');
const reveal = createScrollReveal();
let heroAnimated = false;
const media = gsap.matchMedia();

media.add('(prefers-reduced-motion: no-preference)', () => {
  if (!hero) return;
  if (!heroAnimated) {
    heroAnimated = true;
    gsap.fromTo(hero.querySelectorAll('.page-hero__inner > *'),
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: .95, stagger: .12, ease: 'power3.out' },
    );
  }
  gsap.to(hero.querySelector('.contour'), {
    yPercent: 14, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .6 },
  });

  document.querySelectorAll('[data-about-reveal]').forEach(section => {
    section.querySelectorAll('.section-head, .section-head__text').forEach(head => {
      const titles = Array.from(head.children).filter(node => node.matches('.kicker, h2, .lede'));
      if (titles.length) reveal(titles, titles[0], .1);
    });
    section.querySelectorAll('.prose > p, .section-head__text > p:not(.lede), .container > p').forEach(node => {
      // Animate a panel once as a whole, avoiding nested opacity/transform tweens.
      if (!node.closest('.panel, .figure-card, .timeline__item')) reveal(node, node);
    });
    section.querySelectorAll('.figure-card, .timeline__item, .grid > .panel, .container > .panel, .band__inner > div:last-child')
      .forEach(node => reveal(node, node));
  });
});

document.fonts.ready.then(() => ScrollTrigger.refresh());
