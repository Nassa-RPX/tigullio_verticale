import gsap from "gsap";

export const tigullioTimeline = gsap.timeline({ paused: true });

tigullioTimeline.fromTo(
  "#tv-tigullio",
  {
    scale: 1.5,
  },
  {
    scale: 1,
    duration: 0.5,
    ease: "power2.inOut",
  },
);

window.addEventListener("load", () => {
  tigullioTimeline.play();
});
