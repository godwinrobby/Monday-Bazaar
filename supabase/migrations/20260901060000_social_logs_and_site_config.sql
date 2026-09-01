-- Migration: Admin Facebook & Instagram Feeds Auto-Broadcaster fixes
-- 1) Create the missing social_logs table (auto-post / broadcast history).
-- 2) Normalize site_config.social_config stored as a JSON string into a real jsonb object.

-- 1. social_logs table -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_logs (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL DEFAULT 'facebook',
    deal_id TEXT,
    deal_title TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    post_url TEXT,
    message TEXT,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.social_logs DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.social_logs TO anon, authenticated, service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'social_logs' AND policyname = 'Allow public all on social_logs'
  ) THEN
    CREATE POLICY "Allow public all on social_logs" ON public.social_logs
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_social_logs_posted_at ON public.social_logs (posted_at DESC);

-- 2. Normalize social_config jsonb: string -> object -------------------------
UPDATE public.site_config
SET config_value = (config_value #>> '{}')::jsonb
WHERE config_key = 'social_config'
  AND config_value IS NOT NULL
  AND jsonb_typeof(config_value) = 'string';
