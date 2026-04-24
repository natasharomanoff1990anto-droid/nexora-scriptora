import { supabase } from '../integrations/supabase/client';

export const enableInfiniteCredits = async (userId: string) => {
  // Questo comando forza il database a credere che tu abbia un piano infinito
  const { error } = await supabase
    .from('profiles')
    .update({ 
      plan: 'pro',
      ai_usage_limit: 9999999,
      is_admin: true 
    })
    .eq('id', userId);
    
  if (!error) console.log("GOD MODE ACTIVATED: Crediti Infiniti Abilitati.");
};
