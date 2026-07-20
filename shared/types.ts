// ─────────────────────────────────────────────────────
// JAHEEZ — Shared TypeScript Interfaces
// Single source of truth for ALL data shapes.
// ─────────────────────────────────────────────────────

// ── Enums ──
export type UserRole = 'user' | 'driver' | 'admin';
export type VehicleType = 'motorcycle' | 'car' | 'bicycle' | 'on_foot';
export type OrderType = 'delivery' | 'errand' | 'store_order';
export type PaymentMethod = 'cash' | 'card' | 'wallet';
export type ModerationDecision = 'auto_approve' | 'manual_review' | 'auto_reject';
export type FraudSeverity = 'low' | 'medium' | 'high' | 'critical';

export type OrderStatus =
  | 'pending_moderation'
  | 'pending_driver'
  | 'driver_assigned'
  | 'in_progress'
  | 'picked_up'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'moderation_rejected';

export type StoreCategory =
  | 'restaurant'
  | 'grocery'
  | 'pharmacy'
  | 'bakery'
  | 'cafe'
  | 'supermarket'
  | 'other';

export type ServiceType =
  | 'food'
  | 'grocery'
  | 'pharmacy'
  | 'parcel'
  | 'errand';

// ── User ──
export interface User {
  id: string;
  phone: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
  role: UserRole;
  trust_score: number;
  is_banned: boolean;
  city?: string;
  language: 'ar' | 'fr' | 'en';
  is_plus_member: boolean;
  notification_enabled: boolean;
  notif_orders?: boolean;
  notif_promos?: boolean;
  location_share?: boolean;
  push_token?: string | null;
  created_at: string;
  updated_at: string;
}

// ── Auth ──
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  session: AuthSession | null;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface LoginInput {
  phone: string;
  password: string;
}

export interface RegisterInput {
  full_name: string;
  phone: string;
  password: string;
  city: string;
  email?: string;
}

export interface OTPVerifyInput {
  phone: string;
  code: string;
}

// ── Driver ──
export interface Driver {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  avatar_url?: string;
  vehicle_type: VehicleType;
  plate_number?: string;
  is_online: boolean;
  is_approved: boolean;
  rating_avg: number;
  total_deliveries: number;
  current_zone?: string;
  cin: string;
  is_active: boolean;
  rib?: string | null;
  bank_name?: string | null;
  rib_holder_name?: string | null;
  cod_due_dh?: number;
  legacy_earnings_dh?: number;
  created_at: string;
}

// ── Store / Restaurant ──
export interface Store {
  id: string;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  logo_url?: string;
  cover_url?: string;
  category: StoreCategory;
  cuisine_tags: string[];
  rating_avg: number;
  review_count: number;
  delivery_fee: number;
  delivery_time_min: number;
  delivery_time_max: number;
  min_order_amount: number;
  is_open: boolean;
  is_featured: boolean;
  is_jaheez_plus: boolean;
  address: string;
  lat: number;
  lng: number;
  opening_hours?: StoreHours[];
  created_at: string;
}

export interface StoreHours {
  day: number; // 0=Sunday, 6=Saturday
  open_time: string; // "08:00"
  close_time: string; // "23:00"
}

// ── Menu ──
export interface MenuCategory {
  id: string;
  store_id: string;
  name: string;
  name_ar: string;
  sort_order: number;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  price: number;
  display_price_dh?: number;
  original_price_dh?: number;
  has_active_promotion?: boolean;
  promotion_label?: string | null;
  image_url?: string;
  is_available: boolean;
  is_popular: boolean;
  options?: MenuItemOption[];
  created_at: string;
}

export interface MenuItemOption {
  id: string;
  name: string;
  name_ar: string;
  choices: MenuItemChoice[];
  required: boolean;
  max_selections: number;
}

export interface MenuItemChoice {
  id: string;
  name: string;
  name_ar: string;
  price_delta: number;
}

// ── Cart ──
export interface CartItem {
  id: string;
  menu_item_id: string;
  name: string;
  name_ar: string;
  image_url?: string;
  quantity: number;
  unit_price: number;
  selected_options?: SelectedOption[];
  notes?: string;
  store_id: string;
}

export interface SelectedOption {
  option_id: string;
  choice_id: string;
  choice_name: string;
  price_delta: number;
}

export interface CartState {
  items: CartItem[];
  store_id: string | null;
  store_name: string;
  delivery_fee: number;
  promo_code: string | null;
  promo_discount: number;
}

