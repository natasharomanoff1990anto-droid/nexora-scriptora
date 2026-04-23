import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Loader2, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AutoBestsellerResult } from "@/services/autoBestsellerService";

export interface BatchRun {
  index: number;
  variation?: string; // angle / variation label
  status: "pending" | "running" | "done" | "error";
  result?: AutoBestsellerResult | null;
  error?: string;
}

interface Props {
  runs: BatchRun[];
  isRunning: boolean;
  onSelect: (run: BatchRun) => void;
}

export function MultiRunPanel({ runs, isRunning, onSelect }: Props) {
  if (runs.length === 0) return null;

  // Find best by combined score
  const best = runs
    .filter((r) => r.result && r.result.status !== "failed")
    .sort((a, b) => combinedScore(b.result!) - combinedScore(a.result!))[0];

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Batch Run ({runs.filter((r) => r.status === "done").length}/{runs.length})</span>
          {isRunning && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {runs.map((r) => {
            const isBest = best && r === best;
            return (
              <li
                key={r.index}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-md border p-3 transition-colors hover:bg-muted/40",
                  isBest ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/60",
                )}
                onClick={() => r.result && onSelect(r)}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <RunIcon status={r.status} />
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      Book #{r.index + 1}
                      {isBest && <Trophy className="ml-2 inline h-4 w-4 text-emerald-500" />}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.result?.title || r.variation || (r.error ? `Error: ${r.error}` : "Pending…")}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {r.result && (
                    <>
                      <Badge variant="outline" className="text-[10px]">
                        F {r.result.finalScore.toFixed(1)}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        M {r.result.marketScore.toFixed(1)}
                      </Badge>
                    </>
                  )}
                  <StatusPill status={r.status} />
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

function RunIcon({ status }: { status: BatchRun["status"] }) {
  if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
  if (status === "done") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "error") return <XCircle className="h-4 w-4 text-destructive" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
}

function StatusPill({ status }: { status: BatchRun["status"] }) {
  const map: Record<BatchRun["status"], string> = {
    pending: "bg-muted text-muted-foreground",
    running: "bg-primary/10 text-primary",
    done: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    error: "bg-destructive/10 text-destructive",
  };
  return <span className={cn("rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wide", map[status])}>{status}</span>;
}

export function combinedScore(r: AutoBestsellerResult): number {
  const status = r.status === "ready_for_kdp" ? 2 : r.status === "needs_revision" ? 0 : -3;
  return r.finalScore * 0.55 + r.marketScore * 0.4 + status;
}
