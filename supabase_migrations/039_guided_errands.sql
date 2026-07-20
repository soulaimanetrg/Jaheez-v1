-- Guided errands: backend-only drafts, quotes and structured delivery details.
CREATE TABLE IF NOT EXISTS public.errand_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('send_item','pickup_existing_order')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','cancelled')),
  pickup_address TEXT NOT NULL,
  pickup_lat NUMERIC(10,7) NOT NULL CHECK (pickup_lat BETWEEN -90 AND 90),
  pickup_lng NUMERIC(10,7) NOT NULL CHECK (pickup_lng BETWEEN -180 AND 180),
  dropoff_address TEXT NOT NULL,
  dropoff_lat NUMERIC(10,7) NOT NULL CHECK (dropoff_lat BETWEEN -90 AND 90),
  dropoff_lng NUMERIC(10,7) NOT NULL CHECK (dropoff_lng BETWEEN -180 AND 180),
  pickup_contact_name TEXT NOT NULL,
  pickup_contact_phone TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  item_category TEXT NOT NULL CHECK (item_category IN ('documents','keys','clothes','food_package','small_parcel','other')),
  item_size TEXT NOT NULL CHECK (item_size IN ('small','medium','large')),
  weight_band TEXT NOT NULL CHECK (weight_band IN ('under_2kg','2_to_5kg','5_to_9kg')),
  declared_value_centimes INTEGER NOT NULL CHECK (declared_value_centimes BETWEEN 0 AND 50000),
  existing_order_code TEXT,
  existing_order_paid BOOLEAN,
  instructions TEXT,
  scheduled_for TIMESTAMPTZ,
  safety_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  risk_flags JSONB NOT NULL DEFAULT '[]',
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.errand_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES public.errand_drafts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  distance_km NUMERIC(8,3) NOT NULL,
  delivery_fee_centimes INTEGER NOT NULL CHECK (delivery_fee_centimes >= 0),
  service_fee_centimes INTEGER NOT NULL DEFAULT 0 CHECK (service_fee_centimes >= 0),
  total_centimes INTEGER NOT NULL CHECK (total_centimes >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','accepted','expired','replaced')),
  pricing_version TEXT NOT NULL,
  requires_manual_price BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(draft_id, version)
);

CREATE TABLE IF NOT EXISTS public.errand_details (
  order_id UUID PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  errand_stage TEXT NOT NULL DEFAULT 'review' CHECK (errand_stage IN ('review','approved','assigned','going_to_pickup','arrived_pickup','picked_up','going_to_dropoff','arrived_dropoff','delivered','cancelled','rejected','needs_information')),
  pickup_address TEXT NOT NULL,
  pickup_lat NUMERIC(10,7) NOT NULL,
  pickup_lng NUMERIC(10,7) NOT NULL,
  dropoff_lat NUMERIC(10,7) NOT NULL,
  dropoff_lng NUMERIC(10,7) NOT NULL,
  pickup_contact_name TEXT NOT NULL,
  pickup_contact_phone TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  item_category TEXT NOT NULL,
  item_size TEXT NOT NULL,
  weight_band TEXT NOT NULL,
  declared_value_centimes INTEGER NOT NULL,
  courier_earning_centimes INTEGER NOT NULL CHECK(courier_earning_centimes>=0),
  existing_order_code TEXT,
  existing_order_paid BOOLEAN,
  instructions TEXT,
  scheduled_for TIMESTAMPTZ,
  quote_id UUID NOT NULL REFERENCES public.errand_quotes(id),
  risk_flags JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.errand_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('customer','driver','admin','system')),
  actor_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.errand_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  proof_type TEXT NOT NULL CHECK (proof_type IN ('pickup','delivery')),
  storage_path TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg','image/png','image/webp')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes BETWEEN 1 AND 5242880),
  actor_type TEXT NOT NULL CHECK (actor_type='driver'),
  actor_id UUID NOT NULL REFERENCES public.drivers(id),
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(actor_id,idempotency_key),
  UNIQUE(order_id,proof_type)
);

