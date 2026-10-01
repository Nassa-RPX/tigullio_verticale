import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

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
const revealed = new WeakSet<Element>();
let heroAnimated = false;
media.add('(prefers-reduced-motion: no-preference)', () => {
  if (!hero) return;
  const distance = matchMedia('(min-width: 861px)').matches ? 32 : 20;
  if (!heroAnimated) {
    heroAnimated = true;
    gsap.from(hero.querySelectorAll('.hero__inner > *'), {
      opacity: 0, y: distance, duration: 1, stagger: .14, ease: 'power3.out', clearProps: 'opacity,transform',
    });
    if (scrollLink) gsap.from(scrollLink, { opacity: 0, delay: .7, duration: .6, clearProps: 'opacity' });
  }
  gsap.to(hero.querySelector('.contour'), {
    yPercent: 18, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .6 },
  });

  const reveal = (targets: Element | Element[], trigger: Element, stagger = 0) => {
    const nodes = (Array.isArray(targets) ? targets : [targets]).filter(node => !revealed.has(node));
    if (!nodes.length) return;
    // Restored scroll positions and preference changes must not hide visible content.
    if (trigger.getBoundingClientRect().top <= innerHeight * .88) {
      nodes.forEach(node => revealed.add(node));
      return;
    }
    // Cards retain their CSS hover transform; GSAP only fades them.
    const move = !nodes.some(node => node.matches('.event-card'));
    gsap.from(nodes, {
      opacity: 0, ...(move ? { y: distance } : {}), duration: .85, stagger, ease: 'power3.out',
      immediateRender: true, clearProps: move ? 'opacity,transform' : 'opacity',
      onStart: () => { nodes.forEach(node => revealed.add(node)); },
      scrollTrigger: { trigger, start: 'top 88%', once: true },
    });
  };
  const ideaHead = idea?.querySelector('.idea-editorial__head');
  if (ideaHead) reveal(Array.from(ideaHead.children), ideaHead, .12);
  idea?.querySelectorAll('.idea-editorial__body > *').forEach(node => reveal(node, node));
  document.querySelectorAll('[data-home-reveal]:not(#idea)').forEach(section => {
    const heading = section.querySelector('.section-head');
    if (heading) reveal(Array.from(heading.children), heading, .09);
    section.querySelectorAll('.next-card:not([hidden]), [data-feature-empty]:not([hidden]), [data-home-season]:not([hidden]) .event-card, .feature, .band__inner > div')
      .forEach(node => reveal(node, node));
  });
});

// Fonts can move the section boundaries after the initial layout.
document.fonts.ready.then(() => ScrollTrigger.refresh());
