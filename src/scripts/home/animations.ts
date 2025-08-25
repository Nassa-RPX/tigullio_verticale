import gsap from 'gsap';


gsap.fromTo('#tv-tigullio', {
  scale: 1.3,
}, {
  scale: 1,
  ease: 'power2.inOut',
})

const timeline = gsap.timeline();

timeline.fromTo('.load-animation', {
  opacity: 0,
  y: 50
}, {
  duration: 0.5,
  opacity: 1,
  y: 0,
  stagger: 0.2,
  ease: 'power2.inOut'
})

