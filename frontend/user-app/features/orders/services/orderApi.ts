import { BackendApiError, backendJson } from '@/lib/backendApi';
import { adminApiUrl } from '@/lib/adminApi';
import { usePlatformStore } from '@/store/platformStore';
import { useLangStore } from '@/store/languageStore';
import { generateSecureUUID } from '@/lib/uuid';
import { io, Socket } from 'socket.io-client';
import type {
  ApiResponse,
  ChatMessage,
  CheckoutOrderInput,
  CheckoutOrderResult,
  CheckoutLinePreview,
  CheckoutLinePreviewInput,
  CheckoutPreviewInput,
  CheckoutQuote,
  Order,
} from '@shared/types';

function maintenanceBlock(): string | null {
  const platformState = usePlatformStore.getState();
  if (!platformState.isInMaintenance) return null;
  const lang = useLangStore.getState().lang;
  return platformState.maintenanceMessage(lang)
    || (lang === 'ar'
      ? 'التطبيق قيد الصيانة. يرجى المحاولة بعد دقائق.'
      : "L'application est en maintenance. Merci de reessayer dans quelques minutes.");
}

function makeIdempotencyKey(): string {
  return `checkout:${generateSecureUUID()}`;
}

function normalizeCheckoutItems(items: CheckoutPreviewInput['items']) {
  return items.map((item) => ({
    menu_item_id: item.menu_item_id,
    quantity: item.quantity,
    options: (item.options || []).map((option) => ({
      option_id: option.option_id,
      choice_id: option.choice_id,
    })),
  }));
}

export function checkoutLineSignature(item: CheckoutLinePreviewInput['item']): string {
  const options = (item.options || [])
    .map((option) => `${option.option_id}:${option.choice_id}`)
    .sort();
  return `${item.menu_item_id}|${item.quantity}|${options.join('|')}`;
}

export async function previewCheckoutLine(
  input: CheckoutLinePreviewInput,
  signal?: AbortSignal,
): Promise<ApiResponse<CheckoutLinePreview>> {
  try {
    const blocked = maintenanceBlock();
    if (blocked) return { data: null, error: blocked };
    const data = await backendJson<CheckoutLinePreview>('/admin-api/v1/checkout/line-preview', {
      method: 'POST',
      signal,
      body: JSON.stringify({
        store_id: input.store_id,
        item: normalizeCheckoutItems([input.item])[0],
      }),
    });
    return { data, error: null };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to preview product',
      error_code: error instanceof BackendApiError ? error.code : 'checkout_line_preview_failed',
    };
  }
}

export async function getActiveOrder(userId: string): Promise<ApiResponse<Order>> {
  try {
    const data = await backendJson<Order | null>('/admin-api/v1/customer/orders/active');
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch active order' };
  }
}

export async function getOrderById(orderId: string): Promise<ApiResponse<Order>> {
  try {
    const data = await backendJson<Order>(`/admin-api/v1/customer/orders/${encodeURIComponent(orderId)}`);
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch order detail' };
  }
}

export async function getOrderHistory(
  userId: string,
  page: number,
  pageSize: number = 10,
): Promise<ApiResponse<Order[]>> {
  try {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    const data = await backendJson<Order[]>(`/admin-api/v1/customer/orders?${query.toString()}`);
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch order history' };
  }
}

export async function getUserOrders(userId: string): Promise<ApiResponse<Order[]>> {
  try {
    const data = await backendJson<Order[]>('/admin-api/v1/customer/orders?page=1&pageSize=50');
    return { data: data || [], error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch orders' };
  }
}

export async function previewCheckout(input: CheckoutPreviewInput, signal?: AbortSignal): Promise<ApiResponse<CheckoutQuote>> {
  try {
    const blocked = maintenanceBlock();
    if (blocked) return { data: null, error: blocked };

    const data = await backendJson<CheckoutQuote>('/admin-api/v1/checkout/preview', {
      method: 'POST',
      signal,
      body: JSON.stringify({
        store_id: input.store_id,
        payment_method: input.payment_method ?? 'cash',
        promo_code: input.promo_code ?? null,
        rider_tip: input.rider_tip ?? 0,
        items: normalizeCheckoutItems(input.items),
      }),
    });

    return { data, error: null };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to preview checkout',
      error_code: error instanceof BackendApiError ? error.code : 'checkout_preview_failed',
    };
  }
}

// One idempotency key per submission chain, not per request: a network
// timeout followed by a retap must replay the same order on the server,
// not create a second one. Cleared only on a definitive server response.
let pendingCheckout: { key: string; requestSignature: string } | null = null;

function checkoutRequestSignature(order: CheckoutOrderInput): string {
  return JSON.stringify({
    store_id: order.store_id,
    delivery_address: order.delivery_address.trim(),
    delivery_lat: order.delivery_lat ?? null,
    delivery_lng: order.delivery_lng ?? null,
    notes: order.notes ?? null,
    promo_code: order.promo_code?.trim().toUpperCase() || null,
    rider_tip: order.rider_tip ?? 0,
    items: normalizeCheckoutItems(order.items)
      .map((item) => ({
        ...item,
        options: (item.options || []).slice().sort((a, b) =>
          `${a.option_id}:${a.choice_id}`.localeCompare(`${b.option_id}:${b.choice_id}`)),
      }))
      .sort((a, b) => `${a.menu_item_id}:${JSON.stringify(a.options)}`.localeCompare(`${b.menu_item_id}:${JSON.stringify(b.options)}`)),
  });
}

