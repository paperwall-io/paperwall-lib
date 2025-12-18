import pw from "@lib/main";

export const urlListener = () => {
  
  // Native events
  window.addEventListener("hashchange", pw.reset);
  window.addEventListener("popstate", pw.reset);

  // Monkey-patch history methods
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    pw.reset();
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    pw.reset();
  };

  return () => {
    window.removeEventListener("hashchange", pw.reset);
    window.removeEventListener("popstate", pw.reset);
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  };
};
