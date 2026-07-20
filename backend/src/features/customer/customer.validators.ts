import { z } from 'zod';

const analyticsEventNames = [
  'app_open',
  'home_view',
  'search_submitted',
  'category_opened',
  'store_opened',
  'add_to_cart',
  'checkout_quote_failed',
  'checkout_started',
  'checkout_succeeded',
  'checkout_failed',
  'order_cancel_requested',
  'support_started',
  'support_ticket_created',
  'reorder_started',
  'notification_opt_in_changed',
  'tracking_opened',
  'review_submitted',
] as const;

export const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(120).optional(),
  avatar_url: z.string().url().nullable().optional(),
  city: z.string().max(80).optional(),
  language: z.string().max(10).optional(),
  notification_enabled: z.boolean().optional(),
  notif_orders: z.boolean().optional(),
  notif_promos: z.boolean().optional(),
  location_share: z.boolean().optional(),
}).strict();

export const upsertProfileSchema = updateProfileSchema;


export const pushTokenSchema = z.object({
  push_token: z.string().min(10).max(300),
});

export const addressSchema = z.object({
  label: z.string().min(1).max(80),
  address: z.string().min(2).max(500),
  lat: z.preprocess((val) => (val === '' || val === null || val === undefined) ? null : Number(val), z.number().min(-90).max(90).nullable().optional()),
  lng: z.preprocess((val) => (val === '' || val === null || val === undefined) ? null : Number(val), z.number().min(-180).max(180).nullable().optional()),
  is_default: z.boolean().optional(),
  building_info: z.string().trim().max(160).optional().nullable(),
  nearby_landmark: z.string().trim().max(200).optional().nullable(),
  delivery_instructions: z.string().trim().max(500).optional().nullable(),
  location_source: z.enum(['gps', 'manual_map_pin']).optional().nullable(),
});

export const onboardingAddressSchema = addressSchema.extend({
  city: z.string().trim().min(1).max(80),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  location_source: z.enum(['gps', 'manual_map_pin']),
  is_default: z.literal(true).default(true),
  address_id: z.string().uuid().optional().nullable(),
}).strict();

export const locationReverseSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
}).strict();

export const locationSearchSchema = z.object({
  q: z.string().trim().min(3).max(160),
}).strict();

export const translationSchema = z.object({
  texts: z.array(z.string().trim().min(1).max(1000)).min(1).max(25),
  source: z.enum(['ar', 'fr', 'en']).default('ar'),
  target: z.enum(['ar', 'fr', 'en']),
}).strict().refine(value => value.source !== value.target, { message: 'Source and target must differ.' });

export const supportTicketSchema = z.object({
  category: z.string().min(1).max(80),
  urgency: z.string().min(1).max(40),
  subject: z.string().min(1).max(160),
  message: z.string().min(1).max(2000),
  order_id: z.string().uuid().optional().nullable(),
});

export const chatMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const favoriteSchema = z.object({
  store_id: z.string().uuid(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const favoriteProductSchema = z.object({
  menu_item_id: z.string().uuid(),
});

export const customerHomeFeedQuerySchema = z.object({
  lat: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
    z.number().min(-90).max(90).optional()
  ),
  lng: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
    z.number().min(-180).max(180).optional()
  ),
}).strict();

const analyticsMetadataValueSchema = z.union([
  z.string().max(160),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

const forbiddenAnalyticsMetadataKey = /(phone|token|password|otp|secret|session|auth|email|address|lat|lng|location|coordinate|idempotency|provider|raw|payload)/i;

const analyticsMetadataSchema = z.record(analyticsMetadataValueSchema).superRefine((metadata, ctx) => {
  for (const key of Object.keys(metadata)) {
    if (forbiddenAnalyticsMetadataKey.test(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: 'Sensitive analytics metadata key is not allowed',
      });
    }
  }
});

export const customerAnalyticsEventSchema = z.object({
  event_name: z.enum(analyticsEventNames),
  screen: z.string().trim().min(1).max(80).optional(),
  entity_type: z.enum(['store', 'category', 'order', 'menu_item', 'support_ticket', 'search', 'notification']).optional(),
  entity_id: z.string().trim().min(1).max(120).optional(),
  metadata: analyticsMetadataSchema.optional(),
  app_version: z.string().trim().min(1).max(40).optional(),
  platform: z.enum(['ios', 'android', 'web', 'unknown']).optional(),
}).strict();
