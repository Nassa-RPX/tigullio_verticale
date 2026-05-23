import { homeTimeline } from "@/scripts/home/animations";
import { tigullioTimeline } from "@/scripts/layouts.scripts";
import { programTimeline } from "@/scripts/program.script";
import gsap from "gsap";

const btn = document.querySelector<HTMLButtonElement>(".drawer-icon")!;
const panel = document.querySelector<HTMLElement>("#drawer-panel")!;
const overlay = document.querySelector<HTMLElement>("#drawer-overlay")!;
const navLinks = panel.querySelectorAll<HTMLAnchorElement>(".drawer-panel__nav a");
const bars = btn.querySelectorAll<HTMLElement>(".drawer-icon__bar");

const style = getComputedStyle(document.documentElement);
const colorOpen = style.getPropertyValue("--fg").trim();

let isOpen = false;
let isClosing = false;

const map: Record<string, gsap.core.Timeline | undefined> = {
  "/": homeTimeline,
  "/programma": programTimeline,
  "/newsletter": undefined,
  "chi-siamo": undefined,
};

const openTl = gsap
  .timeline({ paused: true })
  // Overlay fade-in
  .to(overlay, {
    opacity: 1,
    duration: 0.3,
    ease: "power2.out",
    onStart() {
      overlay.style.pointerEvents = "auto";
    },
  })
  // Panel slides in from the right
  .to(
    panel,
    {
      x: "0%",
      duration: 0.45,
      ease: "power3.out",
    },
    "<",
  )
  // Bars color: --bg → --fg
  .to(bars, { backgroundColor: colorOpen, duration: 0.25, ease: "power2.inOut" }, "<")
  // Hamburger → X morph
  .to(bars[0], { y: 7, rotation: 45, duration: 0.25, ease: "power2.inOut" }, "<0.1")
  .to(bars[1], { opacity: 0, duration: 0.15, ease: "power2.inOut" }, "<")
  .to(bars[2], { y: -7, rotation: -45, duration: 0.25, ease: "power2.inOut" }, "<")
  // Stagger nav links
  .to(
    navLinks,
    {
      opacity: 1,
      x: 0,
      duration: 0.35,
      ease: "power2.out",
      stagger: 0.07,
    },
    "-=0.15",
  );

function openDrawer() {
  if (isClosing) return;

  isOpen = true;
  btn.setAttribute("aria-expanded", "true");
  panel.setAttribute("aria-hidden", "false");
  overlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  openTl.play();
}

async function closeDrawer() {
  if (isClosing) return openTl.then();
  if (!isOpen) return Promise.resolve();

  isClosing = true;
  isOpen = false;
  btn.setAttribute("aria-expanded", "false");

  return openTl.reverse().then(() => {
    panel.setAttribute("aria-hidden", "true");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.pointerEvents = "none";
    document.body.style.overflow = "";
    isClosing = false;
  });
}

btn.addEventListener("click", () => {
  isOpen ? closeDrawer() : openDrawer();
});

navLinks.forEach((link) => {
  link.addEventListener("click", async (event) => {
    event.preventDefault();
    const href = link.getAttribute("href");
    if (!href || !isOpen) return;

    const nextUrl = new URL(href, window.location.href);

    await closeDrawer();
    const currentTimeline = map[window.location.pathname];
    if (currentTimeline) await currentTimeline.reverse();
    if (isMobile()) await tigullioTimeline.reverse();

    if (nextUrl.href !== window.location.href) {
      window.location.href = nextUrl.href;
    }
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isOpen) closeDrawer();
});
