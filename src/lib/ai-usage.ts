// Client-side helpers to query AI cost & token usage from ai_usage_logs.
// All edge functions log into this table via supabase/functions/_shared/ai-tracking.ts.

import { supabase } from "@/integrations/supabase/client";

export interface UsageRow {
  id: string;
  user_id: string;
  project_id: string | null;
  provider: string;
  model: string;
  task_type: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  input_cost: number;
  output_cost: number;
  total_cost: number;
  created_at: string;
}

export interface UsageSummary {
  totalTokens: number;
  totalCost: number;
  inputCost: number;
  outputCost: number;
  callsCount: number;
  byTask: Record<string, { tokens: number; cost: number; calls: number }>;
  byProvider: Record<string, { tokens: number; cost: number; calls: number }>;
}

function summarize(rows: UsageRow[]): UsageSummary {
  const summary: UsageSummary = {
    totalTokens: 0,
    totalCost: 0,
    inputCost: 0,
    outputCost: 0,
    callsCount: rows.length,
    byTask: {},
    byProvider: {},
  };
  for (const r of rows) {
    summary.totalTokens += Number(r.total_tokens) || 0;
    summary.totalCost += Number(r.total_cost) || 0;
    summary.inputCost += Number(r.input_cost) || 0;
    summary.outputCost += Number(r.output_cost) || 0;
    const t = (summary.byTask[r.task_type] ||= { tokens: 0, cost: 0, calls: 0 });
    t.tokens += Number(r.total_tokens) || 0;
    t.cost += Number(r.total_cost) || 0;
    t.calls += 1;
    const p = (summary.byProvider[r.provider] ||= { tokens: 0, cost: 0, calls: 0 });
    p.tokens += Number(r.total_tokens) || 0;
    p.cost += Number(r.total_cost) || 0;
    p.calls += 1;
  }
  return summary;
}

export async function getProjectUsage(projectId: string): Promise<UsageSummary> {
  const { data, error } = await supabase
    .from("ai_usage_logs" as any)
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) {
    console.error("[ai-usage] getProjectUsage error", error);
    return summarize([]);
  }
  return summarize((data as unknown as UsageRow[]) || []);
}

export async function getUserUsage(userId = "local-user"): Promise<UsageSummary> {
  const { data, error } = await supabase
    .from("ai_usage_logs" as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) {
    console.error("[ai-usage] getUserUsage error", error);
    return summarize([]);
  }
  return summarize((data as unknown as UsageRow[]) || []);
}

export async function getRecentUsage(limit = 50): Promise<UsageRow[]> {
  const { data, error } = await supabase
    .from("ai_usage_logs" as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[ai-usage] getRecentUsage error", error);
    return [];
  }
  return (data as unknown as UsageRow[]) || [];
}

export function formatCost(cost: number): string {
  if (cost >= 1) return `$${cost.toFixed(2)}`;
  if (cost >= 0.01) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(5)}`;
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(2)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}k`;
  return `${tokens}`;
}
