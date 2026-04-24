import { supabase } from '../integrations/supabase/client';

export const generateMarketVariations = async (baseIdea: string, config: any) => {
  console.log("Generazione Moltitudini in corso...");
  
  // Richiamiamo il motore per generare non solo titoli, ma "Varianti di Prodotto"
  const { data, error } = await supabase.functions.invoke('kdp-money-engine', {
    body: { 
      action: 'generate_market_variations', 
      payload: { 
        baseIdea, 
        niches: config.niches, // es: ['Self-help', 'Business', 'Bio-hacking']
        languages: config.languages, // es: ['it', 'en', 'es']
        tones: ['brutal', 'poetic', 'educational']
      } 
    }
  });

  if (error) throw error;
  return data.variations; // Restituisce un array di combinazioni Titolo/Nicchia/Promessa
};
