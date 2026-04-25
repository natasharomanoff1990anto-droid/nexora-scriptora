ALTER TABLE public.user_plans DROP CONSTRAINT IF EXISTS user_plans_plan_check;
ALTER TABLE public.user_plans
  ADD CONSTRAINT user_plans_plan_check
  CHECK (plan IN ('free', 'beta', 'pro', 'premium'));