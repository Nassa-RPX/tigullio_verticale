import gsap from 'gsap';

export const programTimeline = gsap.timeline();

window.addEventListener('load', () => {
  programTimeline.fromTo('.page-title-container', {
    opacity: 0,
    y: -150
  }, {
    duration: 0.3,
    opacity: 1,
    y: 0,
    ease: 'power2.inOut'
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

  // EVENTS
  const dateContainers = document.querySelectorAll('.card');
  dateContainers.forEach((container) => {
    const year = container.getAttribute('data-year');
    const slug = container.getAttribute('data-slug');

    if (year && slug) {
      container.addEventListener('click', () => {
        programTimeline.reverse().then(() => {
          const url = `/programma/${year}/${slug}`;
          window.location.href = url;
        })
      })
    }
  })

  const goBack = document.getElementById('program-go-back');

  if (goBack) {
    goBack.addEventListener('click', (e) => {
      e.preventDefault();
      programTimeline.reverse().then(() => {
        const href = goBack.getAttribute('href');
        if (href) window.location.href = href;
      });
    });
  }
})
