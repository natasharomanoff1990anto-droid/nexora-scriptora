import { supabase } from '../integrations/supabase/client';

/**
 * ATTIVA GOD MODE: Crediti infiniti e piano PRO forzato nel DB
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
 * RECUPERA OVERRIDE (Richiesto da storageService.ts)
 */
export const getDevPlanOverride = () => {
  return localStorage.getItem('scriptora_dev_override');
};

/**
 * PULIZIA OVERRIDE (Richiesto da useAuth.tsx)
 */
export const clearDevPlanOverride = () => {
  localStorage.removeItem('scriptora_dev_override');
  console.log("🛡️ Dev Override Cleared.");
};

/**
 * CHECK STATO (Per logica UI)
 */
export const isDevOverrideActive = () => {
  return localStorage.getItem('scriptora_dev_override') === 'active';
};
