import React from 'react';
import { Button } from '../ui/button';
import { BookOpen, Sparkles, TrendingUp } from 'lucide-react';

export const HeroSection = () => {
  return (
    <div className="relative py-20 px-6 text-center animate-platinum">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/5 blur-[120px] rounded-full -z-10" />
      <h1 className="text-7xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
        SCRIPTORÀ <span className="text-zinc-800">PLATINO</span>
      </h1>
      <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-10 font-light italic">
        "Non stiamo scrivendo libri. Stiamo progettando virus culturali."
      </p>
      <div className="flex gap-4 justify-center">
        <Button className="btn-platinum h-14 px-10">Inizia Nuovo Progetto</Button>
        <Button variant="outline" className="h-14 px-10 border-zinc-800 glass-panel">Analisi Mercato</Button>
      </div>
    </div>
  );
};
