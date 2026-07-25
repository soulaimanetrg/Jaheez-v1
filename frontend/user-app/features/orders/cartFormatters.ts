export type CartLanguage = 'ar' | 'fr' | 'en';

export function formatCartMoney(value: unknown): string {
  const amount = Number(value || 0);
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${safe.toFixed(2).replace('.', ',')} DH`;
}

export function parseCartBilingual(
  text: string | null | undefined,
  lang: CartLanguage,
  fallback = '',
): string {
  if (!text) return fallback;
  const parts = text.split('|');
  if (parts.length > 1) return (lang === 'ar' ? parts[0] : parts[1] || parts[0] || '').trim();
  return text.trim();
}
