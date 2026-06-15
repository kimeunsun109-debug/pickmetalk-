import {
  BROWSER_SESSION_KEY,
  clearBrowserSessionMarker,
  markBrowserSessionActive,
} from "@/lib/auth/browserSession";

export { BROWSER_SESSION_KEY, markBrowserSessionActive };

const EXACT_KEYS = [
  "selectedCharacterId",
  "conversationId",
  "activeCharacterId",
  "pickmetalk-session",
  "pickmetalk:session",
  BROWSER_SESSION_KEY,
  "pickmetalk:open-tabs",
] as const;

const PREFIXES = ["sb-", "pickmetalk-"] as const;

function clearStorage(storage: Storage) {
  EXACT_KEYS.forEach((key) => storage.removeItem(key));

  const keysToRemove: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (!key) continue;
    if (PREFIXES.some((p) => key.startsWith(p))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => storage.removeItem(key));
}

/** Remove chat and auth cache left in the browser. */
export function clearClientSessionData() {
  if (typeof window === "undefined") return;

  try {
    clearBrowserSessionMarker();
    clearStorage(localStorage);
    clearStorage(sessionStorage);
  } catch {
    /* Private browsing modes may block storage access. */
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
