import { Sparkles } from "lucide-react";

export function ScriptoraSplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.28),transparent_42%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--accent)/0.18),transparent_30%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,hsl(var(--primary)/0.14),transparent_28%)]" />
      </div>

      <div className="relative flex flex-col items-center gap-6">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_60px_rgba(255,255,255,0.08)] backdrop-blur-xl animate-[scriptoraPulse_1.8s_ease-in-out_infinite]">
          <Sparkles className="h-7 w-7 text-white" />
        </div>

        <div className="text-center">
          <h1 className="bg-gradient-to-b from-white via-white to-white/55 bg-clip-text text-5xl font-bold tracking-[-0.08em] text-transparent sm:text-7xl">
            SCRIPTORA
          </h1>
          <p className="mt-3 text-[11px] uppercase tracking-[0.45em] text-white/45">
            premium ai writing system
          </p>
        </div>

        <div className="mt-2 h-[3px] w-44 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-white/30 via-white to-white/30 animate-[scriptoraLoad_1.6s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
