
-- Restrict local-dev anon policies to SELECT only (dev mode reads cached data; writes go through localStorage)
DROP POLICY IF EXISTS "Local dev access to projects" ON public.projects;
DROP POLICY IF EXISTS "Local dev access to user_plans" ON public.user_plans;
DROP POLICY IF EXISTS "Local dev access to runs" ON public.auto_bestseller_runs;

CREATE POLICY "Local dev read projects"
  ON public.projects FOR SELECT
  TO anon
  USING (user_id LIKE 'local-user-%' OR user_id = 'public-user');

CREATE POLICY "Local dev read user_plans"
  ON public.user_plans FOR SELECT
  TO anon
  USING (user_id LIKE 'local-user-%' OR user_id = 'public-user');

CREATE POLICY "Local dev read runs"
  ON public.auto_bestseller_runs FOR SELECT
  TO anon
  USING (user_id LIKE 'local-user-%' OR user_id = 'public-user');
