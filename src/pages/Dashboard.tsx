import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroSection } from '../components/Home/HeroSection';
import { DevModeBadge } from '../components/DevModeBadge';
import { Radio, ShieldAlert, Zap, Layers3, Cpu } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  const modules = [
    { icon: <Radio />, label: "GALAXY_SCAN", desc: "Ricerca nicchie KDP", path: "/market-analysis", color: "text-blue-500" },
    { icon: <ShieldAlert />, label: "PLATINUM_CORE", desc: "Analisi Bestseller", path: "/bestseller-analysis", color: "text-purple-500" },
    { icon: <Zap />, label: "NEURAL_ENGINE", desc: "Scrittura AI V4.0", path: "/auto-bestseller", color: "text-cyan-500" },
    { icon: <Layers3 />, label: "MISSION_LOG", desc: "Gestione Progetti", path: "/projects", color: "text-zinc-400" }
  ];

  return (
    <div className="relative min-h-screen font-mono">
      <div className="space-night-overlay" />
      
      <nav className="flex justify-between items-center px-8 py-5 border-b border-cyan-950 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <Cpu className="text-cyan-400 w-6 h-6 animate-pulse" />
          <h1 className="text-xl font-bold tracking-[0.2em] text-cyan-400">SCRIPTORÀ_DEEP_SPACE</h1>
        </div>
        <DevModeBadge />
      </nav>

      <main className="container mx-auto py-20 px-6">
        <HeroSection />
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-20">
          {modules.map((item, i) => (
            <button 
              key={i} 
              onClick={() => navigate(item.path)}
              className="hud-panel-dark p-8 flex flex-col items-start text-left hover:border-cyan-500/80 hover:bg-cyan-950/20 transition-all group active:scale-95"
            >
              <div className={`${item.color} mb-5 scale-125 group-hover:animate-pulse`}>{item.icon}</div>
              <h3 className="font-black text-xs tracking-widest mb-1 text-white">{item.label}</h3>
              <p className="text-zinc-600 text-[10px] uppercase group-hover:text-zinc-400 transition-colors">{item.desc}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
