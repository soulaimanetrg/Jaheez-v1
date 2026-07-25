import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { previewCheckout } from '../../lib/orderApi';
import { BackendApiError } from '../../lib/apiError';
import type { CartItem, CheckoutItemInput, CheckoutQuote } from '@shared/types';

type QuoteCartItem = Pick<CartItem, 'menu_item_id' | 'quantity' | 'selected_options'>;

export function toCheckoutItems(items: QuoteCartItem[]): CheckoutItemInput[] {
  return items.map((item) => ({
    menu_item_id: item.menu_item_id,
    quantity: item.quantity,
    options: (item.selected_options || []).map((option) => ({
      option_id: option.option_id,
      choice_id: option.choice_id,
    })),
  }));
}

export function checkoutItemSignature(items: CheckoutItemInput[]): string {
  return items
    .map((item) => `${item.menu_item_id}:${item.quantity}:${(item.options || [])
      .map((option) => `${option.option_id}:${option.choice_id}`)
      .sort()
      .join(',')}`)
    .join('|');
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
  const itemSignature = useMemo(() => checkoutItemSignature(checkoutItems), [checkoutItems]);
  const requestSignature = `${storeId || ''}|${itemSignature}|${promoCode || ''}|${riderTip}`;
  const [debouncedRequest, setDebouncedRequest] = useState({
    checkoutItems,
    requestSignature,
    storeId,
    promoCode,
    riderTip,
  });

  useEffect(() => {
    // 400ms debounce — batches rapid +/- taps into a single API call.
    // With the progress bar approach, prices remain visible during the wait,
    // so a slightly longer batch window doesn't hurt perceived performance.
    const timer = setTimeout(() => {
      setDebouncedRequest({ checkoutItems, requestSignature, storeId, promoCode, riderTip });
    }, 400);
    return () => clearTimeout(timer);
  }, [checkoutItems, promoCode, requestSignature, riderTip, storeId]);

  const query = useQuery<CheckoutQuote>({
    queryKey: ['checkout-preview', debouncedRequest.requestSignature],
    enabled: Boolean(debouncedRequest.storeId && debouncedRequest.checkoutItems.length > 0),
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      if (!debouncedRequest.storeId) throw new Error('Store is required');
      const result = await previewCheckout({
        store_id: debouncedRequest.storeId,
        items: debouncedRequest.checkoutItems,
        payment_method: 'cash',
        promo_code: debouncedRequest.promoCode || null,
        rider_tip: debouncedRequest.riderTip,
      }, signal);
      if (result.error || !result.data) {
        throw new BackendApiError(result.error || 'Checkout preview failed', 0, result.error_code || 'checkout_preview_failed');
      }
      return result.data;
    },
    staleTime: 10 * 1000,
  });

  const [lastVerified, setLastVerified] = useState<{ signature: string; quote: CheckoutQuote } | null>(null);
  useEffect(() => {
    if (query.data && !query.isPlaceholderData && !query.isFetching) {
      setLastVerified({ signature: debouncedRequest.requestSignature, quote: query.data });
    }
  }, [debouncedRequest.requestSignature, query.data, query.isFetching, query.isPlaceholderData]);
  const displayedQuote = query.data ?? lastVerified?.quote;

  const isQuoteCurrent = Boolean(
    displayedQuote
    && debouncedRequest.requestSignature === requestSignature
    && lastVerified?.signature === requestSignature
    && !query.isFetching
    && !query.isPlaceholderData,
  );

  return {
    ...query,
    data: displayedQuote,
    requestSignature,
    isQuoteCurrent,
    isUpdating: Boolean(storeId && checkoutItems.length > 0 && !isQuoteCurrent),
  };
}
