export const BROWSER_SESSION_KEY = "pickmetalk:browser-session";
const OPEN_TABS_KEY = "pickmetalk:open-tabs";

/** Mark this browser profile as logged in (shared across tabs/windows). */
export function markBrowserSessionActive() {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(BROWSER_SESSION_KEY, "active");
  } catch {
    /* Private browsing may block storage. */
  }
}

export function hasActiveBrowserSession(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return localStorage.getItem(BROWSER_SESSION_KEY) === "active";
  } catch {
    return false;
  }
}

export function clearBrowserSessionMarker() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(BROWSER_SESSION_KEY);
    localStorage.removeItem(OPEN_TABS_KEY);
  } catch {
    /* ignore */
  }
}

/** Track open tabs; clear session marker when the last tab/window closes. */
export function registerBrowserTab() {
  if (typeof window === "undefined") return () => {};

  try {
    const count = Number(localStorage.getItem(OPEN_TABS_KEY) ?? "0") + 1;
    localStorage.setItem(OPEN_TABS_KEY, String(count));
  } catch {
    return () => {};
  }

  const onPageHide = () => {
    try {
      const next = Number(localStorage.getItem(OPEN_TABS_KEY) ?? "1") - 1;
      if (next <= 0) {
        localStorage.removeItem(OPEN_TABS_KEY);
        localStorage.removeItem(BROWSER_SESSION_KEY);
        return;
      }
      localStorage.setItem(OPEN_TABS_KEY, String(next));
    } catch {
      /* ignore */
    }
  };

  window.addEventListener("pagehide", onPageHide);
  return () => window.removeEventListener("pagehide", onPageHide);
}
