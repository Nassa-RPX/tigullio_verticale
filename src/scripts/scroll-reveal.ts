import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function createScrollReveal() {
  const revealed = new WeakSet<Element>();
  return (targets: Element | Element[], trigger: Element, stagger = 0) => {
    const nodes = (Array.isArray(targets) ? targets : [targets]).filter(node => !revealed.has(node));
    if (!nodes.length) return;
    // Never hide content already visible after scroll restoration or preference changes.
    if (trigger.getBoundingClientRect().top <= innerHeight * .88) {
      nodes.forEach(node => revealed.add(node));
      return;
    }
    // Keep the card hover transform under CSS control.
    const move = !nodes.some(node => node.matches('.event-card'));
    const distance = matchMedia('(min-width: 861px)').matches ? 32 : 20;
    return gsap.from(nodes, {
      opacity: 0, ...(move ? { y: distance } : {}), duration: .85, stagger, ease: 'power3.out',
      immediateRender: true, clearProps: move ? 'opacity,transform' : 'opacity',
      onStart: () => { nodes.forEach(node => revealed.add(node)); },
      scrollTrigger: { trigger, start: 'top 88%', once: true },
    });
  };
}
