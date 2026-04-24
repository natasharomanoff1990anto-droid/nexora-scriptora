import { supabase } from '../integrations/supabase/client';

export const generateShadowChapter = async (bookId: string, chapterNum: number) => {
  // Richiama il motore Platino che usa la Vector Memory dei tuoi file
  const { data, error } = await supabase.functions.invoke('auto-bestseller-engine', {
    body: { 
      action: 'shadow_write_chapter', 
      payload: { 
        bookId, 
        chapterNum,
        style: 'Platinum_Wiest_Manson',
        constraints: 'No_Clichés, Physical_Details_Start, Bold_Interruption'
      } 
    }
  });
  if (error) throw error;
  return data.content;
};
