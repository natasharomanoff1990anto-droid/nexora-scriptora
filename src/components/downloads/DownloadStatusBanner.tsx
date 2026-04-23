// Banner shown at the top of the Download Center when no live builds exist.

import { Package } from "lucide-react";
import { downloadsEnabled, downloadMode, buildChannel, appVersion } from "@/config/downloads";

export function DownloadStatusBanner() {
  const isLive = downloadsEnabled && downloadMode === "live";

  return (
    <div className="mx-auto max-w-3xl mb-10 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 py-4 flex items-start gap-3">
      <div className="mt-0.5 h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
        <Package className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-foreground">
            {isLive ? "Build disponibili" : "Build in preparazione"}
          </span>
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold border border-primary/30">
            {buildChannel}
          </span>
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold border border-border">
            v{appVersion}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {isLive
            ? "Le versioni installabili sono pronte. Scegli la piattaforma qui sotto."
            : "L'infrastruttura di rilascio è già predisposta. I link di download verranno attivati automaticamente non appena verranno configurati nel file .env."}
        </p>
      </div>
    </div>
  );
}