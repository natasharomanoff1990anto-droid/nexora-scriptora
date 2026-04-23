-- Plan tier enum-like via text + check
CREATE TABLE IF NOT EXISTS public.user_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE DEFAULT 'public-user',
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','premium')),
  period_start timestamptz NOT NULL DEFAULT now(),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to user_plans" ON public.user_plans;
CREATE POLICY "Allow all access to user_plans"
  ON public.user_plans
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON public.user_plans(user_id);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.update_user_plans_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_plans_updated_at ON public.user_plans;
CREATE TRIGGER trg_user_plans_updated_at
  BEFORE UPDATE ON public.user_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_plans_updated_at();