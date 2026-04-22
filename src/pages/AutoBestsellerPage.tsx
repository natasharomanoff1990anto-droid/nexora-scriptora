import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, ChevronDown, ChevronUp, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { InputPanel } from "@/components/AutoBestseller/InputPanel";
import { ProgressTimeline } from "@/components/AutoBestseller/ProgressTimeline";
import { ResultView } from "@/components/AutoBestseller/ResultView";
import { BookLivePreview, GenerationErrorPanel } from "@/components/AutoBestseller/BookLivePreview";
import { BatchRun, MultiRunPanel } from "@/components/AutoBestseller/MultiRunPanel";
import { RecentRunsPanel } from "@/components/AutoBestseller/RecentRunsPanel";
import { useAutoBestseller } from "@/hooks/useAutoBestseller";
import { AutoBestsellerInput, AutoBestsellerResult, updateRunRow } from "@/services/autoBestsellerService";
import { autoBestsellerToProject } from "@/lib/auto-bestseller-to-project";
import { saveProjectAsync } from "@/services/storageService";
import { LeavePageDialog } from "@/components/AutoBestseller/LeavePageDialog";
import { getBookProgress } from "@/lib/book-progress";
import { ProgressBar } from "@/components/AutoBestseller/ProgressBar";

const VARIATION_ANGLES = [
  "emotional / personal transformation angle",
  "outcome-driven / measurable results angle",
  "contrarian / against conventional wisdom angle",
  "urgent / problem-solution angle",
  "niche-specific deep dive angle",
  "story-driven / case study angle",
  "scientific / evidence-based angle",
  "practical / step-by-step angle",
  "philosophical / deeper meaning angle",
  "controversial / bold claim angle",
];

const ACTIVE_RUN_KEY = "nexora-active-run";

