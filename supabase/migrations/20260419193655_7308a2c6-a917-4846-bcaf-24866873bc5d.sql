-- Extend user_plans
ALTER TABLE public.user_plans
  ADD COLUMN IF NOT EXISTS beta_activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS beta_code_used text,
  ADD COLUMN IF NOT EXISTS suspicious boolean NOT NULL DEFAULT false;

-- Sessions / device tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT 'local-user',
  ip_address text,
  device_id text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_device ON public.user_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip ON public.user_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to user_sessions"
  ON public.user_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);