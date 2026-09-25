/**
 * Dates as three fields, never as a native picker.
 *
 * A native `<input type="date">` renders in the browser's locale, so the same
 * form shows `mm/dd/yyyy` on one clinic machine and `dd/mm/yyyy` on the next.
 * `03/04` is a valid date read either way, so a transposition produces no
 * error anywhere — it lands in the registry, and every age, disease duration
 * and milestone interval derived from it inherits the mistake silently.
 *
 * Three labelled boxes cannot be read in the wrong order.
 */

export interface DateParts {
  day: string;
  month: string;
  year: string;
}

export const EMPTY_DATE: DateParts = { day: '', month: '', year: '' };

export function isDateEmpty(parts: DateParts): boolean {
  return !parts.day && !parts.month && !parts.year;
}

/**
 * The ISO date these parts describe, or null when they are incomplete or do
 * not name a real day. The round trip through Date catches 31 February, which
 * a range check on each field on its own would let through.
 */
export function toIsoDate(parts: DateParts): string | null {
  const day = Number(parts.day);
  const month = Number(parts.month);
  const year = Number(parts.year);

  if (!parts.day || !parts.month || !parts.year) return null;
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const candidate = new Date(Date.UTC(year, month - 1, day));

  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return null;
  }

  return candidate.toISOString().slice(0, 10);
}

export function isFutureDate(iso: string): boolean {
  return iso > new Date().toISOString().slice(0, 10);
}

/** Renders an ISO date the way it is written here: 02/03/1964. */
export function formatDate(iso: string | null): string {
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}