export default function AutoBestsellerPage() {
  const navigate = useNavigate();
  const engine = useAutoBestseller();
  const [batchRuns, setBatchRuns] = useState<BatchRun[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [selectedBatchResult, setSelectedBatchResult] = useState<AutoBestsellerResult | null>(null);
  const [recentKey, setRecentKey] = useState(0);
  const [prefill, setPrefill] = useState<Partial<AutoBestsellerInput> | null>(null);
  const [autoStart, setAutoStart] = useState(false);
  const [lastInput, setLastInput] = useState<Partial<AutoBestsellerInput> | null>(null);
  const [savingProject, setSavingProject] = useState(false);
  const [briefCollapsed, setBriefCollapsed] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!engine.isRunning) {
      setRunStartedAt(null);
      setElapsedMs(0);
      return;
    }

    const started = runStartedAt ?? Date.now();
    if (!runStartedAt) setRunStartedAt(started);

    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - started);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [engine.isRunning, runStartedAt]);

  const elapsedLabel = (() => {
    const total = Math.max(0, Math.floor(elapsedMs / 1000));
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${min}:${String(sec).padStart(2, "0")}`;
  })();

  // Pick up brief from Home OR re-attach to an active run from a previous navigation
  useEffect(() => {
    const raw = sessionStorage.getItem("nexora-auto-brief");
    if (raw) {
      sessionStorage.removeItem("nexora-auto-brief");
      try {
        const parsed = JSON.parse(raw);
        setPrefill(parsed);
        setLastInput(parsed);
        if (parsed.autoStart) {
          const fullInput: AutoBestsellerInput = {
            idea: parsed.idea,
            genre: parsed.genre,
            subcategory: parsed.subcategory,
            targetAudience: parsed.targetAudience,
            tone: parsed.tone,
            language: parsed.language || "English",
            numberOfChapters: parsed.numberOfChapters,
            level: parsed.level,
            readerPromise: parsed.readerPromise,
            prefilledTitle: parsed.prefilledTitle,
            prefilledSubtitle: parsed.prefilledSubtitle,
            totalWordTarget: parsed.totalWordTarget,
          };
          // Do NOT auto-start here.
          // First show the full brief so the user can choose length, chapter mode,
          // number of chapters and pro structure before generation starts.
          setPrefill(fullInput);
          setLastInput(fullInput);
          setAutoStart(false);
          setBriefCollapsed(false);
          toast.info("Brief caricato: scegli lunghezza, capitoli e struttura, poi genera.");
        }
        return;
      } catch { /* ignore */ }
    }
    // No fresh brief — check for active run started in a previous navigation
    const activeRaw = sessionStorage.getItem(ACTIVE_RUN_KEY);
    if (activeRaw) {
      try {
        const active = JSON.parse(activeRaw);
        if (active?.input) setLastInput(active.input);
        if (active?.runId) {
          setBriefCollapsed(true);
          void engine.attachToRun(active.runId);
        }
      } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-collapse brief when generation starts; expand when finished without result
  useEffect(() => {
    if (engine.isRunning) setBriefCollapsed(true);
  }, [engine.isRunning]);

  const handleDeleteGeneration = async () => {
    setSavingDraft(true);
    try {
      engine.cancel();

      if (engine.runId) {
        await updateRunRow(engine.runId, {
          status: "cancelled",
          error: "Cancelled by user",
        } as any);
      }

      engine.reset();
      setShowLeaveDialog(false);
      toast.success("Generazione eliminata");
    } catch (e) {
      console.error("Delete generation failed:", e);
      toast.error("Non sono riuscito a eliminare la generazione");
    } finally {
      setSavingDraft(false);
    }
  };



  // Persist active run flag so user can navigate away & come back
  useEffect(() => {
    if (engine.isRunning && engine.runId) {
      sessionStorage.setItem(ACTIVE_RUN_KEY, JSON.stringify({
        runId: engine.runId,
        title: engine.liveBook.title || lastInput?.idea?.slice(0, 60) || "Generating book…",
        input: lastInput,
        startedAt: Date.now(),
      }));
    } else if (!engine.isRunning && engine.result) {
      sessionStorage.removeItem(ACTIVE_RUN_KEY);
    }
  }, [engine.isRunning, engine.runId, engine.liveBook.title, engine.result, lastInput]);

  // Warn before unload during active generation
  useEffect(() => {
    if (!engine.isRunning) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);


  return () => window.removeEventListener("beforeunload", handler);
  }, [engine.isRunning]);

  const handleGenerateOne = useCallback(async (input: AutoBestsellerInput) => {
    setBatchRuns([]);
    setSelectedBatchResult(null);
    setLastInput(input);
    setAutoStart(false);
    setBriefCollapsed(true);
    try {
      const result = await engine.start(input);
      if (result) toast.success(`Generation complete — ${result.status}`);
      setRecentKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    }
  }, [engine]);

  const handleGenerateBatch = useCallback(async (baseInput: AutoBestsellerInput, count: number) => {
    setSelectedBatchResult(null);
    setLastInput(baseInput);
    setAutoStart(false);
    setBriefCollapsed(true);
    const batchId = crypto.randomUUID();
    const initialRuns: BatchRun[] = Array.from({ length: count }, (_, i) => ({
      index: i,
      variation: VARIATION_ANGLES[i % VARIATION_ANGLES.length],
      status: "pending",
    }));
    setBatchRuns(initialRuns);
    setBatchRunning(true);

    for (let i = 0; i < count; i++) {
      const angle = VARIATION_ANGLES[i % VARIATION_ANGLES.length];
      const variantInput: AutoBestsellerInput = {
        ...baseInput,
        idea: `${baseInput.idea}\n\nAPPROACH ANGLE: ${angle}`,
      };
      setBatchRuns((prev) => prev.map((r) => r.index === i ? { ...r, status: "running" } : r));
      try {
        const result = await engine.start(variantInput, batchId);
        setBatchRuns((prev) => prev.map((r) =>
          r.index === i ? { ...r, status: result ? "done" : "error", result, error: result ? undefined : "no result" } : r
        ));
        setRecentKey((k) => k + 1);
      } catch (e) {
        setBatchRuns((prev) => prev.map((r) =>
          r.index === i ? { ...r, status: "error", error: e instanceof Error ? e.message : "failed" } : r
        ));
      }
    }
    setBatchRunning(false);
    toast.success(`Batch complete (${count} runs)`);
  }, [engine]);

  const handleSaveAsProject = useCallback(async (result: AutoBestsellerResult) => {
    if (savingProject) return;
    setSavingProject(true);
    try {
      const project = autoBestsellerToProject(result, lastInput || undefined);
      await saveProjectAsync(project);
      toast.success("Project saved — opening editor…");
      sessionStorage.setItem("nexora-open-project", project.id);
      setTimeout(() => navigate("/app"), 300);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save project");
    } finally {
      setSavingProject(false);
    }
  }, [navigate, lastInput, savingProject]);

  const handleRecentOpen = useCallback((r: AutoBestsellerResult) => {
    setSelectedBatchResult(r);
  }, []);

  const handleRecentOpenRunning = useCallback((runId: string, input: AutoBestsellerInput) => {
    setLastInput(input);
    setSelectedBatchResult(null);
    setBriefCollapsed(true);
    sessionStorage.setItem(ACTIVE_RUN_KEY, JSON.stringify({
      runId,
      title: input?.idea?.slice(0, 60) || "Generating book…",
      input,
      startedAt: Date.now(),
    }));
    void engine.attachToRun(runId);
    toast.info("Live preview attiva — riconnesso alla generazione");
  }, [engine]);

  const handleRecentRegenerate = useCallback((input: AutoBestsellerInput) => {
    setPrefill({ ...input });
    setAutoStart(true);
  }, []);

  const handleRecentUseAsBase = useCallback((input: AutoBestsellerInput) => {
    setPrefill({ ...input });
    setAutoStart(false);
    setBriefCollapsed(false);
    toast.info("Brief loaded — adjust and generate");
  }, []);

  const handleLeaveToHome = useCallback(() => {
    if (engine.isRunning) {
      setShowLeaveDialog(true);
      return;
    }
    navigate("/");
  }, [engine.isRunning, navigate]);

  const handleContinueInBackground = useCallback(() => {
    setShowLeaveDialog(false);
    toast.info("Generazione in background. La trovi in 'In corso' sulla home.");
    navigate("/");
  }, [navigate]);

  const handleSaveDraftAndStop = useCallback(async () => {
    setSavingDraft(true);
    try {
      const projectId = await engine.stopAndSaveDraft();
      if (projectId) {
        toast.success("Bozza salvata. Puoi riprenderla da 'I miei libri'.");
        sessionStorage.removeItem("nexora-active-run");
      } else {
        toast.info("Niente da salvare ancora.");
      }
      setShowLeaveDialog(false);
      navigate("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Salvataggio fallito");
    } finally {
      setSavingDraft(false);
    }
  }, [engine, navigate]);

  const displayedResult = selectedBatchResult ?? engine.result;
  const isAnyRunning = engine.isRunning || batchRunning;
  const showLivePreview = engine.isRunning || (!selectedBatchResult && !engine.result && engine.liveBook.chapters.length > 0);
  // During an active run, hide the brief panel entirely (focus on writing); show only "Edit brief" button
  const showBriefPanel = !isAnyRunning && !briefCollapsed;
  const bookProgress = getBookProgress(engine.liveBook, lastInput?.numberOfChapters);
  const showHeaderProgress = isAnyRunning && (engine.liveBook.chapters.length > 0 || !!engine.liveBook.outlines);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleLeaveToHome}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Home
            </Button>
            <div>
              <h1 className="flex items-center gap-2 text-lg font-semibold">
                <Sparkles className="h-5 w-5 text-primary" />
                {isAnyRunning ? "Writing your book…" : "Auto Bestseller Mode"}
              </h1>
              {isAnyRunning && (
                <p className="text-xs text-muted-foreground">
                  Auto-saving · You can leave this page — generation continues
                </p>
              )}
            </div>
          </div>
          {isAnyRunning && lastInput && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBriefCollapsed((v) => !v)}
              className="hidden sm:inline-flex"
            >
              {briefCollapsed ? <Pencil className="mr-1.5 h-3.5 w-3.5" /> : <X className="mr-1.5 h-3.5 w-3.5" />}
              {briefCollapsed ? "View brief" : "Hide brief"}
            </Button>
          )}
        </div>
        {showHeaderProgress && (
          <div className="mx-auto max-w-7xl px-4 pb-3">
            <div className="flex items-center gap-3">
              <ProgressBar
                percent={bookProgress.percent}
                variant={bookProgress.percent === 100 ? "success" : "primary"}
                animated={engine.isRunning && bookProgress.percent < 100}
                size="sm"
              />
              <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                {bookProgress.percent}%
              </span>
              <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                {bookProgress.chaptersDone}/{bookProgress.totalChapters} ch
              </span>
            </div>
          </div>
        )}
      </header>

      <main
        className={
          showBriefPanel
            ? "mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[400px,1fr]"
            : "mx-auto max-w-4xl px-4 py-6"
        }
      >
        {showBriefPanel && (
          <aside className="space-y-6">
            <InputPanel
              isRunning={isAnyRunning}
              initialInput={prefill}
              autoStart={autoStart}
              onGenerateOne={handleGenerateOne}
              onGenerateBatch={handleGenerateBatch}
            />
            {batchRuns.length > 0 && (
              <MultiRunPanel
                runs={batchRuns}
                isRunning={batchRunning}
                onSelect={(r) => r.result && setSelectedBatchResult(r.result)}
              />
            )}
            <RecentRunsPanel
              refreshKey={recentKey}
              onOpenResult={handleRecentOpen}
              onOpenRunning={handleRecentOpenRunning}
              onRegenerate={handleRecentRegenerate}
              onUseAsBase={handleRecentUseAsBase}
            />
          </aside>
        )}

        {/* Collapsed brief preview (when running) */}
        {isAnyRunning && briefCollapsed && lastInput && (
          <button
            onClick={() => setBriefCollapsed(false)}
            className="mb-4 flex w-full items-center justify-between gap-3 rounded-md border border-border/60 bg-card/40 px-4 py-2.5 text-left text-xs transition-colors hover:bg-muted/30"
          >
            <span className="truncate text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider text-foreground/80">Brief:</span>{" "}
              {lastInput.idea?.slice(0, 90)}{(lastInput.idea?.length || 0) > 90 ? "…" : ""} · {lastInput.genre} · {lastInput.language}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
        )}

        <section className="space-y-6">
          {showLivePreview && (
            <BookLivePreview
              liveBook={engine.liveBook}
              isRunning={engine.isRunning}
              totalChaptersHint={lastInput?.numberOfChapters}
            />
          )}

          {(engine.isRunning || engine.stages.some((s) => s.status !== "pending")) && !displayedResult && (
            <details className="group rounded-md border border-border/60 bg-card/40">
              <summary className="cursor-pointer list-none px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/30">
                Pipeline details ({engine.stages.filter((s) => s.status === "done").length}/{engine.stages.length})
              </summary>
              <div className="p-3 pt-0">
                <ProgressTimeline
                  stages={engine.stages}
                  retries={engine.retries}
                  chapters={engine.chapters}
                  isRunning={engine.isRunning}
                />
              </div>
            </details>
          )}

          {engine.error && !displayedResult && (
            <GenerationErrorPanel
              message={engine.error}
              hasPartialContent={engine.liveBook.chapters.length > 0}
              onReset={() => { engine.reset(); setBriefCollapsed(false); }}
              onContinue={lastInput ? () => handleGenerateOne(lastInput as AutoBestsellerInput) : undefined}
            />
          )}

          {displayedResult && (
            <ResultView result={displayedResult} onSaveAsProject={handleSaveAsProject} />
          )}

          {!engine.isRunning && !displayedResult && batchRuns.length === 0 && !engine.error && engine.liveBook.chapters.length === 0 && !showBriefPanel && (
            <div className="rounded-md border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
              <Button variant="outline" onClick={() => setBriefCollapsed(false)}>
                <Pencil className="mr-2 h-4 w-4" /> Open brief
              </Button>
            </div>
          )}
        </section>

      {engine.isRunning && (
        <div className="fixed right-4 top-20 z-40 w-[min(92vw,260px)] rounded-full border border-primary/25 bg-background/90 px-3 py-2 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Auto-writing
              </p>
              <p className="text-xs font-bold text-foreground">
                {elapsedLabel}
              </p>
            </div>
            <div className="hidden h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary sm:flex">
              ✒️
            </div>
          </div>

          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${Math.min(95, Math.max(8, bookProgress.percent || 8))}%` }}
            />
          </div>

          <div className="mt-2 flex gap-1">
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 rounded-full text-xs"
              onClick={() => {
                engine.cancel();
                setShowLeaveDialog(false);
                toast.info("Generazione fermata. Puoi ripartire da una nuova bozza.");
              }}
            >
              Ferma
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-full text-xs"
              onClick={() => setShowLeaveDialog(true)}
            >
              Opzioni
            </Button>
          </div>
        </div>
      )}

      </main>

      <LeavePageDialog
        open={showLeaveDialog}
        onClose={() => setShowLeaveDialog(false)}
        onContinueInBackground={handleContinueInBackground}
        onSaveDraftAndStop={handleSaveDraftAndStop}
        onDeleteRun={handleDeleteGeneration}
        saving={savingDraft}
        hasContent={engine.liveBook.chapters.length > 0 || engine.isRunning}
        progressPercent={bookProgress.percent}
        progressLabel={`${bookProgress.chaptersDone}/${bookProgress.totalChapters} capitoli completati`}
      />
    </div>
  );
}
