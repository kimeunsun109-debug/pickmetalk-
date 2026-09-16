/** Only allow relative in-app paths after authentication. */
export function safeAuthNextPath(raw: string | null): string {
  if (
    !raw ||
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    raw.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(raw)
  ) {
    return "/characters";
  }

  return raw;
}
