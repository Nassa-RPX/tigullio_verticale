const mobileBreakpoint = "(max-width: 1199px)";

const isMobile = () => {
  if (!window.matchMedia(mobileBreakpoint).matches) return false;
  return true;
};
