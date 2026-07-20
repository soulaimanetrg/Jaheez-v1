export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'assigned'
  | 'picked_up'
  | 'arrived_pickup'
  | 'arrived_customer'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'issue';

export type PaymentMethod = 'cash' | 'card' | 'wallet';

export interface OrderItemInput {
  menu_item_id: string;
  quantity: number;
  options?: Array<{
    option_id: string;
    choice_id: string;
    choice_name: string;
    price_delta: number;
  }> | null;
}

export interface CheckoutInput {
  store_id: string;
  items: OrderItemInput[];
  delivery_address: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  payment_method: PaymentMethod;
  notes?: string | null;
  promo_code?: string | null;
  rider_tip?: number | null;
}

export interface OrderStatusUpdateInput {
  status: OrderStatus;
  notes?: string;
  admin_note?: string;
}
