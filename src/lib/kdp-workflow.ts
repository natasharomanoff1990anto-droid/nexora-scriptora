import { supabase } from '../integrations/supabase/client';

export const startBestsellerSequence = async (idea: string, niche: string) => {
  console.log("Inizio Sequenza Platino per:", idea);
  
  // 1. ANALISI INTELLIGENTE & GENERAZIONE 5 TITOLI
  const { data: marketData, error: marketError } = await supabase.functions.invoke('kdp-money-engine', {
    body: { 
      action: 'generate_titles', 
      payload: { idea, niche, count: 5, strategy: 'dominant' } 
    }
  });

  if (marketError) throw marketError;

  // 2. PASSAGGIO AL BLUEPRINT (Architettura)
  // Una volta scelto il titolo vincitore (o il migliore dei 5), creiamo l'indice
  const bestTitle = marketData.titles[0].text;
  
  const { data: blueprintData, error: bpError } = await supabase.functions.invoke('auto-bestseller-engine', {
    body: { 
      action: 'create_blueprint', 
      payload: { title: bestTitle, depth: 'professional' } 
    }
  });

  return { titles: marketData.titles, blueprint: blueprintData };
};
