-- Hardening RLS anti-spoof: difesa in profondità.
-- Obiettivo: nessun utente authenticated può scrivere righe con user_id "fake"
-- (local-user-*, public-user) anche se il frontend ha un bug.
-- Le policy esistenti già lo impediscono via (user_id = auth.uid()), ma aggiungiamo
-- CHECK constraint a livello di tabella come seconda barriera invalicabile.

-- 1) Funzione helper: rifiuta user_id sandbox quando la chiamata è authenticated.
CREATE OR REPLACE FUNCTION public.reject_sandbox_user_id_for_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se la sessione è authenticated (auth.uid() non null), il user_id DEVE essere un uuid reale.
  IF auth.uid() IS NOT NULL THEN
    IF NEW.user_id LIKE 'local-user-%' OR NEW.user_id = 'public-user' THEN
      RAISE EXCEPTION 'Spoof rejected: authenticated session cannot write sandbox user_id (%).', NEW.user_id
        USING ERRCODE = '42501';
    END IF;
    -- Inoltre deve coincidere con auth.uid() (ridondante con RLS, ma esplicito).
    IF NEW.user_id <> (auth.uid())::text THEN
      RAISE EXCEPTION 'Spoof rejected: user_id (%) does not match auth.uid().', NEW.user_id
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 2) Applica il trigger a tutte le tabelle con user_id text.
DROP TRIGGER IF EXISTS trg_reject_sandbox_projects ON public.projects;
CREATE TRIGGER trg_reject_sandbox_projects
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.reject_sandbox_user_id_for_auth();

DROP TRIGGER IF EXISTS trg_reject_sandbox_runs ON public.auto_bestseller_runs;
CREATE TRIGGER trg_reject_sandbox_runs
  BEFORE INSERT OR UPDATE ON public.auto_bestseller_runs
  FOR EACH ROW EXECUTE FUNCTION public.reject_sandbox_user_id_for_auth();

DROP TRIGGER IF EXISTS trg_reject_sandbox_usage ON public.ai_usage_logs;
CREATE TRIGGER trg_reject_sandbox_usage
  BEFORE INSERT OR UPDATE ON public.ai_usage_logs
  FOR EACH ROW EXECUTE FUNCTION public.reject_sandbox_user_id_for_auth();

DROP TRIGGER IF EXISTS trg_reject_sandbox_plans ON public.user_plans;
CREATE TRIGGER trg_reject_sandbox_plans
  BEFORE INSERT OR UPDATE ON public.user_plans
  FOR EACH ROW EXECUTE FUNCTION public.reject_sandbox_user_id_for_auth();

DROP TRIGGER IF EXISTS trg_reject_sandbox_sessions ON public.user_sessions;
CREATE TRIGGER trg_reject_sandbox_sessions
  BEFORE INSERT OR UPDATE ON public.user_sessions
  FOR EACH ROW EXECUTE FUNCTION public.reject_sandbox_user_id_for_auth();