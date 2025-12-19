
export const urlListener = (apply: () => void) => {
  
  // Native events
  window.addEventListener("hashchange", apply);
  window.addEventListener("popstate", apply);

  // Monkey-patch history methods
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    apply();
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    apply();
  };

  return () => {
    window.removeEventListener("hashchange", apply);
    window.removeEventListener("popstate", apply);
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  };
};
