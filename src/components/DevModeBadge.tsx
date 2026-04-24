import React from 'react';
import { useDevPlanOverride } from '../lib/dev-plan-override';
import { Shield, ShieldAlert, Zap } from 'lucide-react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export const DevModeBadge = () => {
  const { isActive, toggleOverride } = useDevPlanOverride();

  // Definiamo i dati visuali in modo sicuro
  const config = isActive 
    ? { icon: <Shield className="w-4 h-4 text-white" />, label: "GOD MODE ACTIVE", color: "bg-zinc-900 border-white" }
    : { icon: <Zap className="w-4 h-4 text-zinc-500" />, label: "DEV MODE", color: "bg-black border-zinc-800" };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleOverride}
            className={`h-8 px-3 gap-2 text-[10px] font-black tracking-widest uppercase transition-all ${config.color}`}
          >
            {config.icon}
            <span className="hidden md:inline">{config.label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-zinc-900 border-zinc-800 text-white text-[10px]">
          {isActive ? "Tutti i limiti sono disattivati" : "Clicca per sbloccare i limiti crediti"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
