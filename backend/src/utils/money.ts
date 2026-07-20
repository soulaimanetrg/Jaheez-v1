import { BadRequestError } from '../middleware/error.middleware';

const MAX_SAFE_DH = Math.floor(Number.MAX_SAFE_INTEGER / 100);

/** Convert an external DH value to exact integer centimes. */
export function parseDhToCentimes(value: unknown): number {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new BadRequestError('Montant DH invalide.');
  }
  const raw = String(value).trim();
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(raw) || (raw.includes('.') && raw.includes(','))) {
    throw new BadRequestError('Le montant DH doit contenir au maximum deux decimales.');
  }
  const normalized = raw.replace(',', '.');
  const [whole, fraction = ''] = normalized.split('.');
  const dh = Number(whole);
  if (!Number.isSafeInteger(dh) || dh > MAX_SAFE_DH) {
    throw new BadRequestError('Montant DH hors limites.');
  }
  const centimes = (dh * 100) + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(centimes) || centimes < 0) {
    throw new BadRequestError('Montant DH invalide.');
  }
  return centimes;
}

export function toCentimes(amount: number): number {
  return parseDhToCentimes(amount);
}

/**
 * Convert internal centimes to Moroccan Dirhams.
 */
export function toDirhams(centimes: number): number {
  return centimes / 100;
}

/**
 * Format an amount for the three applications. DH is the sole display label.
 */
export function formatCurrency(amount: number, isCentimes: boolean = false): string {
  const dh = isCentimes ? toDirhams(amount) : amount;
  return `${dh.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`;
}

export function moneyDto(centimes: number): number {
  return Number(toDirhams(Number(centimes || 0)).toFixed(2));
}
