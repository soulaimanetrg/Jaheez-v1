import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { CheckoutLinePreview, MenuItemOption } from '@shared/types';
import { useProductLinePreview } from '@/hooks/queries/useProductLinePreview';
import { previewCheckoutLine } from '@/features/orders/services/orderApi';

jest.mock('@/features/orders/services/orderApi', () => ({
  checkoutLineSignature: (item: { menu_item_id: string; quantity: number; options?: Array<{ option_id: string; choice_id: string }> }) =>
    `${item.menu_item_id}|${item.quantity}|${(item.options || []).map((option) => `${option.option_id}:${option.choice_id}`).sort().join('|')}`,
  previewCheckoutLine: jest.fn(),
}));

const previewMock = previewCheckoutLine as jest.MockedFunction<typeof previewCheckoutLine>;
const groups: MenuItemOption[] = [];
const storeId = '11111111-1111-4111-8111-111111111111';
const menuItemId = '22222222-2222-4222-8222-222222222222';

function response(quantity: number): CheckoutLinePreview {
  return {
    ok: true,
    signature: `${menuItemId}|${quantity}|`,
    availability: { is_available: true, code: 'available' },
    item: {
      menu_item_id: menuItemId,
      quantity,
      unit_price_dh: 10,
      line_total_dh: quantity * 10,
      options: [],
    },
  };
}

describe('authoritative product line preview', () => {
  beforeEach(() => previewMock.mockReset());

  it('collapses rapid quantity edits into one request for the final value', async () => {
    previewMock.mockImplementation(async (input) => ({ data: response(input.item.quantity), error: null }));
    const { result, rerender } = await renderHook<ReturnType<typeof useProductLinePreview>, { quantity: number }>(
      ({ quantity }) => useProductLinePreview({ visible: true, storeId, menuItemId, quantity, groups, selections: {} }),
      { initialProps: { quantity: 1 } },
    );

    for (let quantity = 2; quantity <= 10; quantity += 1) await rerender({ quantity });

    await waitFor(() => expect(previewMock).toHaveBeenCalledTimes(1), { timeout: 1500 });
    await waitFor(() => expect(result.current.isCurrent).toBe(true));
    expect(previewMock.mock.calls[0][0].item.quantity).toBe(10);
  });

  it('cannot be overwritten by a slow obsolete response', async () => {
    const pending: Array<(value: { data: CheckoutLinePreview; error: null }) => void> = [];
    previewMock.mockImplementation((input) => new Promise((resolve) => pending.push(resolve)));
    const { result, rerender } = await renderHook<ReturnType<typeof useProductLinePreview>, { quantity: number }>(
      ({ quantity }) => useProductLinePreview({ visible: true, storeId, menuItemId, quantity, groups, selections: {} }),
      { initialProps: { quantity: 1 } },
    );

    await waitFor(() => expect(previewMock).toHaveBeenCalledTimes(1), { timeout: 1500 });
    await rerender({ quantity: 2 });
    await waitFor(() => expect(previewMock).toHaveBeenCalledTimes(2), { timeout: 1500 });

    await act(async () => pending[1]({ data: response(2), error: null }));
    await waitFor(() => expect(result.current.data?.item.quantity).toBe(2));
    await act(async () => pending[0]({ data: response(1), error: null }));
    expect(result.current.data?.item.quantity).toBe(2);
    expect(result.current.isCurrent).toBe(true);
  });
});
