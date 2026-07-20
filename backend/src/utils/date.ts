/**
 * Safely parse a date string and check validity
 */
export function isValidDate(dateStr: string): boolean {
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

/**
 * Return current ISO timestamp
 */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Calculate difference in seconds between two dates
 */
export function diffInSeconds(date1: Date | string | number, date2: Date | string | number): number {
  const t1 = new Date(date1).getTime();
  const t2 = new Date(date2).getTime();
  return Math.abs(Math.floor((t1 - t2) / 1000));
}
