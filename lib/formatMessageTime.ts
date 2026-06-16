export function formatBubbleTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateSeparator(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export function shouldShowDateSeparator(
  prevIso: string | undefined,
  currentIso: string
): boolean {
  if (!prevIso) return true;
  return (
    new Date(prevIso).toDateString() !== new Date(currentIso).toDateString()
  );
}

export function truncatePreview(text: string, max = 42): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max)}…`;
}
