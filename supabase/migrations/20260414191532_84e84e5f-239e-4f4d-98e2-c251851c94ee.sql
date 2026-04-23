
CREATE TABLE public.projects (
  id UUID NOT NULL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'local-user',
  title TEXT NOT NULL DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- For now, allow all access (no auth yet)
CREATE POLICY "Allow all access to projects"
  ON public.projects
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_projects_updated_at();
