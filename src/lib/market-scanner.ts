import { supabase } from '../integrations/supabase/client';

export const scanAmazonDemand = async (topic: string) => {
  const { data, error } = await supabase.functions.invoke('kdp-money-engine', {
    body: { 
      action: 'amazon_trend_scan', 
      payload: { query: topic, source: 'brave_search' } 
    }
  });
  if (error) throw error;
  return data; // Ritorna volumi di ricerca e competitività
};
