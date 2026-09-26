import { format, parse, parseISO } from "date-fns";

/**
 * Formats an ISO date string to dd/MM/yyyy.
 * Handles partial dates (YYYY-MM, YYYY) gracefully.
 */
export function formatDate(isoDate: string): string {
  // Full ISO date: "2026-02-09" or "2026-02-09T14:00:00.000Z"
  if (/^\d{4}-\d{2}-\d{2}/.test(isoDate)) {
    return format(parseISO(isoDate), "dd/MM/yyyy");
  }
  // Month only: "2026-02"
  if (/^\d{4}-\d{2}$/.test(isoDate)) {
    return format(parseISO(`${isoDate}-01`), "MM/yyyy");
  }
  // Year only: "2026"
  if (/^\d{4}$/.test(isoDate)) return isoDate;
  // Fallback — return as-is
  return isoDate;
}

/**
 * Formats an ISO date string to dd/MM/yyyy HH:mm.
 */
export function formatDateTime(isoDate: string): string {
  return format(parseISO(isoDate), "dd/MM/yyyy HH:mm");
}

/**
 * Parses a YYYY-MM-DD string into a Date object.
 * Returns undefined for empty/invalid strings.
 */
export function parseDate(str: string): Date | undefined {
  if (!str) return undefined;
  const parsed = parse(str, "yyyy-MM-dd", new Date());
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

/**
 * Formats a Date to a YYYY-MM-DD string.
 * Returns empty string if date is undefined.
 */
export function formatDateString(date: Date | undefined): string {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
}

/**
 * Parses a pair of YYYY-MM-DD strings into Date objects for range pickers.
 */
export function parseDateRange(
  fromStr: string,
  toStr: string,
): { from: Date | undefined; to: Date | undefined } {
  return { from: parseDate(fromStr), to: parseDate(toStr) };
}
