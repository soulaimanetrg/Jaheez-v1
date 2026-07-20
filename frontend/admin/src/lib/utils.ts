import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely parse a date from an API record.
 * Handles both camelCase (createdAt) and snake_case (created_at) fields,
 * as well as undefined/null values. Returns null for invalid dates.
 */
export function safeDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(value as string | number);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format a date safely — returns fallback string if invalid.
 */
export function safeDateStr(
  value: unknown,
  formatter: (d: Date) => string,
  fallback = '—',
): string {
  const d = safeDate(value);
  return d ? formatter(d) : fallback;
}
