-- Add promo_price and promo_until columns to menu_items table
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS promo_price NUMERIC,
ADD COLUMN IF NOT EXISTS promo_until TIMESTAMPTZ;
