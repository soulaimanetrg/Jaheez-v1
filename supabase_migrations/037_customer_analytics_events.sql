-- Customer analytics events are written only by the backend service role.
-- RLS stays enabled with no client insert/select policies.

CREATE TABLE IF NOT EXISTS public.customer_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL CHECK (char_length(event_name) BETWEEN 1 AND 80),
  screen TEXT CHECK (screen IS NULL OR char_length(screen) <= 80),
  entity_type TEXT CHECK (entity_type IS NULL OR char_length(entity_type) <= 40),
  entity_id TEXT CHECK (entity_id IS NULL OR char_length(entity_id) <= 120),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  app_version TEXT CHECK (app_version IS NULL OR char_length(app_version) <= 40),
  platform TEXT NOT NULL DEFAULT 'unknown' CHECK (platform IN ('ios', 'android', 'web', 'unknown')),
  ip_address TEXT CHECK (ip_address IS NULL OR char_length(ip_address) <= 80),
  user_agent TEXT CHECK (user_agent IS NULL OR char_length(user_agent) <= 180),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_analytics_events_user_created
  ON public.customer_analytics_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_analytics_events_name_created
  ON public.customer_analytics_events(event_name, created_at DESC);

ALTER TABLE public.customer_analytics_events ENABLE ROW LEVEL SECURITY;
