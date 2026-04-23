import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGenreProfile, resolveGenreKey } from "@/lib/genre-intelligence";

interface Props {
  genre: string;
  subcategory?: string;
  className?: string;
}

/**
 * Badge profilo genere — minimal, espandibile.
 * Mostra: genere attivo, sotto-genere, tono, ritmo, promessa lettore.
 */
export function GenreProfileBadge({ genre, subcategory, className }: Props) {
  const [open, setOpen] = useState(false);
  if (!genre) return null;

  const key = resolveGenreKey(genre, subcategory);
  const profile = getGenreProfile(genre, subcategory);

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-muted/30 backdrop-blur-sm text-xs",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-muted/50 transition-colors rounded-lg"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-medium text-foreground/80">Genre Intelligence:</span>
          <span className="font-semibold text-foreground capitalize truncate">{key.replace("-", " ")}</span>
          {subcategory ? (
            <span className="text-muted-foreground hidden sm:inline">· {subcategory}</span>
          ) : null}
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border/40">
          <Row label="Tono" value={profile.tone} />
          <Row label="Ritmo" value={profile.pacing} />
          <Row label="Promessa lettore" value={profile.readerPromise} />
          <div className="text-[11px] text-muted-foreground/80 italic pt-1 border-t border-border/30">
            DNA: {profile.authorsDNA}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground/80 font-medium shrink-0 w-24">{label}</span>
      <span className="text-foreground/90 leading-snug">{value}</span>
    </div>
  );
}
