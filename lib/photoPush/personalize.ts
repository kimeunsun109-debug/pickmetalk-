/** Interpolate {name} in captions — natural Korean honorific optional */
export function personalizeCaption(
  template: string,
  displayName: string | null | undefined
): string {
  const name = displayName?.trim();
  if (!name) {
    return template
      .replace(/\{name\}~?\s*/g, "")
      .replace(/\{name\}/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  return template.replace(/\{name\}/g, name);
}

export function captionFingerprint(caption: string): string {
  return caption.replace(/\s+/g, " ").trim().slice(0, 64);
}
