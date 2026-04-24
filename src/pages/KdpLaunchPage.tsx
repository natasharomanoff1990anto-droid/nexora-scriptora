import React, { useState } from 'react';
import { DeepSpaceBG } from '../components/DeepSpaceBG';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { 
  Target, 
  BarChart3, 
  Search, 
  ArrowLeft,
  Zap,
  PackageCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';

const KdpLaunchPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null); // LA VARIABILE ORA È DEFINITA
  const [titleInput, setTitleInput] = useState('');

  const runMarketAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('kdp-money-engine', {
        body: { 
          action: 'full_market_scan', 
          payload: { idea: titleInput, strategy: 'diamond_pro' } 
        }
      });
      if (data) setAnalysis(data);
    } catch (err) {
      console.error("Analisi fallita:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center py-10 px-6 text-white overflow-y-auto">
      <DeepSpaceBG />
      
      <div className="z-10 w-full max-w-5xl flex justify-between items-center mb-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-zinc-500 hover:text-white uppercase text-[10px] tracking-widest">
          <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
        </Button>
        <span className="text-[10px] font-black text-blue-500 tracking-[0.3em]">KDP_DOMINATION_PROTOCOL_V4</span>
      </div>

      <div className="z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SINISTRA: INPUT E CONTROLLI */}
        <div className="lg:col-span-7 space-y-8 bg-black/60 border border-white/10 p-10 backdrop-blur-xl">
          <div className="space-y-2">
            <h1 className="text-4xl font-black uppercase tracking-tighter">KDP <span className="text-blue-500">Launch</span></h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Analizzatore di Moltitudini Asset</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase text-zinc-500">Idea / Promessa Madre</label>
              <Input 
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="Es: Storia d'America Brutale" 
                className="bg-transparent border-zinc-800 rounded-none h-14 text-xl" 
              />
            </div>

            <Button onClick={runMarketAnalysis} disabled={loading} className="w-full h-16 bg-blue-600 hover:bg-white hover:text-black text-white font-black uppercase text-lg transition-all">
              {loading ? "Scansione Orizzonti..." : "Cerca Titoli & Varianti"}
            </Button>
          </div>
        </div>

        {/* DESTRA: INTELLIGENCE REAL-TIME */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-950/90 border border-white/10 p-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" /> Market Intelligence
            </h3>
            
            {analysis ? (
              <div className="space-y-6 animate-in fade-in">
                <div className="p-4 bg-blue-500/10 border border-blue-500/30">
                  <span className="text-[9px] text-zinc-500 uppercase">Niche Score</span>
                  <div className="text-3xl font-black text-white">{analysis.nicheScore || '8.5'}/10</div>
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-zinc-600 uppercase">Titolo Vincitore:</span>
                  <p className="text-lg font-bold text-white uppercase">{analysis.topTitle || 'Protocollo America'}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 opacity-20">
                <Search className="w-12 h-12 mx-auto mb-4" />
                <p className="text-[10px] uppercase font-bold">In attesa di input...</p>
              </div>
            )}
          </div>
        </div>

        {/* MATRICE DELLE VARIANTI (LA PARTE CHE DAVA ERRORE) */}
        {analysis && (
          <div className="lg:col-span-12 mt-10 space-y-6 bg-black/40 border border-white/10 p-10 backdrop-blur-xl">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Matrice delle Moltitudini</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-6 border border-white/5 bg-zinc-900/50 hover:border-blue-500 transition-all group">
                  <span className="text-[8px] bg-blue-500 text-black px-2 py-0.5 font-bold uppercase mb-4 inline-block">Variante {i}</span>
                  <h4 className="text-sm font-bold text-white uppercase mb-2">Titolo Variante Pro {i}</h4>
                  <p className="text-[10px] text-zinc-500 mb-6 italic">Packaging specifico per nicchia {i}</p>
                  <Button variant="outline" className="w-full h-10 text-[9px] font-black uppercase border-zinc-800 hover:bg-white hover:text-black">
                    Genera Blueprint
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KdpLaunchPage;
