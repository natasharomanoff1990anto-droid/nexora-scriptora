import React, { useState } from 'react';
import { DeepSpaceBG } from '../components/DeepSpaceBG';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Zap, Search, Database, Palette, ShieldAlert, Cpu } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

const AutoBestsellerPage = () => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');

  // Funzione Reale 1: Generazione Blueprint (Neural Engine)
  const handleGenerate = async (multi: boolean = false) => {
    setLoading(true);
    // Qui richiamiamo la Edge Function reale
    const { data, error } = await supabase.functions.invoke('auto-bestseller-engine', {
      body: { title, action: multi ? 'generate_ten' : 'generate_one' }
    });
    setLoading(false);
    console.log(data || error);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 text-white">
      <DeepSpaceBG />

      <div className="z-10 w-full max-w-4xl bg-black/40 backdrop-blur-md border border-white/10 p-10 shadow-[0_0_50px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">MODALITÀ <br/> <span className="text-zinc-500">DIAMOND PRO</span></h1>
            <p className="text-[10px] tracking-[0.5em] text-blue-400 font-bold mt-4">SISTEMA OPERATIVO ATTIVO - DEEP SPACE PROTOCOL</p>
          </div>
          <div className="flex gap-4">
             <Cpu className="w-6 h-6 text-zinc-700 animate-pulse" />
             <Database className="w-6 h-6 text-zinc-700" />
          </div>
        </div>

        <div className="space-y-10">
          {/* Input Idea */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Core Brief / Argomento</label>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Inserisci l'idea virus..."
              className="bg-transparent border-0 border-b-2 border-zinc-800 rounded-none text-2xl h-16 focus:border-white transition-all"
            />
          </div>

          {/* Griglia Funzioni Reali */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={() => handleGenerate(false)} className="bg-white text-black h-20 font-black uppercase text-lg hover:invert">
              <Zap className="mr-2" /> Avvia Neural Engine (1 Libro)
            </Button>
            <Button onClick={() => handleGenerate(true)} variant="outline" className="border-white/20 h-20 font-black uppercase text-lg hover:bg-white hover:text-black">
              <Database className="mr-2" /> Genera 10 Varianti (Multi-Run)
            </Button>
          </div>

          {/* Sotto il cofano: Moduli Intelligence */}
          <div className="grid grid-cols-3 gap-4 pt-10 border-t border-white/5">
            <button className="flex flex-col items-center p-4 hover:bg-white/5 transition-all">
              <Search className="w-5 h-5 text-cyan-400 mb-2" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Market Radar</span>
            </button>
            <button className="flex flex-col items-center p-4 hover:bg-white/5 transition-all">
              <Palette className="w-5 h-5 text-purple-400 mb-2" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Visual DNA</span>
            </button>
            <button className="flex flex-col items-center p-4 hover:bg-white/5 transition-all">
              <ShieldAlert className="w-5 h-5 text-red-400 mb-2" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Style Guard</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-8 left-8 text-[8px] font-mono text-zinc-600">
        LATENCY: 14ms | VECTOR_VAULT: ONLINE | ENCRYPTION: PLATINUM_AES
      </div>
    </div>
  );
};

export default AutoBestsellerPage;
