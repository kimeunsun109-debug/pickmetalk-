export const BROWSER_SESSION_KEY = "pickmetalk:browser-session";

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
  } catch {
    /* ignore */
  }
}

/** No-op: in-app navigation must not clear the session marker. */
export function registerBrowserTab() {
  return () => {};
}
