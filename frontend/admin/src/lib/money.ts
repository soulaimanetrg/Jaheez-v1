export function formatDh(value: number, locale = 'fr-MA'): string {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `${safe.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`;
}
export function formatCentimesAsDh(centimes: number, locale = 'fr-MA'): string { return formatDh(Number(centimes || 0) / 100, locale); }
export function isValidDhInput(value: string): boolean { return /^\d+(?:[.,]\d{1,2})?$/.test(value.trim()) && !(value.includes('.') && value.includes(',')); }