export interface CartTotals {
  subtotal: number;
  delivery_fee: number;
  promo_discount: number;
  total: number;
  item_count: number;
}

export interface CheckoutOptionInput {
  option_id: string;
  choice_id: string;
  choice_name?: string | null;
}

export interface CheckoutItemInput {
  menu_item_id: string;
  quantity: number;
  options?: CheckoutOptionInput[];
}

export interface CheckoutPreviewInput {
  store_id: string;
  items: CheckoutItemInput[];
  payment_method?: 'cash';
  promo_code?: string | null;
  rider_tip?: number | null;
}

export interface CheckoutQuoteItem {
  menu_item_id: string;
  quantity: number;
  unit_price_dh: number;
  line_total_dh: number;
  options: Array<{
    option_id: string;
    option_label: string;
    choice_id: string;
    choice_name: string;
    price_delta_dh: number;
  }>;
}

export interface CheckoutQuote {
  ok: boolean;
  can_checkout: boolean;
  payment_method: 'cash';
  store_status: {
    is_open: boolean;
    label_fr: string;
    label_ar: string;
  };
  items: CheckoutQuoteItem[];
  subtotal_dh: number;
  delivery_fee_dh: number;
  service_fee_dh: number;
  discount_dh: number;
  rider_tip_dh: number;
  total_dh: number;
  promo: {
    code: string;
    is_valid: boolean;
    discount_dh: number;
    reason?: string;
  } | null;
}

export interface CheckoutOrderInput extends CheckoutPreviewInput {
  delivery_address: string;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  notes?: string | null;
}

export interface CheckoutOrderResult extends CheckoutQuote {
  order_id: string;
  id?: string;
  status: string;
  created_at: string;
  idempotent?: boolean;
}

// ── Order ──
export interface Order {
  id: string;
  reference_code: string;
  user_id: string;
  driver_id?: string;
  store_id?: string;
  type: OrderType;
  title: string;
  description?: string;
  category?: string;
  status: OrderStatus;
  pickup_address?: string;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  estimated_price?: number;
  final_price?: number;
  delivery_fee: number;
  promo_discount: number;
  payment_method: PaymentMethod;
  risk_score: number;
  moderation_status: string;
  estimated_delivery_time?: string;
  cancel_reason?: string;
  created_at: string;
  updated_at: string;
  // Joined relations (optional)
  driver?: Driver;
  store?: Store;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string;
  name: string;
  name_ar?: string;
  quantity: number;
  unit_price: number;
  notes?: string;
  selected_options?: SelectedOption[];
}

export interface OrderModeration {
  id: string;
  order_id: string;
  decision: ModerationDecision;
  risk_score?: number;
  keyword_flags?: { keyword: string; severity: string; matched_text: string }[];
  explanation?: string;
  reviewed_by?: string;
  created_at: string;
}

export interface OrderStatusLog {
  id: string;
  order_id: string;
  from_status: OrderStatus;
  to_status: OrderStatus;
  changed_by: string;
  reason?: string;
  created_at: string;
}

// ── Create Order ──
export interface CreateStoreOrderInput {
  store_id: string;
  items: CartItem[];
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  payment_method: PaymentMethod;
  promo_code?: string;
  notes?: string;
}

export interface CreateErrandInput {
  title: string;
  description: string;
  category: string;
  pickup_address?: string;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  estimated_price?: number;
}

