

import gsap from 'gsap';

// ANIMATIONS
export const eventTimeline = gsap.timeline();

window.addEventListener('load', () => {
  eventTimeline.fromTo('.page-title-container', {
    opacity: 0,
    y: -150
  }, {
    duration: 0.3,
    opacity: 1,
    y: 0,
    ease: 'power2.inOut'
  })

  eventTimeline.fromTo('.date-description', {
    opacity: 0,
  }, {
    duration: 0.3,
    opacity: 1,
    ease: 'power2.inOut'
  })


  eventTimeline.fromTo('.card', {
    opacity: 0,
    y: 50,
  }, {
    duration: 0.3,
    opacity: 1,
    y: 0,
    ease: 'power2.inOut',
    stagger: 0.2,
  })

  // EVENT HANDLERS
  const goBack = document.getElementById('event-go-back');

  if (goBack) {
    goBack.addEventListener('click', (e) => {
      e.preventDefault();
      eventTimeline.reverse().then(() => {
        const href = goBack.getAttribute('href');
        if (href) window.location.href = href;
      });
    });
  }
});




