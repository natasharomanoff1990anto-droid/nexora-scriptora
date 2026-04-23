import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { loadProjects, getCurrentUserId, deleteProjectAsync } from "@/services/storageService";
import { BookProject } from "@/types/book";
import { isProjectComplete } from "@/lib/project-status";

interface RunRow {
  id: string;
  input: { idea?: string; prefilledTitle?: string; numberOfChapters?: number };
  status: string;
  progress: any;
  created_at: string;
  updated_at: string;
}

interface Props {
  /** Bumped from outside to force refresh (e.g. after returning from /auto-bestseller). */
  refreshKey?: number;
}

/**
 * Shows books currently being generated:
 *  - Active SSE runs (auto_bestseller_runs.status = 'running')
 *  - Local partial projects whose phase is not yet 'complete'
 */
export function InProgressSection({ refreshKey = 0 }: Props) {
  const navigate = useNavigate();
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [drafts, setDrafts] = useState<BookProject[]>([]);
  const [scopeTick, setScopeTick] = useState(0);

  useEffect(() => {
    const onScope = () => {
      setRuns([]);
      setDrafts([]);
      setScopeTick((t) => t + 1);
    };
    window.addEventListener("nexora-dev-mode-change", onScope);
    return () => window.removeEventListener("nexora-dev-mode-change", onScope);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("auto_bestseller_runs")
          .select("id, input, status, progress, created_at, updated_at")
          .eq("status", "running")
          .eq("user_id", getCurrentUserId())
          .order("updated_at", { ascending: false })
          .limit(10);
        if (!cancelled) setRuns((data as any) || []);
      } catch {
        if (!cancelled) setRuns([]);
      }
      try {
        const all = await loadProjects();
        if (!cancelled) {
          // Only true drafts: not complete AND have at least one chapter started.
          setDrafts(
            all.filter((p) => !isProjectComplete(p) && (p.chapters?.length || 0) > 0),
          );
        }
      } catch {
        if (!cancelled) setDrafts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, scopeTick]);

  if (runs.length === 0 && drafts.length === 0) return null;

  const totalCount = runs.length + drafts.length;

  const items = [
    ...runs.map((r) => {
      const chaptersDone = countChaptersDone(r.progress);
      const total = r.input?.numberOfChapters || estimateTotal(r.progress) || 8;
      const pct = Math.min(100, Math.round((chaptersDone / Math.max(1, total)) * 100));
      const title =
        r.input?.prefilledTitle ||
        (r.input?.idea ? r.input.idea.slice(0, 70) : "Generating book…");

      return {
        key: `run-${r.id}`,
        kind: "run" as const,
        title,
        pct,
        meta: `${chaptersDone}/${total}`,
        open: () => navigate("/auto-bestseller"),
      };
    }),
    ...drafts.map((p) => {
      const total = p.config.numberOfChapters || p.chapters.length;
      const done = p.chapters.length;
      const pct = Math.min(100, Math.round((done / Math.max(1, total)) * 100));

      return {
        key: `draft-${p.id}`,
        kind: "draft" as const,
        id: p.id,
        title: p.config.title || "Untitled",
        pct,
        meta: `Bozza · ${done}/${total}`,
        open: () => {
          sessionStorage.setItem("nexora-open-project", p.id);
          navigate("/app");
        },
      };
    }),
  ];

  const primary = items[0];
  const hiddenCount = Math.max(0, items.length - 1);

  const handleDeleteDraft = async (id: string) => {
    try {
      setDrafts((prev) => prev.filter((p) => p.id !== id));
      await deleteProjectAsync(id);
    } catch {
      const all = await loadProjects();
      setDrafts(all.filter((p) => !isProjectComplete(p) && (p.chapters?.length || 0) > 0));
    }
  };

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          In corso ({totalCount})
        </p>
        {hiddenCount > 0 && (
          <span className="text-[10px] text-muted-foreground">
            + altre {hiddenCount}
          </span>
        )}
      </div>

      {primary && (
        <div
          className={`group flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${
            primary.kind === "run"
              ? "border-primary/25 bg-primary/5 hover:border-primary/50 hover:bg-primary/10"
              : "border-amber-500/25 bg-amber-500/5 hover:border-amber-500/50 hover:bg-amber-500/10"
          }`}
        >
          <button
            onClick={primary.open}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            {primary.kind === "run" ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
            ) : (
              <Save className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{primary.title}</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${
                      primary.kind === "run" ? "bg-primary" : "bg-amber-500"
                    }`}
                    style={{ width: `${primary.pct}%` }}
                  />
                </div>
                <span className="shrink-0 text-[10px] font-semibold tabular-nums text-foreground/80">
                  {primary.pct}%
                </span>
                <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                  {primary.meta}
                </span>
              </div>
            </div>

            <ArrowRight
              className={`h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 ${
                primary.kind === "run" ? "text-primary" : "text-amber-600 dark:text-amber-400"
              }`}
            />
          </button>

          {primary.kind === "draft" && "id" in primary && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                void handleDeleteDraft(primary.id);
              }}
              className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-background/70 hover:text-destructive"
              title="Elimina bozza"
              aria-label="Elimina bozza"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function countChaptersDone(progress: any): number {
  if (!Array.isArray(progress)) return 0;
  const seen = new Set<number>();
  for (const e of progress) {
    if (e?.type === "chapter" && e?.phase === "done" && typeof e.index === "number") {
      seen.add(e.index);
    }
  }
  return seen.size;
}

function estimateTotal(progress: any): number {
  if (!Array.isArray(progress)) return 0;
  for (const e of progress) {
    if (e?.type === "chapter" && typeof e.total === "number") return e.total;
  }
  return 0;
}
