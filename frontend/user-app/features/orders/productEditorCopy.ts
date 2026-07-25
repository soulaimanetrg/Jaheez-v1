import type { CartLanguage } from './cartFormatters';

const COPY = {
  fr: { add: 'Ajouter au panier', update: 'Mettre à jour', retry: 'Réessayer', decrease: 'Diminuer la quantité', increase: 'Augmenter la quantité', review: 'avis' },
  en: { add: 'Add to cart', update: 'Update item', retry: 'Retry', decrease: 'Decrease quantity', increase: 'Increase quantity', review: 'reviews' },
  ar: { add: 'إضافة إلى السلة', update: 'تحديث المنتج', retry: 'إعادة المحاولة', decrease: 'تقليل الكمية', increase: 'زيادة الكمية', review: 'تقييم' },
} as const;

export function productEditorCopy(lang: CartLanguage) {
  return COPY[lang];
}
