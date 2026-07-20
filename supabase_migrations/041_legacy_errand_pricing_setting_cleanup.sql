-- Remove a legacy DH-named server setting introduced before centime-only
-- storage was enforced. Guided errands use errand_quotes.*_centimes instead.
DELETE FROM public.app_settings WHERE key = 'errand_base_fee_dh';
