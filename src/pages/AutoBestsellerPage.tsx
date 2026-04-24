import React, { useState } from 'react';
import { DeepSpaceBG } from '../components/DeepSpaceBG';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Zap, Search, Database, Palette, ShieldAlert, FileOutput, PenTool, Layers, Target } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

const AutoBestsellerPage = () => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start py-12 px-6 text-white overflow-y-auto">
      <DeepSpaceBG />

      {/* HEADER DI CONTROLLO */}
      <div className="z-10 w-full max-w-5xl flex justify-between items-center mb-8 bg-white/5 p-4 backdrop-blur-md border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">System Status: Diamond Pro Online</span>
        </div>
        <div className="text-[10px] font-mono text-zinc-500">ID_SESSION: {Math.random().toString(36).substring(7).toUpperCase()}</div>
      </div>

      <div className="z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLONNA SINISTRA: CORE ENGINE */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black/40 border border-white/10 p-8 backdrop-blur-xl">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400 mb-6 flex items-center gap-2">
              <PenTool className="w-3 h-3" /> Officina Creativa (Shadow Writing)
            </h2>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Inserisci Titolo o Idea Nucleo..."
              className="bg-transparent border-0 border-b-2 border-zinc-800 rounded-none text-3xl font-black h-20 mb-8 focus:border-white transition-all"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Button className="bg-white text-black h-16 font-black uppercase hover:invert">
                <Zap className="mr-2 w-5 h-5" /> Genera Capitolo 1
              </Button>
              <Button variant="outline" className="border-white/20 h-16 font-black uppercase hover:bg-white hover:text-black">
                <Layers className="mr-2 w-5 h-5" /> Architettura Libro
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="bg-black/40 border border-white/10 p-6">
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                  <Target className="w-3 h-3" /> Ricerca Nicchie
                </h3>
                <Button variant="ghost" className="w-full justify-start text-xs border border-white/5 hover:bg-white/5">Scansiona Domanda Amazon</Button>
             </div>
             <div className="bg-black/40 border border-white/10 p-6">
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                  <FileOutput className="w-3 h-3" /> Export & Publish
                </h3>
                <Button variant="ghost" className="w-full justify-start text-xs border border-white/5 hover:bg-white/5">Esporta PDF / ePub</Button>
             </div>
          </div>
        </div>

        {/* COLONNA DESTRA: INTELLIGENCE & UTILITY */}
        <div className="space-y-6">
          <div className="bg-zinc-950/80 border border-white/10 p-6 space-y-6">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 border-b border-white/10 pb-2">Parametri Sotto il Cofano</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase text-zinc-600">Vector Memory</span>
                <span className="text-[10px] text-green-500 font-mono">ACTIVE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase text-zinc-600">Language Killer V2</span>
                <span className="text-[10px] text-green-500 font-mono">ON</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase text-zinc-600">KDP Real-Time</span>
                <span className="text-[10px] text-blue-500 font-mono">SYNCED</span>
              </div>
            </div>

            <div className="pt-6 space-y-2">
              <Button variant="outline" className="w-full border-white/10 text-[10px] h-10 uppercase font-black hover:bg-white hover:text-black">
                <Search className="w-3 h-3 mr-2" /> Analisi Market Radar
              </Button>
              <Button variant="outline" className="w-full border-white/10 text-[10px] h-10 uppercase font-black hover:bg-white hover:text-black">
                <Palette className="w-3 h-3 mr-2" /> Studio Visual DNA
              </Button>
              <Button variant="outline" className="w-full border-red-900/50 text-red-500 text-[10px] h-10 uppercase font-black hover:bg-red-500 hover:text-white">
                <ShieldAlert className="w-3 h-3 mr-2" /> Reset Moduli Sicurezza
              </Button>
            </div>
          </div>
          
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <p className="text-[9px] leading-relaxed uppercase font-bold">
              Tip: Usa la Modalità Shadow per scrivere il libro basandoti sullo stile dei tuoi file caricati.
            </p>
          </div>
        </div>

      </div>

      <div className="mt-12 opacity-20 hover:opacity-100 transition-opacity">
         <span className="text-[8px] font-mono tracking-widest uppercase">Encryption Key: ********************************</span>
      </div>
    </div>
  );
};

export default AutoBestsellerPage;
