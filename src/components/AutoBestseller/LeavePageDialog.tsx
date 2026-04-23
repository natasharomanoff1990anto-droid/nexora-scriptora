import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Save, X, ArrowLeft, Trash2 } from "lucide-react";
import { ProgressBar } from "@/components/AutoBestseller/ProgressBar";

interface Props {
  open: boolean;
  onClose: () => void;
  onContinueInBackground: () => void;
  onSaveDraftAndStop: () => void | Promise<void>;
  onDeleteRun?: () => void | Promise<void>;
  saving?: boolean;
  hasContent: boolean;
  /** Overall book progress percent (0-100) */
  progressPercent?: number;
  /** Optional summary, e.g. "3/8 chapters" */
  progressLabel?: string;
}

export function LeavePageDialog({
  open,
  onClose,
  onContinueInBackground,
  onSaveDraftAndStop,
  onDeleteRun,
  saving = false,
  hasContent,
  progressPercent,
  progressLabel,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lascia la pagina?</DialogTitle>
          <DialogDescription>
            La generazione del libro è in corso. Cosa vuoi fare?
          </DialogDescription>
        </DialogHeader>

        {typeof progressPercent === "number" && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                Progresso libro
              </span>
              <span className="font-semibold tabular-nums text-foreground">{progressPercent}%</span>
            </div>
            <ProgressBar percent={progressPercent} variant="primary" animated size="sm" />
            {progressLabel && (
              <p className="text-[11px] text-muted-foreground">{progressLabel}</p>
            )}
          </div>
        )}

        <div className="space-y-2 py-2">
          <button
            onClick={onContinueInBackground}
            disabled={saving}
            className="group flex w-full items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50"
          >
            <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
              <ArrowLeft className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Continua in background</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Il libro continua a essere scritto. Lo trovi in "In corso" sulla home.
              </p>
            </div>
          </button>

          <button
            onClick={() => onSaveDraftAndStop()}
            disabled={saving}
            className="group flex w-full items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-amber-500/50 hover:bg-amber-500/5 disabled:opacity-50"
          >
            <div className="mt-0.5 rounded-md bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {saving ? "Salvataggio in corso…" : "Salva bozza e ferma"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                "Salva quello che esiste adesso come bozza e interrompe la generazione."
              </p>
            </div>
          </button>


          {onDeleteRun && (
            <button
              onClick={() => onDeleteRun()}
              disabled={saving}
              className="group flex w-full items-start gap-3 rounded-lg border border-destructive/30 bg-card p-3 text-left transition-colors hover:border-destructive/70 hover:bg-destructive/5 disabled:opacity-50"
            >
              <div className="mt-0.5 rounded-md bg-destructive/10 p-2 text-destructive">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-destructive">
                  Elimina generazione
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Ferma lo stream, chiude questa generazione e la rimuove dalla sessione corrente.
                </p>
              </div>
            </button>
          )}

          <button
            onClick={onClose}
            disabled={saving}
            className="group flex w-full items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-border hover:bg-muted/50 disabled:opacity-50"
          >
            <div className="mt-0.5 rounded-md bg-muted p-2 text-muted-foreground">
              <X className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Annulla</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Resta sulla pagina e continua a guardare la generazione.</p>
            </div>
          </button>
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Chiudi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
