import React, { useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Target, ShieldCheck, Zap, BarChart3 } from 'lucide-react';

export const KdpDominationPanel = ({ project }: any) => {
  const [loading, setLoading] = useState(false);
  const [marketData, setMarketData] = useState<any>(null);

  const analyzeMarket = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('kdp-money-engine', {
        body: { 
          action: 'analyzeMarket', 
          payload: { idea: project.config.title, genre: project.config.genre } 
        }
      });
      if (data) setMarketData(data);
    } catch (err) {
      console.error("Market Analysis Failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-panel p-6 bg-slate-950/50 border-white/10 text-slate-100 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
          <Target className="w-4 h-4" /> KDP Intelligence
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={analyzeMarket} 
          disabled={loading}
          className="border-amber-500/30 hover:bg-amber-500/10 text-amber-500 transition-all duration-300"
        >
          {loading ? "Analisi..." : "Attiva Scansione"}
        </Button>
      </div>

      {marketData ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Niche Score</span>
              <div className="text-3xl font-black text-amber-400">{marketData.nicheScore}<span className="text-sm text-slate-600">/10</span></div>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Profitability</span>
              <div className="text-3xl font-black text-emerald-400">{marketData.profitabilityScore}<span className="text-sm text-slate-600">/10</span></div>
            </div>
          </div>

          <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10">
            <span className="text-[10px] text-amber-500/70 uppercase font-bold flex items-center gap-1 mb-2">
              <ShieldCheck className="w-3 h-3" /> Recommended Angle
            </span>
            <p className="text-sm italic text-slate-300 leading-relaxed">"{marketData.recommendedAngle}"</p>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 flex items-center gap-1"><Zap className="w-3 h-3"/> Domanda:</span>
              <span className="font-black text-slate-200 uppercase tracking-widest">{marketData.demandLevel}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 flex items-center gap-1"><BarChart3 className="w-3 h-3"/> Competizione:</span>
              <span className="font-black text-slate-200 uppercase tracking-widest">{marketData.competitionLevel}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
          <p className="text-slate-500 text-xs font-medium px-4">
            Pronto per iniettare dati di mercato reali nelle tue <span className="text-amber-500/50 italic">Storie d'America</span>.
          </p>
        </div>
      )}
    </Card>
  );
};
