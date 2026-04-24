import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

/**
 * LOGICA CORE
 */
export const setDevPlanOverride = (status: string) => {
  localStorage.setItem('scriptora_dev_override', status);
  window.dispatchEvent(new Event('storage')); // Notifica i componenti
  console.log(`🛡️ UI OVERRIDE: ${status}`);
};

export const getDevPlanOverride = () => localStorage.getItem('scriptora_dev_override');

export const clearDevPlanOverride = () => {
  localStorage.removeItem('scriptora_dev_override');
  window.dispatchEvent(new Event('storage'));
  console.log("🧹 CLEANUP: Dev Override rimosso.");
};

export const isDevOverrideActive = () => localStorage.getItem('scriptora_dev_override') === 'active';

/**
 * HOOK REATTIVO (Richiesto da DevModeBadge.tsx)
 */
export const useDevPlanOverride = () => {
  const [isActive, setIsActive] = useState(isDevOverrideActive());

  useEffect(() => {
    const handleStorage = () => setIsActive(isDevOverrideActive());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return { isActive, toggleOverride: () => setDevPlanOverride(isActive ? 'inactive' : 'active') };
};

/**
 * DATABASE SYNC
 */
export const enableInfiniteCredits = async (userId: string) => {
  const { error } = await supabase
    .from('profiles')
    .update({ plan: 'pro', ai_usage_limit: 9999999, is_admin: true })
    .eq('id', userId);
    
  if (!error) setDevPlanOverride('active');
};
