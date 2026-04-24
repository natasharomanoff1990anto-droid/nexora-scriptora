import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

export const setDevPlanOverride = (status: string) => {
  localStorage.setItem('scriptora_dev_override', status);
  window.dispatchEvent(new Event('storage'));
};

export const getDevPlanOverride = () => localStorage.getItem('scriptora_dev_override');

export const clearDevPlanOverride = () => {
  localStorage.removeItem('scriptora_dev_override');
  window.dispatchEvent(new Event('storage'));
};

export const isDevOverrideActive = () => localStorage.getItem('scriptora_dev_override') === 'active';

// Questa è la chiave: esportiamo un oggetto permessi che non sia mai undefined
export const DEV_PERMISSIONS = {
  canExport: true,
  canUseAI: true,
  isPro: true,
  unlimitedStorage: true,
  plan: 'pro'
};

export const useDevPlanOverride = () => {
  const [isActive, setIsActive] = useState(isDevOverrideActive());

  useEffect(() => {
    const handleStorage = () => setIsActive(isDevOverrideActive());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return { 
    isActive, 
    toggleOverride: () => setDevPlanOverride(isActive ? 'inactive' : 'active'),
    permissions: DEV_PERMISSIONS 
  };
};

export const enableInfiniteCredits = async (userId: string) => {
  await supabase.from('profiles').update({ plan: 'pro', is_admin: true }).eq('id', userId);
  setDevPlanOverride('active');
};
