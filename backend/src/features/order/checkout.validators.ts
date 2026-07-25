import { z } from 'zod';

const checkoutOptionSchema = z.object({
  option_id: z.string().min(1).max(120),
  choice_id: z.string().min(1).max(120),
}).strict({ message: 'Client-supplied financial modifiers/extra fields in options are not allowed' });

const checkoutItemSchema = z.object({
  menu_item_id: z.string().uuid({ message: 'menu_item_id must be a valid UUID' }),
  quantity: z.number().int().min(1, 'quantity must be at least 1').max(50, 'quantity cannot exceed 50'),
  options: z.array(checkoutOptionSchema).max(20, 'Cannot select more than 20 options per item').optional().nullable(),
}).strict({ message: 'Client-supplied financial modifiers/extra fields in items are not allowed' });

const checkoutItemsSchema = z.array(checkoutItemSchema)
  .min(1, 'At least one item is required')
  .max(30, 'Cannot order more than 30 distinct items')
  .superRefine((items, context) => {
    const signatures = new Set<string>();
    let totalUnits = 0;

    items.forEach((item, index) => {
      totalUnits += item.quantity;
      const options = (item.options || [])
        .map((option) => `${option.option_id}:${option.choice_id}`)
        .sort();
      const uniqueOptions = new Set(options);
      if (uniqueOptions.size !== options.length) {
        context.addIssue({
          code: 'custom',
          path: [index, 'options'],
          message: 'Duplicate option choices are not allowed',
        });
      }

      const signature = `${item.menu_item_id}|${options.join('|')}`;
      if (signatures.has(signature)) {
        context.addIssue({
          code: 'custom',
          path: [index],
          message: 'Duplicate cart lines are not allowed',
        });
      }
      signatures.add(signature);
    });

    if (totalUnits > 100) {
      context.addIssue({ code: 'custom', message: 'Cannot order more than 100 total units' });
    }
  });

const riderTipSchema = z.preprocess(
  (val) => (val === '' || val === null || val === undefined) ? 0 : Number(val),
  z.number().min(0).max(500).optional().nullable(),
);

export const checkoutPreviewSchema = z.object({
  store_id: z.string().uuid({ message: 'store_id must be a valid UUID' }),
  items: checkoutItemsSchema,
  payment_method: z.enum(['cash']).default('cash'),
  promo_code: z.string().trim().max(50).optional().nullable(),
  rider_tip: riderTipSchema,
}).strict({ message: 'Client-supplied financial modifiers/extra fields in root are not allowed' });

export const checkoutLinePreviewSchema = z.object({
  store_id: z.string().uuid({ message: 'store_id must be a valid UUID' }),
  item: checkoutItemSchema,
}).strict({ message: 'Client-supplied financial modifiers/extra fields in root are not allowed' });

export const checkoutSchema = z.object({
  store_id: z.string().uuid({ message: 'store_id must be a valid UUID' }),
  items: checkoutItemsSchema,
  delivery_address: z.string().min(2, 'delivery_address too short').max(500),
  delivery_lat: z.preprocess((val) => (val === '' || val === null || val === undefined) ? null : Number(val), z.number().finite().min(-90).max(90).optional().nullable()),
  delivery_lng: z.preprocess((val) => (val === '' || val === null || val === undefined) ? null : Number(val), z.number().finite().min(-180).max(180).optional().nullable()),
  payment_method: z.enum(['cash']).default('cash'),
  notes: z.string().max(500).optional().nullable(),
  promo_code: z.string().trim().max(50).optional().nullable(),
  rider_tip: riderTipSchema,
}).strict({ message: 'Client-supplied financial modifiers/extra fields in root are not allowed' });

export const cancelOrderSchema = z.object({
  reason: z.string().min(3, "La raison d'annulation doit faire au moins 3 caractères").max(300),
});

export const updateStageSchema = z.object({
  stage: z.enum(['arrived_pickup', 'picked_up', 'arrived_customer', 'delivered']),
  code: z.string().trim().min(4).max(12).optional().nullable(),
}).strict();
