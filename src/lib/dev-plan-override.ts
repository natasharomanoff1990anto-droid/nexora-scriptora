import { supabase } from '../integrations/supabase/client';

/**
 * ATTIVA GOD MODE: Forza il database a ignorare ogni limite
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
    setDevPlanOverride('active');
    console.log("🚀 DATABASE UNLOCKED: Account promosso a PRO Admin.");
  }
};

/**
 * SET OVERRIDE (Richiesto da DevModeBadge.tsx)
 */
export const setDevPlanOverride = (status: string) => {
  localStorage.setItem('scriptora_dev_override', status);
  console.log(`🛡️ UI OVERRIDE: Stato impostato su ${status}`);
};

/**
 * GET OVERRIDE (Richiesto da storageService.ts)
 */
export const getDevPlanOverride = () => {
  return localStorage.getItem('scriptora_dev_override');
};

/**
 * CLEAR OVERRIDE (Richiesto da useAuth.tsx)
 */
export const clearDevPlanOverride = () => {
  localStorage.removeItem('scriptora_dev_override');
  console.log("🧹 CLEANUP: Dev Override rimosso.");
};

/**
 * CHECK STATO
 */
export const isDevOverrideActive = () => {
  return localStorage.getItem('scriptora_dev_override') === 'active';
};
