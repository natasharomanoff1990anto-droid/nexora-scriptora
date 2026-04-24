import { supabase } from '../integrations/supabase/client';

export const triggerBraveMarketScan = async (idea: string) => {
  console.log("📡 Lancio Sonda Brave per:", idea);
  
  const { data, error } = await supabase.functions.invoke('kdp-money-engine', {
    body: { 
      action: 'brave_realtime_scan', 
      idea: idea,
      strategy: 'diamond_pro'
    }
  });

  if (error) {
    console.error("Errore Radar:", error);
    return null;
  }

  return data;
};
