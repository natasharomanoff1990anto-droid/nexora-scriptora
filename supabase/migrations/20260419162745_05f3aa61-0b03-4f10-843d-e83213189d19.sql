-- Stale-run recovery: mark runs that have not been touched in 10+ minutes as failed.
CREATE OR REPLACE FUNCTION public.auto_fail_stale_runs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.auto_bestseller_runs
  SET
    status = 'failed',
    error = COALESCE(error, 'Generation timed out — auto-recovered. Please retry.'),
    updated_at = now()
  WHERE status = 'running'
    AND updated_at < (now() - interval '10 minutes');
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

-- Allow anonymous calls (table policy is "public" already)
GRANT EXECUTE ON FUNCTION public.auto_fail_stale_runs() TO anon, authenticated;

-- Index used by recovery query and recent-runs listing
CREATE INDEX IF NOT EXISTS auto_bestseller_runs_status_updated_idx
  ON public.auto_bestseller_runs (status, updated_at DESC);