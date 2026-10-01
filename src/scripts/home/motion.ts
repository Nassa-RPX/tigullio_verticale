import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { createScrollReveal } from '../scroll-reveal';
import { animateHeroLogo } from './logo-motion';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const hero = document.querySelector<HTMLElement>('[data-home-motion]');
const idea = document.getElementById('idea');
const scrollLink = document.querySelector<HTMLAnchorElement>('[data-home-scroll]');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let scrollTween: gsap.core.Tween | undefined;

scrollLink?.addEventListener('click', event => {
  if (!idea || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  scrollTween?.kill();
  const arrive = () => {
    idea.focus({ preventScroll: true });
    if (location.hash !== '#idea') history.pushState(null, '', '#idea');
  };
  if (reducedMotion.matches) {
    idea.scrollIntoView({ behavior: 'instant', block: 'start' });
    arrive();
  } else {
    // Native smooth scrolling would compete with GSAP and trigger autoKill.
    const rootStyle = document.documentElement.style;
    const previousBehavior = rootStyle.scrollBehavior;
    rootStyle.scrollBehavior = 'auto';
    const restoreBehavior = () => { rootStyle.scrollBehavior = previousBehavior; };
    scrollTween = gsap.to(window, {
      duration: 1.05, ease: 'power3.inOut', scrollTo: { y: idea, autoKill: true },
      onComplete: () => { restoreBehavior(); arrive(); }, onInterrupt: restoreBehavior,
    });
  }
});
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) scrollTween?.kill(); });

const media = gsap.matchMedia();
const reveal = createScrollReveal();
let heroAnimated = false;
media.add('(prefers-reduced-motion: no-preference)', () => {
  if (!hero) return;
  const distance = matchMedia('(min-width: 861px)').matches ? 32 : 20;
  let resetLogo: (() => void) | undefined;
  if (!heroAnimated) {
    heroAnimated = true;
    const logo = hero.querySelector<HTMLElement>('.hero__logo');
    if (logo) resetLogo = animateHeroLogo(logo);
    gsap.fromTo(hero.querySelectorAll('.hero__wordmark, .hero__cta'),
      { opacity: 0, y: distance },
      { opacity: 1, y: 0, delay: .35, duration: .85, stagger: .14, ease: 'power3.out' },
    );
    if (scrollLink) gsap.fromTo(scrollLink, { opacity: 0 }, { opacity: 1, delay: .7, duration: .6 });
  }
  gsap.to(hero.querySelector('.contour'), {
    yPercent: 18, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .6 },
  });

  const ideaHead = idea?.querySelector('.idea-editorial__head');
  if (ideaHead) reveal(Array.from(ideaHead.children), ideaHead, .12);
  idea?.querySelectorAll('.idea-editorial__body > *').forEach(node => reveal(node, node));
  document.querySelectorAll('[data-home-reveal]:not(#idea)').forEach(section => {
    const heading = section.querySelector('.section-head');
    if (heading) reveal(Array.from(heading.children), heading, .09);
    section.querySelectorAll('.next-card:not([hidden]), [data-feature-empty]:not([hidden]), [data-home-season]:not([hidden]) .event-card, .feature, .band__inner > div')
      .forEach(node => reveal(node, node));
  });
  return () => resetLogo?.();
});

// Fonts can move the section boundaries after the initial layout.
document.fonts.ready.then(() => ScrollTrigger.refresh());
