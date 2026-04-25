import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isDevMode } from "@/lib/dev-mode";
import { getUserUsage, getRecentUsage, formatCost, formatTokens, type UsageSummary, type UsageRow } from "@/lib/ai-usage";
import { ArrowLeft, Loader2, Activity, DollarSign, Hash, Zap } from "lucide-react";

export default function UsagePage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [recent, setRecent] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isDevMode()) {
      navigate("/", { replace: true });
      return;
    }
    Promise.all([getUserUsage(), getRecentUsage(50)]).then(([s, r]) => {
      setSummary(s);
      setRecent(r);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </button>
          <div className="text-[11px] font-mono tracking-widest text-muted-foreground">DEV · USAGE</div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <section>
          <h1 className="text-2xl font-bold tracking-tight">AI Usage & Cost</h1>
          <p className="text-sm text-muted-foreground mt-1">Tracking di tutte le chiamate AI · DeepSeek + Lovable AI</p>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat icon={<DollarSign className="h-4 w-4" />} label="Costo totale" value={formatCost(summary?.totalCost || 0)} />
          <Stat icon={<Hash className="h-4 w-4" />} label="Token totali" value={formatTokens(summary?.totalTokens || 0)} />
          <Stat icon={<Activity className="h-4 w-4" />} label="Chiamate" value={String(summary?.callsCount || 0)} />
          <Stat icon={<Zap className="h-4 w-4" />} label="Costo medio" value={formatCost(summary?.callsCount ? summary.totalCost / summary.callsCount : 0)} />
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <Panel title="Per task type">
            {summary && Object.keys(summary.byTask).length === 0 && <Empty />}
            {summary && Object.entries(summary.byTask)
              .sort((a, b) => b[1].cost - a[1].cost)
              .map(([task, v]) => (
                <Row key={task} label={task} cost={v.cost} tokens={v.tokens} calls={v.calls} max={summary.totalCost} />
              ))}
          </Panel>
          <Panel title="Per provider">
            {summary && Object.keys(summary.byProvider).length === 0 && <Empty />}
            {summary && Object.entries(summary.byProvider)
              .sort((a, b) => b[1].cost - a[1].cost)
              .map(([prov, v]) => (
                <Row key={prov} label={prov} cost={v.cost} tokens={v.tokens} calls={v.calls} max={summary.totalCost} />
              ))}
          </Panel>
        </section>

        <section>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Ultimi 50 log</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Quando</th>
                  <th className="text-left px-3 py-2 font-medium">Task</th>
                  <th className="text-left px-3 py-2 font-medium">Model</th>
                  <th className="text-right px-3 py-2 font-medium">Tokens</th>
                  <th className="text-right px-3 py-2 font-medium">Costo</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Nessun log ancora.</td></tr>
                )}
                {recent.map((r) => (
                  <tr key={r.id} className="border-t border-border/50 hover:bg-muted/20">
                    <td className="px-3 py-2 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2 font-medium">{r.task_type}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.model}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatTokens(r.total_tokens)}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatCost(Number(r.total_cost))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wider">
        {icon}{label}
      </div>
      <div className="mt-2 text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, cost, tokens, calls, max }: { label: string; cost: number; tokens: number; calls: number; max: number }) {
  const pct = max > 0 ? Math.max(2, Math.round((cost / max) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-muted-foreground">{formatCost(cost)} · {formatTokens(tokens)} · {calls}x</span>
      </div>
      <div className="mt-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Empty() {
  return <p className="text-xs text-muted-foreground">Nessun dato ancora.</p>;
}
