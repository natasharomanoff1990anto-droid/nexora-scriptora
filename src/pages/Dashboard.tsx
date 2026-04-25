import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Rocket, BookOpen, Target, Brain } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">Plancia di Comando</h1>
        <p className="text-zinc-500 italic">Scriptora Platino Engine v4.0 Active</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        <Card className="p-6 bg-zinc-950 border-zinc-800 hover:border-white transition-all cursor-pointer" onClick={() => navigate('/auto-bestseller')}>
          <Rocket className="w-10 h-10 mb-4 text-white" />
          <h2 className="text-xl font-bold mb-2 uppercase">Auto-Bestseller</h2>
          <p className="text-sm text-zinc-400">Genera un intero libro con Standard Platino e Memory Vettoriale.</p>
        </Card>

        <Card className="p-6 bg-zinc-950 border-zinc-800 opacity-50">
          <Target className="w-10 h-10 mb-4" />
          <h2 className="text-xl font-bold mb-2 uppercase">KDP Intelligence</h2>
          <p className="text-sm text-zinc-400">Analisi di mercato integrata (Coming Soon nel pannello dedicato).</p>
        </Card>

        <Card className="p-6 bg-zinc-950 border-zinc-800" onClick={() => navigate('/dashboard')}>
          <BookOpen className="w-10 h-10 mb-4" />
          <h2 className="text-xl font-bold mb-2 uppercase">I Miei Manoscritti</h2>
          <p className="text-sm text-zinc-400">Gestisci e rifinisci le tue opere d'élite.</p>
        </Card>

        <Card className="p-6 bg-zinc-950 border-zinc-800">
          <Brain className="w-10 h-10 mb-4" />
          <h2 className="text-xl font-bold mb-2 uppercase">Memory Lab</h2>
          <p className="text-sm text-zinc-400">Visualizza i frammenti vettoriali memorizzati.</p>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
