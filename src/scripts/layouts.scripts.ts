import gsap from 'gsap';
window.addEventListener('load', () => {
  gsap.fromTo('#tv-tigullio', {
    scale: 2,
  }, {
    scale: 1,
    duration: 1,
    ease: 'power2.inOut',
  })
})