// ── Chat ──
export interface ChatMessage {
  id: string;
  order_id: string;
  sender_id: string;
  sender_role: 'user' | 'driver' | 'system';
  content: string;
  type: 'text' | 'image' | 'system';
  media_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatConversation {
  order_id: string;
  order_reference: string;
  driver_name: string;
  driver_avatar?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

// ── Location ──
export interface DriverLocation {
  id: string;
  driver_id: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  created_at: string;
}

export interface SavedAddress {
  id: string;
  user_id: string;
  label: string; // "المنزل", "العمل", custom
  address: string;
  lat: number;
  lng: number;
  is_default: boolean;
  created_at: string;
}

// ── Reviews ──
export interface Review {
  id: string;
  order_id: string;
  reviewer_id: string;
  driver_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface StoreReview {
  id: string;
  store_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  comment?: string;
  created_at: string;
}

// ── Fraud ──
export interface FraudFlag {
  id: string;
  user_id?: string;
  driver_id?: string;
  order_id?: string;
  type: string;
  severity: FraudSeverity;
  evidence?: Record<string, unknown>;
  resolved: boolean;
  created_at: string;
}

// ── Notifications ──
export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'order_update' | 'promo' | 'system' | 'chat';
  data?: Record<string, string>;
  is_read: boolean;
  created_at: string;
}

// ── Promo ──
export interface PromoCode {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount?: number;
  valid_until: string;
  usage_limit: number;
  usage_count: number;
  is_active: boolean;
}

export interface PromoBanner {
  id: string;
  title: string;
  title_ar: string;
  subtitle?: string;
  subtitle_ar?: string;
  image_url?: string;
  action_type: 'store' | 'category' | 'promo' | 'external';
  action_target: string;
  sort_order: number;
  is_active: boolean;
}

// ── Service Category (home screen) ──
// Customer app-safe home feed DTOs
export interface CustomerHomeServiceCategory {
  id: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  parent_id: string | null;
  icon_emoji: string | null;
  color_hex: string | null;
  sort_order: number;
}

export interface CustomerHomeBanner {
  id: string;
  title_ar: string;
  subtitle_ar: string | null;
  image_url: string | null;
  link_type: string;
  link_value: string | null;
  sort_order: number;
}

export interface CustomerHomePromotion {
  id: string;
  title_ar: string;
  code: string | null;
  discount:
    | { type: 'fixed'; amount_dh: number }
    | { type: 'percentage'; percentage: number };
  min_order_dh: number;
  store_id: string | null;
  store_name: string | null;
  end_at: string | null;
}

export interface CustomerHomeStoreCard {
  id: string;
  name: string;
  name_ar: string | null;
  logo_url: string | null;
  cover_url: string | null;
  category: string;
  cuisine_tags: string[];
  rating_avg: number;
  review_count: number;
  delivery_fee_dh: number;
  delivery_time_min: number;
  delivery_time_max: number;
  min_order_amount_dh: number;
  distance_km: number | null;
  is_open: boolean;
  is_featured: boolean;
  has_reduction: boolean;
  reduction_percentage: number;
  promo_type: string;
}

export interface CustomerActiveOrderSummary {
  id: string;
  status: string;
  store_id: string | null;
  created_at: string | null;
  estimated_delivery_time: string | null;
}

export interface CustomerReorderCard {
  order_id: string;
  store_id: string | null;
  store_name: string | null;
  store_name_ar: string | null;
  store_logo_url: string | null;
  item_count: number;
  total_amount_dh: number;
  ordered_at: string | null;
}

export interface CustomerHomeFeed {
  generated_at: string;
  app_config: {
    maintenance: {
      enabled: boolean;
      message_fr: string | null;
      message_ar: string | null;
    };
    force_update: {
      min_required_version_ios: string | null;
      min_required_version_android: string | null;
    };
    support: {
      phone: string | null;
      phone_e164: string | null;
      whatsapp: string | null;
    };
    feature_flags: {
      online_payments_enabled: false;
      referrals_enabled: boolean;
      loyalty_enabled: boolean;
      reorder_enabled: boolean;
      tracking_chat_enabled: boolean;
    };
  };
  service_categories: CustomerHomeServiceCategory[];
  banners: CustomerHomeBanner[];
  promotions: CustomerHomePromotion[];
  stores: {
    featured: CustomerHomeStoreCard[];
    nearby: CustomerHomeStoreCard[];
    promos: CustomerHomeStoreCard[];
  };
  active_order: CustomerActiveOrderSummary | null;
  reorder_cards: CustomerReorderCard[];
}

export type CustomerAnalyticsEventName =
  | 'app_open'
  | 'home_view'
  | 'search_submitted'
  | 'category_opened'
  | 'store_opened'
  | 'add_to_cart'
  | 'checkout_quote_failed'
  | 'checkout_started'
  | 'checkout_succeeded'
  | 'checkout_failed'
  | 'order_cancel_requested'
  | 'support_started'
  | 'support_ticket_created'
  | 'reorder_started'
  | 'notification_opt_in_changed'
  | 'tracking_opened'
  | 'review_submitted';

export interface CustomerAnalyticsEventInput {
  event_name: CustomerAnalyticsEventName;
  screen?: string;
  entity_type?: 'store' | 'category' | 'order' | 'menu_item' | 'support_ticket' | 'search' | 'notification';
  entity_id?: string;
  metadata?: Record<string, string | number | boolean | null>;
  app_version?: string;
  platform?: 'ios' | 'android' | 'web' | 'unknown';
}

export interface ServiceCategory {
  id: ServiceType;
  name_ar: string;
  name_fr: string;
  icon: string;
  tint_color: string;
  description_ar: string;
}

// ── API Response Wrappers ──
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
