export function formatDh(value: unknown, fractionDigits = 2) {
  const amount = Number(value || 0);
  const safe = Number.isFinite(amount) ? amount : 0;
  const suffix = 'DH';
  return `${safe.toLocaleString('fr-MA', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })} ${suffix}`;
}
