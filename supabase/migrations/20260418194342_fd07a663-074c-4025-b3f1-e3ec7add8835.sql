-- Auto Bestseller persistence: stores every orchestrator run + progress snapshots
CREATE TABLE public.auto_bestseller_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'local-user',
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  progress JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'running',
  retry_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  final_score NUMERIC,
  market_score NUMERIC,
  batch_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_auto_bestseller_runs_user ON public.auto_bestseller_runs(user_id, created_at DESC);
CREATE INDEX idx_auto_bestseller_runs_batch ON public.auto_bestseller_runs(batch_id) WHERE batch_id IS NOT NULL;

ALTER TABLE public.auto_bestseller_runs ENABLE ROW LEVEL SECURITY;

-- Mirror existing projects table policy (single-user local app, no auth yet)
CREATE POLICY "Allow all access to auto_bestseller_runs"
ON public.auto_bestseller_runs
FOR ALL
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_auto_bestseller_runs_updated_at
BEFORE UPDATE ON public.auto_bestseller_runs
FOR EACH ROW
EXECUTE FUNCTION public.update_projects_updated_at();