import type { CartLanguage } from './cartFormatters';

const COPY = {
  fr: {
    title: 'Panier',
    emptyTitle: 'Votre panier est vide',
    emptySub: 'Choisissez des articles dans un magasin proche.',
    startShopping: 'Commencer',
    unknownStore: 'Magasin',
    minutes: 'min',
    promo: 'Code promo',
    add: 'Ajouter',
    cancel: 'Annuler',
    confirm: 'Valider mon panier',
    storeClosed: 'Magasin fermé',
    closedNow: 'La commande ne peut pas être finalisée maintenant.',
    quoteLoading: 'Mise à jour des prix…',
    quoteUnavailable: 'Prix indisponibles',
    retry: 'Réessayer',
    tooManyUpdates: 'Trop de mises à jour. Patientez puis réessayez.',
    itemUnavailable: 'Un article n’est plus disponible.',
    closedError: 'Le magasin est actuellement fermé.',
    quoteError: 'Impossible de mettre les prix à jour. Réessayez.',
    orderedFrom: 'Commandé chez',
    goToStore: 'Aller au magasin',
    remove: 'Supprimer',
    edit: 'Modifier',
    articlesLabel: 'articles',
    clearCartTitle: 'Vider le panier',
    clearCartConfirmMessage: 'Voulez-vous vraiment vider votre panier ?',
    clearCartConfirmLabel: 'Vider',
    clearCartCancelLabel: 'Annuler',
    quantityUpdateFailed: 'Impossible de modifier la quantité.',
    itemRemoveFailed: 'Impossible de supprimer l’article.',
    priceChanged: 'Le prix de certains articles a changé.',
    outOfStock: 'Article en rupture de stock.',
    decreaseQtyHint: 'Diminuer la quantité de 1',
    increaseQtyHint: 'Augmenter la quantité de 1',
    removeItemHint: 'Supprimer cet article du panier',
    editItemHint: 'Modifier les options de cet article',
  },
  en: {
    title: 'Cart',
    emptyTitle: 'Your cart is empty',
    emptySub: 'Choose items from a nearby store and they will appear here.',
    startShopping: 'Start shopping',
    unknownStore: 'Store',
    minutes: 'min',
    promo: 'Promo code',
    add: 'Add',
    cancel: 'Cancel',
    confirm: 'Validate my cart',
    storeClosed: 'Store closed',
    closedNow: 'The order cannot be completed right now.',
    quoteLoading: 'Updating prices…',
    quoteUnavailable: 'Could not update prices',
    retry: 'Retry',
    tooManyUpdates: 'Too many updates. Wait a moment and retry.',
    itemUnavailable: 'One item is no longer available.',
    closedError: 'The store is currently closed.',
    quoteError: 'Prices could not be updated. Retry.',
    orderedFrom: 'Ordered from',
    goToStore: 'Go to store',
    remove: 'Remove',
    edit: 'Edit',
    articlesLabel: 'items',
    clearCartTitle: 'Clear Cart',
    clearCartConfirmMessage: 'Are you sure you want to remove all items from your cart?',
    clearCartConfirmLabel: 'Clear',
    clearCartCancelLabel: 'Cancel',
    quantityUpdateFailed: 'Could not update quantity.',
    itemRemoveFailed: 'Could not remove item.',
    priceChanged: 'Some item prices have changed.',
    outOfStock: 'Item is out of stock.',
    decreaseQtyHint: 'Decrease quantity by 1',
    increaseQtyHint: 'Increase quantity by 1',
    removeItemHint: 'Remove this item from cart',
    editItemHint: 'Edit options for this item',
  },
  ar: {
    title: 'السلة',
    emptyTitle: 'السلة فارغة',
    emptySub: 'اختر منتجاتك من متجر قريب وستظهر هنا.',
    startShopping: 'ابدأ التسوق',
    unknownStore: 'المتجر',
    minutes: 'دقيقة',
    promo: 'كود الخصم',
    add: 'إضافة',
    cancel: 'إلغاء',
    confirm: 'تأكيد السلة',
    storeClosed: 'المتجر مغلق',
    closedNow: 'لا يمكن إتمام الطلب حالياً.',
    quoteLoading: 'جاري تحديث الأسعار…',
    quoteUnavailable: 'تعذر تحديث الأسعار',
    retry: 'إعادة المحاولة',
    tooManyUpdates: 'طلبات كثيرة. انتظر قليلاً ثم أعد المحاولة.',
    itemUnavailable: 'أحد المنتجات لم يعد متاحاً.',
    closedError: 'المتجر مغلق حالياً.',
    quoteError: 'تعذر تحديث الأسعار. أعد المحاولة.',
    orderedFrom: 'طلب من',
    goToStore: 'الذهاب للمتجر',
    remove: 'حذف',
    edit: 'تعديل',
    articlesLabel: 'منتجات',
    clearCartTitle: 'مسح السلة',
    clearCartConfirmMessage: 'هل تريد بالتأكيد إزالة جميع العناصر من السلة؟',
    clearCartConfirmLabel: 'مسح',
    clearCartCancelLabel: 'إلغاء',
    quantityUpdateFailed: 'تعذر تعديل الكمية.',
    itemRemoveFailed: 'تعذر حذف المنتج.',
    priceChanged: 'تغيرت أسعار بعض المنتجات.',
    outOfStock: 'المنتج غير متوفر حالياً.',
    decreaseQtyHint: 'إنقاص الكمية بمقدار 1',
    increaseQtyHint: 'زيادة الكمية بمقدار 1',
    removeItemHint: 'حذف هذا المنتج من السلة',
    editItemHint: 'تعديل خيارات هذا المنتج',
  },
} as const;

export function cartCopy(lang: CartLanguage) {
  return COPY[lang] || COPY.fr;
}

export function formatArticlesCount(count: number, lang: CartLanguage): string {
  if (lang === 'ar') {
    if (count === 1) return 'منتج واحد';
    if (count === 2) return 'منتجان';
    if (count >= 3 && count <= 10) return `${count} منتجات`;
    return `${count} منتجاً`;
  }
  if (lang === 'en') {
    return count === 1 ? '1 item' : `${count} items`;
  }
  return count === 1 ? '1 article' : `${count} articles`;
}

export function cartQuoteErrorCopy(code: string, lang: CartLanguage): string {
  const copy = cartCopy(lang);
  if (code === 'checkout_preview_rate_limited' || code === 'too_many_requests') return copy.tooManyUpdates;
  if (code === 'cart_item_unavailable' || code === 'cart_item_store_mismatch') return copy.itemUnavailable;
  if (code === 'store_closed') return copy.closedError;
  return copy.quoteError;
}
