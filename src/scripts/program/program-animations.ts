import gsap from 'gsap';

export const programTimeline = gsap.timeline();

programTimeline.fromTo('#program-year', {
  y: -200,
  opacity: 0,
}, {
  duration: 0.4,
  y: 0,
  opacity: 1,
  ease: 'power2.inOut',
})

programTimeline.fromTo('.card', {
  y: 100,
  opacity: 0,
}, {
  duration: 0.2,
  y: 0,
  opacity: 1,
  ease: 'power2.inOut',
  stagger: 0.15,
})

