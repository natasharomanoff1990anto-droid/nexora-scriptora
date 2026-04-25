
-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_user_plans_updated_at();

-- 2. AUTO-CREATE profile + free plan ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_plans (user_id, plan, period_start)
  VALUES (NEW.id::text, 'free', now())
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. TIGHTEN RLS on projects (replace permissive policy)
DROP POLICY IF EXISTS "Allow all access to projects" ON public.projects;

CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Keep dev/local fallback access for unauthenticated local-user-* ids
CREATE POLICY "Local dev access to projects"
  ON public.projects FOR ALL
  TO anon
  USING (user_id LIKE 'local-user-%' OR user_id = 'public-user')
  WITH CHECK (user_id LIKE 'local-user-%' OR user_id = 'public-user');

-- 4. TIGHTEN RLS on user_plans
DROP POLICY IF EXISTS "Allow all access to user_plans" ON public.user_plans;

CREATE POLICY "Users can view own plan"
  ON public.user_plans FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own plan"
  ON public.user_plans FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own plan"
  ON public.user_plans FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Local dev access to user_plans"
  ON public.user_plans FOR ALL
  TO anon
  USING (user_id LIKE 'local-user-%' OR user_id = 'public-user')
  WITH CHECK (user_id LIKE 'local-user-%' OR user_id = 'public-user');

-- 5. TIGHTEN RLS on ai_usage_logs
DROP POLICY IF EXISTS "Allow all access to ai_usage_logs" ON public.ai_usage_logs;

CREATE POLICY "Users can view own usage"
  ON public.ai_usage_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Service can insert usage"
  ON public.ai_usage_logs FOR INSERT
  TO authenticated, anon, service_role
  WITH CHECK (true);

CREATE POLICY "Local dev access to ai_usage_logs"
  ON public.ai_usage_logs FOR SELECT
  TO anon
  USING (user_id LIKE 'local-user-%' OR user_id = 'public-user');

-- 6. TIGHTEN auto_bestseller_runs
DROP POLICY IF EXISTS "Allow all access to auto_bestseller_runs" ON public.auto_bestseller_runs;

CREATE POLICY "Users can manage own runs"
  ON public.auto_bestseller_runs FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Local dev access to runs"
  ON public.auto_bestseller_runs FOR ALL
  TO anon
  USING (user_id LIKE 'local-user-%' OR user_id = 'public-user')
  WITH CHECK (user_id LIKE 'local-user-%' OR user_id = 'public-user');

-- 7. TIGHTEN user_sessions
DROP POLICY IF EXISTS "Allow all access to user_sessions" ON public.user_sessions;

CREATE POLICY "Users can view own sessions"
  ON public.user_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Anyone can insert sessions"
  ON public.user_sessions FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);
