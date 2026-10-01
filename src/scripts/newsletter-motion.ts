import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createScrollReveal } from './scroll-reveal';

gsap.registerPlugin(ScrollTrigger);
const hero = document.querySelector('[data-newsletter-motion]');
const formPanel = document.querySelector('[data-newsletter-form-panel]');
const reveal = createScrollReveal();
let heroAnimated = false;
let benefitsAnimated = false;
let formTween: gsap.core.Tween | undefined;

function finishFormEntrance() {
  if (!formTween) return;
  formTween.scrollTrigger?.kill(false, true);
  formTween.progress(1).kill();
  formTween = undefined;
}
formPanel?.addEventListener('focusin', finishFormEntrance);
formPanel?.addEventListener('pointerdown', finishFormEntrance);

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
  const benefits = document.querySelector('[data-newsletter-benefits]');
  if (benefits && !benefitsAnimated) {
    benefitsAnimated = true;
    const titles = Array.from(benefits.children).filter(node => node.matches('.kicker, h2'));
    gsap.fromTo([...titles, ...benefits.querySelectorAll('.feature')],
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: .85, stagger: .14, ease: 'power3.out',
        scrollTrigger: { trigger: benefits, start: 'top 88%', once: true } },
    );
  }
  if (formPanel && !formPanel.contains(document.activeElement)) formTween = reveal(formPanel, formPanel);
  const program = document.querySelector('[data-newsletter-program]');
  if (program) reveal(program, program);
});

// Validation errors and success change the form height and the next section's position.
let refreshFrame = 0;
if (formPanel && typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(() => {
    cancelAnimationFrame(refreshFrame);
    refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
  }).observe(formPanel);
}
document.fonts.ready.then(() => ScrollTrigger.refresh());
