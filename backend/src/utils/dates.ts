/**
 * Due dates are stored as calendar dates (PostgreSQL DATE). Prisma represents
 * them as JS Dates at UTC midnight, so all date math here is done in UTC on
 * "YYYY-MM-DD" values.
 */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Today's calendar date ("YYYY-MM-DD") in the given IANA time zone. */
export function todayInTimeZone(tz = "UTC"): string {
  // en-CA formats dates as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: isValidTimeZone(tz) ? tz : "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Parses "YYYY-MM-DD" to a Date at UTC midnight, or null if invalid. */
export function parseDateOnly(value: string): Date | null {
  if (!DATE_ONLY.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  // Reject overflowed dates like 2026-02-31
  return date.toISOString().slice(0, 10) === value ? date : null;
}

export function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

/** Monday..Sunday week containing `today` (ISO weeks). */
export function weekRange(today: Date): { start: Date; end: Date } {
  const dayOfWeek = (today.getUTCDay() + 6) % 7; // Monday = 0
  const start = addDays(today, -dayOfWeek);
  return { start, end: addDays(start, 6) };
}
