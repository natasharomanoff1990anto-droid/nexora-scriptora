import { supabase } from '../integrations/supabase/client';

/**
 * ATTIVA GOD MODE: Crediti infiniti e piano PRO forzato
 */
export const enableInfiniteCredits = async (userId: string) => {
  const { error } = await supabase
    .from('profiles')
    .update({ 
      plan: 'pro',
      ai_usage_limit: 9999999,
      is_admin: true 
    })
    .eq('id', userId);
    
  if (!error) {
    console.log("🚀 GOD MODE: Crediti infiniti attivati per " + userId);
    localStorage.setItem('scriptora_dev_override', 'active');
  }
};

/**
 * PULIZIA OVERRIDE (Richiesto da useAuth.tsx per evitare crash)
 */
export const clearDevPlanOverride = () => {
  localStorage.removeItem('scriptora_dev_override');
  console.log("🛡️ Dev Override Cleared.");
};

/**
 * CHECK STATO (Per il frontend)
 */
export const isDevOverrideActive = () => {
  return localStorage.getItem('scriptora_dev_override') === 'active';
};
