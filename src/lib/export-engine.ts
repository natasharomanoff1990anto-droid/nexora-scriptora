import { supabase } from '../integrations/supabase/client';

export const exportToKDP = async (bookId: string, format: 'pdf' | 'epub') => {
  const { data, error } = await supabase.functions.invoke('export-manager', {
    body: { bookId, format, quality: 'print_ready' }
  });
  
  if (data?.url) {
    window.open(data.url, '_blank'); // Scarica il file pronto per Amazon
  }
};
