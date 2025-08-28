import gsap from 'gsap';

export const homeTimeline = gsap.timeline();

window.addEventListener('load', () => {
  homeTimeline.fromTo('.load-animation', {
    opacity: 0,
    y: 50
  }, {
    duration: 0.5,
    opacity: 1,
    y: 0,
    stagger: 0.2,
    ease: 'power2.inOut'
  })

  const programBtn = document.querySelector('#program-btn');

  if (programBtn) {
    programBtn.addEventListener('click', () => {
      homeTimeline.reverse().then(() => {
        const year = programBtn.getAttribute('data-year');
        window.location.href = `/programma/${year ?? '2025'}`;
      });
    });
  }
})
