-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 035 — Seed Subcategories under Restauration, Épicerie, and Pharmacie
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
  food_id UUID;
  grocery_id UUID;
  pharmacy_id UUID;
BEGIN
  -- 1. Get parent IDs
  SELECT id INTO food_id FROM public.service_categories WHERE name_fr = 'Restauration' AND parent_id IS NULL LIMIT 1;
  SELECT id INTO grocery_id FROM public.service_categories WHERE name_fr = 'Épicerie' AND parent_id IS NULL LIMIT 1;
  SELECT id INTO pharmacy_id FROM public.service_categories WHERE name_fr = 'Pharmacie' AND parent_id IS NULL LIMIT 1;

  -- 2. Seed Food Subcategories if not present
  IF food_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.service_categories WHERE parent_id = food_id LIMIT 1) THEN
      INSERT INTO public.service_categories (name_ar, name_fr, type, parent_id, icon_emoji, color_hex, sort_order, is_active) VALUES
        ('سريع', 'Rapide', 'service', food_id, '⚡', '#F03030', 1, TRUE),
        ('مغربي', 'Marocain', 'service', food_id, '🇲🇦', '#10B981', 2, TRUE),
        ('بيتزا', 'Pizza', 'service', food_id, '🍕', '#3A8FE8', 3, TRUE),
        ('صحي', 'Sain', 'service', food_id, '🥗', '#F5A623', 4, TRUE),
        ('برجر', 'Burger', 'service', food_id, '🍔', '#9333EA', 5, TRUE),
        ('تاكو', 'Tacos', 'service', food_id, '🌮', '#EC4899', 6, TRUE);
    END IF;
  END IF;

  -- 3. Seed Grocery Subcategories if not present
  IF grocery_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.service_categories WHERE parent_id = grocery_id LIMIT 1) THEN
      INSERT INTO public.service_categories (name_ar, name_fr, type, parent_id, icon_emoji, color_hex, sort_order, is_active) VALUES
        ('خضروات وفواكه', 'fruits & légumes', 'service', grocery_id, '🥦', '#10B981', 1, TRUE),
        ('ألبان وبيض', 'produits laitiers', 'service', grocery_id, '🥛', '#3A8FE8', 2, TRUE),
        ('مخبزة وخبز', 'boulangerie', 'service', grocery_id, '🍞', '#F5A623', 3, TRUE),
        ('منظفات', 'nettoyage', 'service', grocery_id, '🧼', '#9333EA', 4, TRUE);
    END IF;
  END IF;

  -- 4. Seed Pharmacy Subcategories if not present
  IF pharmacy_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.service_categories WHERE parent_id = pharmacy_id LIMIT 1) THEN
      INSERT INTO public.service_categories (name_ar, name_fr, type, parent_id, icon_emoji, color_hex, sort_order, is_active) VALUES
        ('أدوية', 'médicaments', 'service', pharmacy_id, '💊', '#3A8FE8', 1, TRUE),
        ('عناية بالطفل', 'soins bébé', 'service', pharmacy_id, '🍼', '#EC4899', 2, TRUE),
        ('عناية بالبشرة / تجميل', 'beauté & cosmétiques', 'service', pharmacy_id, '💅', '#9333EA', 3, TRUE);
    END IF;
  END IF;
END $$;
