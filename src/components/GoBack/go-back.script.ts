import { tigullioTimeline } from "@/scripts/layouts.scripts";

const goBackLink = document.querySelector<HTMLAnchorElement>(".go-back")!;

goBackLink.addEventListener("click", async (e) => {
  console.log("Go back link clicked");
  e.preventDefault();
  const href = goBackLink.getAttribute("href");
  if (!href) return;
  if (isMobile()) await tigullioTimeline.reverse();
  window.location.href = href;
});
