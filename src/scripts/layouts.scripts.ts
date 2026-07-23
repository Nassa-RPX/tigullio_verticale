import gsap from "gsap";

export const tigullioTimeline = gsap.timeline({ paused: true });

const mobileBreakpoint = "(max-width: 1199px)";

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

export function reverseTigullioTimelineForMobile(): Promise<void> {
  return new Promise((resolve) => {
    if (!window.matchMedia(mobileBreakpoint).matches) {
      resolve();
      return;
    }
    tigullioTimeline.reverse().then(() => resolve());
  });
}

window.addEventListener("load", () => {
  tigullioTimeline.play();
});
