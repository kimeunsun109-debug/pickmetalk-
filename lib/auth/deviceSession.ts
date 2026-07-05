export const DEVICE_SESSION_KEY = "pickmetalk:device-session";

function randomSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getDeviceSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(DEVICE_SESSION_KEY);
  } catch {
    return null;
  }
}

export function ensureDeviceSessionId(): string {
  if (typeof window === "undefined") return "";

  try {
    const existing = localStorage.getItem(DEVICE_SESSION_KEY);
    if (existing) return existing;
    const created = randomSessionId();
    localStorage.setItem(DEVICE_SESSION_KEY, created);
    return created;
  } catch {
    return randomSessionId();
  }
}

export function setDeviceSessionId(id: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEVICE_SESSION_KEY, id);
  } catch {
    /* ignore */
  }
}

export function clearDeviceSessionId() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DEVICE_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function deviceSessionHeaders(): Record<string, string> {
  const id = getDeviceSessionId();
  return id ? { "X-Device-Session": id } : {};
}
