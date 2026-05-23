import gsap from "gsap";
import { reverseTigullioTimelineForMobile } from "../layouts.scripts";

export const homeTimeline = gsap.timeline();

homeTimeline.fromTo(
  ".load-animation",
  {
    opacity: 0,
    y: 50,
  },
  {
    duration: 0.5,
    opacity: 1,
    y: 0,
    stagger: 0.2,
    ease: "power2.inOut",
  },
);

window.addEventListener("load", () => {
  const programBtn = document.querySelector("#program-btn");

  if (programBtn) {
    programBtn.addEventListener("click", () => {
      homeTimeline.reverse().then(() => {
        reverseTigullioTimelineForMobile().then(() => {
          const year = programBtn.getAttribute("data-year");
          window.location.href = `/programma/${year ?? "2025"}`;
        });
      });
    });
  }

  const newletterLink = document.querySelector("#newsletter");

  if (newletterLink) {
    newletterLink.addEventListener("click", (e) => {
      e.preventDefault();
      homeTimeline.reverse().then(() => {
        reverseTigullioTimelineForMobile().then(() => {
          window.location.href = "/newsletter";
        });
      });
    });
  }
});
