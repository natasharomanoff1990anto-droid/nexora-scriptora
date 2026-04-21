
CREATE TABLE public.ai_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'local-user',
  project_id TEXT,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  task_type TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  input_cost NUMERIC(12, 8) NOT NULL DEFAULT 0,
  output_cost NUMERIC(12, 8) NOT NULL DEFAULT 0,
  total_cost NUMERIC(12, 8) NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_usage_project ON public.ai_usage_logs(project_id);
CREATE INDEX idx_ai_usage_user ON public.ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_task ON public.ai_usage_logs(task_type);
CREATE INDEX idx_ai_usage_created ON public.ai_usage_logs(created_at DESC);

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to ai_usage_logs"
ON public.ai_usage_logs
FOR ALL
USING (true)
WITH CHECK (true);
