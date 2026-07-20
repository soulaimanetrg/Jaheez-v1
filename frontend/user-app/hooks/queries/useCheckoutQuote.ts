import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { previewCheckout } from '../../lib/orderApi';
import type { CartItem, CheckoutItemInput, CheckoutQuote } from '@shared/types';

type QuoteCartItem = Pick<CartItem, 'menu_item_id' | 'quantity' | 'selected_options'>;

export function toCheckoutItems(items: QuoteCartItem[]): CheckoutItemInput[] {
  return items.map((item) => ({
    menu_item_id: item.menu_item_id,
    quantity: item.quantity,
    options: (item.selected_options || []).map((option) => ({
      option_id: option.option_id,
      choice_id: option.choice_id,
      choice_name: option.choice_name,
    })),
  }));
}

export function useCheckoutQuote({
  storeId,
  items,
  promoCode,
  riderTip = 0,
}: {
  storeId: string | null | undefined;
  items: QuoteCartItem[];
  promoCode?: string | null;
  riderTip?: number;
}) {
  const checkoutItems = useMemo(() => toCheckoutItems(items), [items]);
  const itemSignature = useMemo(
    () => checkoutItems
      .map((item) => `${item.menu_item_id}:${item.quantity}:${(item.options || []).map(option => `${option.option_id}:${option.choice_id}`).join(',')}`)
      .join('|'),
    [checkoutItems],
  );

  return useQuery<CheckoutQuote>({
    queryKey: ['checkout-preview', storeId || '', itemSignature, promoCode || '', riderTip],
    enabled: Boolean(storeId && checkoutItems.length > 0),
    queryFn: async () => {
      if (!storeId) throw new Error('Store is required');
      const result = await previewCheckout({
        store_id: storeId,
        items: checkoutItems,
        payment_method: 'cash',
        promo_code: promoCode || null,
        rider_tip: riderTip,
      });
      if (result.error || !result.data) {
        throw new Error(result.error || 'Checkout preview failed');
      }
      return result.data;
    },
    staleTime: 10 * 1000,
  });
}
