import { useEffect, useMemo, useState } from 'react';
import type { CheckoutLinePreview, MenuItemOption } from '@shared/types';
import { checkoutLineSignature, previewCheckoutLine } from '@/features/orders/services/orderApi';
import type { ProductSelections } from '@/features/orders/productLineEditor';

export function useProductLinePreview({
  visible,
  storeId,
  menuItemId,
  quantity,
  groups,
  selections,
}: {
  visible: boolean;
  storeId: string | null | undefined;
  menuItemId: string | null | undefined;
  quantity: number;
  groups: MenuItemOption[];
  selections: ProductSelections;
}) {
  const [lastVerified, setLastVerified] = useState<CheckoutLinePreview | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const options = useMemo(() => groups.flatMap((group) =>
    (selections[group.id] || []).map((choiceId) => ({ option_id: group.id, choice_id: choiceId }))),
  [groups, selections]);
  const item = useMemo(() => menuItemId ? { menu_item_id: menuItemId, quantity, options } : null, [menuItemId, options, quantity]);
  const signature = item ? checkoutLineSignature(item) : '';

  useEffect(() => {
    if (!visible || !storeId || !item) return;
    const controller = new AbortController();
    setIsUpdating(true);
    setError(false);
    const timer = setTimeout(() => {
      previewCheckoutLine({ store_id: storeId, item }, controller.signal)
        .then((result) => {
          if (controller.signal.aborted) return;
          if (result.data?.signature === checkoutLineSignature(item)) setLastVerified(result.data);
          else setError(true);
        })
        .catch((reason: unknown) => {
          if (!(reason instanceof Error && reason.name === 'AbortError')) setError(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsUpdating(false);
        });
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [item, retryNonce, signature, storeId, visible]);

  return {
    data: lastVerified,
    error,
    isUpdating,
    isCurrent: lastVerified?.signature === signature,
    retry: () => setRetryNonce((value) => value + 1),
  };
}
