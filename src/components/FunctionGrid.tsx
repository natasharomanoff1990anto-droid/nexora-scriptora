import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Database, 
  Search, 
  Palette, 
  ShieldCheck, 
  BarChart3 
} from 'lucide-react';

const functions = [
  { 
    id: 'bestseller', 
    name: 'Neural Engine', 
    desc: 'Scrittura Platino V2', 
    icon: <Zap className="w-8 h-8 text-yellow-400" />, 
    gradient: "from-yellow-500/20 to-orange-500/10",
    path: '/auto-bestseller'
  },
  { 
    id: 'memory', 
    name: 'Vector Vault', 
    desc: 'Memoria Vettoriale', 
    icon: <Database className="w-8 h-8 text-blue-400" />, 
    gradient: "from-blue-500/20 to-indigo-500/10",
    path: '/memory'
  },
  { 
    id: 'kdp', 
    name: 'Market Scan', 
    desc: 'Radar KDP & Brave', 
    icon: <Search className="w-8 h-8 text-green-400" />, 
    gradient: "from-green-500/20 to-emerald-500/10",
    path: '/kdp-launch'
  },
  { 
    id: 'dna', 
    name: 'Visual DNA', 
    desc: 'Cover & Aesthetics', 
    icon: <Palette className="w-8 h-8 text-purple-400" />, 
    gradient: "from-purple-500/20 to-pink-500/10",
    path: '/cover-studio'
  },
  { 
    id: 'killer', 
    name: 'Style Guard', 
    desc: 'Anti-Cliché Filter', 
    icon: <ShieldCheck className="w-8 h-8 text-red-400" />, 
    gradient: "from-red-500/20 to-rose-500/10",
    path: '/settings'
  },
  { 
    id: 'stats', 
    name: 'Impact Analytics', 
    desc: 'Previsioni Vendite', 
    icon: <BarChart3 className="w-8 h-8 text-cyan-400" />, 
    gradient: "from-cyan-500/20 to-sky-500/10",
    path: '/usage'
  }
];

export const FunctionGrid = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto p-4">
      {functions.map((app) => (
        <button
          key={app.id}
          onClick={() => navigate(app.path)}
          className={`group relative flex flex-col items-center justify-center p-8 rounded-2xl border border-white/5 bg-gradient-to-br ${app.gradient} backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]`}
        >
          <div className="mb-4 transform transition-transform group-hover:rotate-12">
            {app.icon}
          </div>
          <h3 className="text-sm font-bold tracking-widest uppercase mb-1 text-white">
            {app.name}
          </h3>
          <p className="text-[10px] text-zinc-500 uppercase font-medium">
            {app.desc}
          </p>
          {/* Badge stile Google App */}
          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-white animate-pulse" />
        </button>
      ))}
    </div>
  );
};
