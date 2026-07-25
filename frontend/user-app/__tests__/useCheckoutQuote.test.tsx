import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { CheckoutQuote } from '@shared/types';
import { useCheckoutQuote } from '@/hooks/queries/useCheckoutQuote';
import { previewCheckout } from '@/lib/orderApi';

jest.mock('@/lib/orderApi', () => ({ previewCheckout: jest.fn() }));

const previewMock = previewCheckout as jest.MockedFunction<typeof previewCheckout>;
const storeId = '11111111-1111-4111-8111-111111111111';
const menuItemId = '22222222-2222-4222-8222-222222222222';

function quote(quantity: number): CheckoutQuote {
  return {
    ok: true,
    can_checkout: true,
    payment_method: 'cash',
    store_status: { is_open: true, label_fr: 'Ouvert', label_ar: 'مفتوح' },
    items: [{ menu_item_id: menuItemId, quantity, unit_price_dh: 10, line_total_dh: quantity * 10, options: [] }],
    subtotal_dh: quantity * 10,
    delivery_fee_dh: 5,
    service_fee_dh: 0,
    discount_dh: 0,
    rider_tip_dh: 0,
    total_dh: quantity * 10 + 5,
    promo: null,
  };
}

describe('cart quote debounce', () => {
  beforeEach(() => previewMock.mockReset());

  it('keeps one server preview for a rapid interaction burst and verifies only the final signature', async () => {
    previewMock.mockImplementation(async (input) => ({ data: quote(input.items[0].quantity), error: null }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result, rerender, unmount } = await renderHook<ReturnType<typeof useCheckoutQuote>, { quantity: number }>(
      ({ quantity }) => useCheckoutQuote({
        storeId,
        items: [{ menu_item_id: menuItemId, quantity, selected_options: [] }],
      }),
      { initialProps: { quantity: 1 }, wrapper },
    );

    await waitFor(() => expect(result.current.isQuoteCurrent).toBe(true), { timeout: 1500 });
    previewMock.mockClear();
    for (let quantity = 2; quantity <= 11; quantity += 1) await rerender({ quantity });

    await waitFor(() => expect(previewMock).toHaveBeenCalledTimes(1), { timeout: 1500 });
    await waitFor(() => expect(result.current.isQuoteCurrent).toBe(true));
    expect(previewMock.mock.calls[0][0].items[0].quantity).toBe(11);
    expect(result.current.data?.items[0].quantity).toBe(11);
    await unmount();
    client.clear();
  });
});
