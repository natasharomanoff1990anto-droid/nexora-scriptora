import React, { useEffect, useState } from 'react';
import { FunctionGrid } from '../components/FunctionGrid';
import { DynamicWeatherBG } from '../components/DynamicWeatherBG';
import { supabase } from '../integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [recentBooks, setRecentBooks] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBooks = async () => {
      const { data } = await supabase
        .from('books')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(3);
      if (data) setRecentBooks(data);
    };
    fetchBooks();
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center py-12 overflow-x-hidden">
      <DynamicWeatherBG mood="noir" />

      {/* Header */}
      <div className="z-10 mb-10 text-center">
        <h1 className="text-4xl font-black tracking-tighter uppercase glitch-text">
          Scriptora <span className="text-zinc-500">Platino</span>
        </h1>
        <p className="text-[9px] tracking-[0.4em] text-zinc-500 uppercase mt-2">Sistema Operativo Editoriale</p>
      </div>

      {/* Griglia App */}
      <div className="z-10 w-full max-w-4xl px-6 mb-12">
        <FunctionGrid />
      </div>

      {/* Sessioni Attive (Reali dal DB) */}
      <div className="z-10 w-full max-w-4xl px-6">
        <h2 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-4 ml-2">Sessioni di Scrittura Attive</h2>
        <div className="grid gap-3">
          {recentBooks.length > 0 ? recentBooks.map((book) => (
            <button 
              key={book.id}
              onClick={() => navigate(`/auto-bestseller?id=${book.id}`)}
              className="glass-panel p-4 flex items-center justify-between group hover:border-white/30"
            >
              <div className="flex flex-col items-start">
                <span className="text-white font-bold text-sm uppercase">{book.title || 'Senza Titolo'}</span>
                <span className="text-[10px] text-zinc-500">Ultima modifica: {new Date(book.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="text-[10px] font-bold text-zinc-400 group-hover:text-white transition-colors">
                RIPRENDI SESSIONE →
              </div>
            </button>
          )) : (
            <div className="glass-panel p-8 text-center text-zinc-600 text-xs uppercase tracking-widest">
              Nessun manoscritto in corso. Inizia con "Neural Engine".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
