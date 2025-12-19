
export const urlListener = (onNav: () => void) => {
  
  // Native events
  window.addEventListener("hashchange", onNav);
  window.addEventListener("popstate", onNav);

  // Monkey-patch history methods
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    onNav();
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    onNav();
  };

  return () => {
    window.removeEventListener("hashchange", onNav);
    window.removeEventListener("popstate", onNav);
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  };
};