CREATE TABLE IF NOT EXISTS public.errand_quote_adjustments(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.errand_quotes(id) ON DELETE CASCADE,
  old_total_centimes INTEGER NOT NULL,
  new_total_centimes INTEGER NOT NULL CHECK(new_total_centimes>0),
  reason TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.errand_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.errand_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.errand_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.errand_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.errand_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.errand_quote_adjustments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_errand_drafts_user_status ON public.errand_drafts(user_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_errand_quotes_draft ON public.errand_quotes(draft_id,version DESC);
CREATE INDEX IF NOT EXISTS idx_errand_details_stage ON public.errand_details(errand_stage,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_errand_proofs_order ON public.errand_proofs(order_id,created_at DESC);

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('errand-proofs','errand-proofs',FALSE,5242880,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public=FALSE,file_size_limit=5242880,allowed_mime_types=EXCLUDED.allowed_mime_types;

INSERT INTO public.app_settings(key,value) VALUES
  ('feature_guided_errands_enabled','false'),
  ('feature_errand_buy_enabled','false'),
  ('errand_pricing_version','zones-v1'),
  ('errand_quote_ttl_seconds','900'),
  ('errand_courier_earning_percent','80'),
  ('errand_pricing_zones_json','[{"max_km":2,"fee_centimes":1500},{"max_km":4,"fee_centimes":2200},{"max_km":6,"fee_centimes":3000},{"max_km":8,"fee_centimes":4000}]')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.submit_guided_errand(
  p_user_id UUID,
  p_draft_id UUID,
  p_quote_id UUID
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_draft public.errand_drafts%ROWTYPE;
  v_quote public.errand_quotes%ROWTYPE;
  v_order_id UUID;
  v_courier_percent NUMERIC;
BEGIN
  IF COALESCE((SELECT value FROM public.app_settings WHERE key='feature_guided_errands_enabled'),'false')<>'true' THEN
    RAISE EXCEPTION 'conflict: guided errands disabled';
  END IF;
  SELECT CASE WHEN value ~ '^[0-9]+([.][0-9]+)?$' THEN value::numeric ELSE NULL END INTO v_courier_percent FROM public.app_settings WHERE key='errand_courier_earning_percent';
  IF v_courier_percent IS NULL OR v_courier_percent<0 OR v_courier_percent>100 THEN RAISE EXCEPTION 'conflict: courier earning configuration unavailable'; END IF;
  SELECT * INTO v_draft FROM public.errand_drafts
    WHERE id=p_draft_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found: errand draft'; END IF;
  IF v_draft.status='submitted' THEN
    SELECT order_id INTO v_order_id FROM public.errand_details WHERE quote_id=p_quote_id;
    IF v_order_id IS NOT NULL THEN RETURN v_order_id; END IF;
  END IF;
  IF v_draft.status<>'draft' OR NOT v_draft.safety_confirmed THEN
    RAISE EXCEPTION 'conflict: errand draft is not submittable';
  END IF;

  SELECT * INTO v_quote FROM public.errand_quotes
    WHERE id=p_quote_id AND draft_id=p_draft_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found: errand quote'; END IF;
  IF v_quote.status<>'active' OR v_quote.expires_at<=now() OR v_quote.requires_manual_price THEN
    RAISE EXCEPTION 'conflict: errand quote expired or requires manual pricing';
  END IF;

  INSERT INTO public.orders(
    user_id,store_id,order_type,request_category,pickup_address,delivery_address,
    delivery_lat,delivery_lng,subtotal,delivery_fee,total_amount,status,
    moderation_status,dispatch_mode,idempotency_key,payment_status,payment_method,notes
  ) VALUES (
    p_user_id,NULL,'errand',v_draft.service_type,v_draft.pickup_address,v_draft.dropoff_address,
    v_draft.dropoff_lat,v_draft.dropoff_lng,0,v_quote.total_centimes/100.0,v_quote.total_centimes/100.0,'pending',
    'pending_review','MANUAL_DISPATCH',v_draft.idempotency_key,'pending','cash',v_draft.instructions
  ) RETURNING id INTO v_order_id;

  INSERT INTO public.errand_details(
    order_id,service_type,pickup_address,pickup_lat,pickup_lng,dropoff_lat,dropoff_lng,
    pickup_contact_name,pickup_contact_phone,recipient_name,recipient_phone,item_category,
    item_size,weight_band,declared_value_centimes,courier_earning_centimes,existing_order_code,existing_order_paid,
    instructions,scheduled_for,quote_id,risk_flags
  ) VALUES (
    v_order_id,v_draft.service_type,v_draft.pickup_address,v_draft.pickup_lat,v_draft.pickup_lng,
    v_draft.dropoff_lat,v_draft.dropoff_lng,v_draft.pickup_contact_name,v_draft.pickup_contact_phone,
    v_draft.recipient_name,v_draft.recipient_phone,v_draft.item_category,v_draft.item_size,
    v_draft.weight_band,v_draft.declared_value_centimes,round(v_quote.total_centimes*v_courier_percent/100.0)::integer,v_draft.existing_order_code,
    v_draft.existing_order_paid,v_draft.instructions,v_draft.scheduled_for,p_quote_id,v_draft.risk_flags
  );

  UPDATE public.errand_drafts SET status='submitted',updated_at=now() WHERE id=p_draft_id;
  UPDATE public.errand_quotes SET status='accepted' WHERE id=p_quote_id;
  UPDATE public.errand_quotes SET status='replaced' WHERE draft_id=p_draft_id AND id<>p_quote_id AND status='active';
  INSERT INTO public.errand_events(order_id,event_type,actor_type,actor_id,metadata)
    VALUES(v_order_id,'submitted_for_review','customer',p_user_id::text,jsonb_build_object('quote_id',p_quote_id));
  RETURN v_order_id;
END $$;

REVOKE ALL ON FUNCTION public.submit_guided_errand(UUID,UUID,UUID) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_guided_errand(UUID,UUID,UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.adjust_guided_errand_quote(p_quote_id UUID,p_total_centimes INTEGER,p_reason TEXT,p_actor_id TEXT)
RETURNS public.errand_quotes LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_quote public.errand_quotes%ROWTYPE;
BEGIN
  IF p_total_centimes<=0 OR p_total_centimes>50000 OR length(trim(p_reason))<3 THEN RAISE EXCEPTION 'bad_request: invalid quote adjustment'; END IF;
  SELECT * INTO v_quote FROM public.errand_quotes WHERE id=p_quote_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found: errand quote'; END IF;
  IF v_quote.status<>'active' OR NOT v_quote.requires_manual_price THEN RAISE EXCEPTION 'conflict: quote is not adjustable'; END IF;
  INSERT INTO public.errand_quote_adjustments(quote_id,old_total_centimes,new_total_centimes,reason,actor_id)
  VALUES(p_quote_id,v_quote.total_centimes,p_total_centimes,trim(p_reason),p_actor_id);
  UPDATE public.errand_quotes SET delivery_fee_centimes=p_total_centimes,total_centimes=p_total_centimes,requires_manual_price=FALSE,expires_at=now()+interval '15 minutes' WHERE id=p_quote_id RETURNING * INTO v_quote;
  RETURN v_quote;
END $$;
REVOKE ALL ON FUNCTION public.adjust_guided_errand_quote(UUID,INTEGER,TEXT,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_guided_errand_quote(UUID,INTEGER,TEXT,TEXT) TO service_role;
