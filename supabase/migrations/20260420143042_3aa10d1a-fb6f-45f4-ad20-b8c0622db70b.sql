
DROP POLICY IF EXISTS "Service can insert usage" ON public.ai_usage_logs;
CREATE POLICY "Authenticated insert own usage"
  ON public.ai_usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Anyone can insert sessions" ON public.user_sessions;
CREATE POLICY "Authenticated insert own session"
  ON public.user_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);
