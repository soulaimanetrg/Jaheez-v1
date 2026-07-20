export type OrderStatus =
  | 'pending' | 'confirmed' | 'preparing'
  | 'picked_up' | 'delivered' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  status: OrderStatus;
  total_amount: number;
  delivery_fee: number;
  subtotal: number;
  discount: number;
  payment_method: string;
  delivery_address: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  store_id: string;
  driver_id?: string;
  // Joined
  user_name?: string;
  user_phone?: string;
  store_name?: string;
  store_name_ar?: string;
}

export interface Store {
  id: string;
  name: string;
  name_ar: string;
  category: string;
  is_open: boolean;
  is_featured: boolean;
  is_verified: boolean;
  rating_avg: number;
  rating_count: number;
  delivery_fee: number;
  delivery_time: number;
  min_order_amount?: number;
  phone?: string;
  whatsapp?: string;
  address?: string;
  address_ar?: string;
  city: string;
  created_at: string;
}

export interface AppUser {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  role: string;
  is_banned: boolean;
  trust_score: number;
  city?: string;
  is_plus_member: boolean;
  created_at: string;
}

export interface Driver {
  id: string;
  full_name: string;
  phone: string;
  vehicle_type: string;
  vehicle_plate?: string;
  is_online: boolean;
  is_verified: boolean;
  rating_avg: number;
  rating_count: number;
  city: string;
  created_at: string;
}

export interface KPIStats {
  ordersToday: number;
  revenueToday: number;
  totalUsers: number;
  onlineDrivers: number;
  pendingOrders: number;
  openStores: number;
}
