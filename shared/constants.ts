import type { OrderStatus, VehicleType } from './types';

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'pending_moderation',
  'pending_driver',
  'driver_assigned',
  'in_progress',
  'picked_up',
  'delivered',
  'completed',
  'cancelled',
  'disputed',
  'moderation_rejected',
] as const;

export const TERMINAL_STATUSES: readonly OrderStatus[] = [
  'completed',
  'cancelled',
  'moderation_rejected',
] as const;

export const VEHICLE_TYPES: readonly VehicleType[] = [
  'motorcycle',
  'car',
  'bicycle',
  'on_foot',
] as const;

export const CATEGORIES = ['food', 'grocery', 'pharmacy', 'custom_errand'] as const;

export const ZONES = ['safi_centre', 'safi_nord', 'safi_sud', 'safi_est'] as const;

export const RISK_THRESHOLDS = {
  AUTO_APPROVE: 30,
  MANUAL_REVIEW: 69,
  AUTO_REJECT: 70,
} as const;

export const VALID_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_moderation: ['pending_driver', 'moderation_rejected', 'cancelled'],
  pending_driver: ['driver_assigned', 'cancelled'],
  driver_assigned: ['in_progress', 'cancelled'],
  in_progress: ['picked_up'],
  picked_up: ['delivered'],
  delivered: ['completed', 'disputed'],
  completed: [],
  cancelled: [],
  disputed: [],
  moderation_rejected: [],
} as const;

export const MAX_DESCRIPTION_LENGTH = 500 as const;
export const MAX_TITLE_LENGTH = 200 as const;

export const DRIVER_SEARCH_RADIUS_KM = 5 as const;
export const DRIVER_EXPANDED_RADIUS_KM = 8 as const;

export const DRIVER_MATCH_TIMEOUT_MS = 30000 as const;
export const LOCATION_UPDATE_INTERVAL_MS = 5000 as const;
