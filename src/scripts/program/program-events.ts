import { programTimeline } from "./program-animations";

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

