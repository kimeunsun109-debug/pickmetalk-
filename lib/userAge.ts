/** birth_date(YYYY-MM-DD) → 만 나이 (한국 서비스 기본) */
export function ageFromBirthDate(birthDate: string | null | undefined): number | null {
  if (!birthDate?.trim()) return null;
  const m = birthDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const born = new Date(y, mo, d);
  if (Number.isNaN(born.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const md = today.getMonth() - born.getMonth();
  if (md < 0 || (md === 0 && today.getDate() < born.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

export function isBirthdayToday(
  birthDate: string | null | undefined,
  timeZone = "Asia/Seoul"
): boolean {
  if (!birthDate?.trim()) return false;
  const m = birthDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return false;
  const [, , month, day] = m;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [tMonth, tDay] = today.split("-");
  return month === tMonth && day === tDay;
}
