import { DEFAULT_PHOTO_PUSH_TIMEZONE } from "@/services/photoPush/constants";

export function getPlanDayKey(
  date = new Date(),
  timeZone = DEFAULT_PHOTO_PUSH_TIMEZONE
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getWeekday(
  date = new Date(),
  timeZone = DEFAULT_PHOTO_PUSH_TIMEZONE
): number {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[wd] ?? 0;
}

export function getHourInTz(
  date = new Date(),
  timeZone = DEFAULT_PHOTO_PUSH_TIMEZONE
): number {
  const h = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hour12: false,
  }).format(date);
  return Number(h);
}

/** Build ISO timestamp for local wall-clock in timezone (approx via offset iteration). */
export function wallClockToUtc(
  planDay: string,
  hour: number,
  minute: number,
  timeZone = DEFAULT_PHOTO_PUSH_TIMEZONE
): string {
  const [y, m, d] = planDay.split("-").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hour - 9, minute));
  for (let i = 0; i < 4; i += 1) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(guess);
    const get = (t: string) =>
      Number(parts.find((p) => p.type === t)?.value ?? "0");
    const py = get("year");
    const pm = get("month");
    const pd = get("day");
    const ph = get("hour");
    const pmin = get("minute");
    if (py === y && pm === m && pd === d && ph === hour && pmin === minute) {
      return guess.toISOString();
    }
    const diffMin =
      (hour - ph) * 60 + (minute - pmin) + (d - pd) * 24 * 60;
    guess.setUTCMinutes(guess.getUTCMinutes() + diffMin);
  }
  return guess.toISOString();
}