export async function createOrder(order: CheckoutOrderInput): Promise<ApiResponse<CheckoutOrderResult>> {
  try {
    const blocked = maintenanceBlock();
    if (blocked) return { data: null, error: blocked };

    const requestSignature = checkoutRequestSignature(order);
    if (!pendingCheckout || pendingCheckout.requestSignature !== requestSignature) {
      pendingCheckout = { key: makeIdempotencyKey(), requestSignature };
    }

    const data = await backendJson<CheckoutOrderResult>('/admin-api/v1/checkout', {
      method: 'POST',
      headers: { 'Idempotency-Key': pendingCheckout.key },
      body: JSON.stringify({
        store_id: order.store_id,
        delivery_address: order.delivery_address,
        delivery_lat: order.delivery_lat ?? null,
        delivery_lng: order.delivery_lng ?? null,
        notes: order.notes ?? null,
        payment_method: order.payment_method ?? 'cash',
        rider_tip: order.rider_tip ?? 0,
        promo_code: order.promo_code ?? null,
        items: normalizeCheckoutItems(order.items),
      }),
    });

    // Definitive success — the next checkout is a new order.
    pendingCheckout = null;
    return { data: { id: data.order_id, ...data }, error: null };
  } catch (error: unknown) {
    // Definitive server rejections (4xx validation) also end the chain;
    // keep the key only for ambiguous network-level failures where the
    // order may or may not have been created.
    if (error instanceof Error && !/network|timeout|joindre|fetch/i.test(error.message)) {
      pendingCheckout = null;
    }
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create order' };
  }
}

export interface CustomerCheckoutAddress {
  id: string;
  label: string | null;
  address: string;
  city?: string | null;
  building_info?: string | null;
  nearby_landmark?: string | null;
  lat: number | null;
  lng: number | null;
  is_default: boolean;
}

export async function getDefaultCheckoutAddress(): Promise<CustomerCheckoutAddress | null> {
  const addresses = await backendJson<CustomerCheckoutAddress[]>('/admin-api/v1/customer/addresses');
  return addresses.find((address) => address.is_default) ?? null;
}

export async function cancelOrder(orderId: string, reason?: string): Promise<ApiResponse<void>> {
  try {
    await backendJson(`/admin-api/v1/orders/${encodeURIComponent(orderId)}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'User cancelled order' }),
    });
    return { data: null, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to cancel order' };
  }
}

export async function confirmDelivery(orderId: string): Promise<ApiResponse<void>> {
  try {
    await backendJson(`/admin-api/v1/customer/orders/${encodeURIComponent(orderId)}/confirm-delivery`, {
      method: 'POST',
      body: '{}',
    });
    return { data: null, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to confirm delivery' };
  }
}

export async function submitReview(orderId: string, rating: number, comment?: string): Promise<ApiResponse<void>> {
  try {
    await backendJson(`/admin-api/v1/customer/orders/${encodeURIComponent(orderId)}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
    return { data: null, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to submit review' };
  }
}

export async function sendChatMessage(orderId: string, content: string): Promise<ApiResponse<ChatMessage>> {
  try {
    const data = await backendJson<ChatMessage>(`/admin-api/v1/customer/orders/${encodeURIComponent(orderId)}/chat`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to send message' };
  }
}

export async function getChatMessages(orderId: string): Promise<ApiResponse<ChatMessage[]>> {
  try {
    const data = await backendJson<ChatMessage[]>(`/admin-api/v1/customer/orders/${encodeURIComponent(orderId)}/chat`);
    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch messages' };
  }
}

export interface SocketHandlers {
  onStatusUpdate?: (status: string, driverId?: string | null) => void;
  onLocationUpdate?: (location: { latitude: number; longitude: number; speed?: number | null; heading?: number | null }) => void;
  onDriverOffline?: (driverId: string) => void;
  onChatMessage?: (message: ChatMessage) => void;
  onSocketError?: (message: string) => void;
}

export function connectOrderSocket(orderId: string, token: string, handlers: SocketHandlers): Socket {
  const baseUrl = adminApiUrl('/');
  let socketUrl = baseUrl;

  if (typeof window !== 'undefined' && window.location && baseUrl.startsWith('/')) {
    socketUrl = `${window.location.protocol}//${window.location.host}`;
  } else if (!baseUrl || baseUrl.startsWith('/')) {
    throw new Error('Realtime endpoint is unavailable');
  }

  const socket = io(socketUrl, {
    path: '/socket.io',
    auth: {
      token,
      actor: 'customer',
    },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    socket.emit('join_room', `order:${orderId}`, (ack: { ok: boolean; error?: string }) => {
      if (!ack.ok) {
        handlers.onSocketError?.(ack.error || 'forbidden_room');
      }
    });
  });

  socket.on('connect_error', () => {
    handlers.onSocketError?.('socket_connection_failed');
  });

  socket.on('order:status', (data: { status: string; driver_id?: string | null }) => {
    handlers.onStatusUpdate?.(data.status, data.driver_id);
  });

  socket.on('driver:location', (data: { latitude: number; longitude: number; speed?: number | null; heading?: number | null }) => {
    handlers.onLocationUpdate?.(data);
  });

  socket.on('driver:offline', (data: { driver_id: string }) => {
    handlers.onDriverOffline?.(data.driver_id);
  });

  socket.on('chat:message', (message: ChatMessage) => {
    handlers.onChatMessage?.(message);
  });

  return socket;
}
