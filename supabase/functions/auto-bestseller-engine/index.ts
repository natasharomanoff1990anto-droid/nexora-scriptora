import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { logAIUsage, estimateTokens } from "../_shared/ai-tracking.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Per-request tracking context (set at request entry, used by all callDeepSeek* helpers)
let __trackCtx: { projectId?: string | null; runId?: string | null } = {};

// =====================================================================
// AUTO-BESTSELLER ENGINE — SSE-streaming Publishing Brain™ orchestrator
//
// Two modes:
//   - GET  ?stream=1&payload=<base64-json> → SSE event stream
//   - POST { ...input }                    → single JSON response (legacy)
//
// SSE event types emitted (data: JSON):
//   stage         — { stage, status: "running"|"done"|"error", label, meta? }
//   retry         — { attempt, reason }
//   chapter       — { index, total, phase: "writing"|"refining"|"done", title, score?, voiceConfidence? }
//   done          — { result: OrchestratorOutput }
//   error         — { message }
// =====================================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY")!;

interface OrchestratorInput {
  idea?: string;
  topic?: string;
  genre: string;
  subcategory?: string;
  targetAudience: string;
  language?: string;
  tone?: string;
  numberOfChapters?: number;
  level?: "beginner" | "intermediate" | "advanced";
  readerPromise?: string;
  totalWordTarget?: number; // default 30000
  prefilledTitle?: string;
  prefilledSubtitle?: string;
}

// =============================================================
// CHAPTER LENGTH DISTRIBUTION
// Importance curve: opening + first 2 cores + climax > middle/closing
// =============================================================
function distributeChapterWords(totalChapters: number, totalTarget: number): number[] {
  // weights shaped like a soft bell with stronger opening
  const weights: number[] = [];
  for (let i = 0; i < totalChapters; i++) {
    const pos = i / Math.max(1, totalChapters - 1);
    // base weight 1.0, boost first third, slight boost last (climax/CTA)
    let w = 1.0;
    if (pos < 0.15) w = 1.25;          // strong intro
    else if (pos < 0.4) w = 1.15;      // setup/foundations
    else if (pos > 0.85) w = 1.1;      // climax/conclusion
    else w = 0.95;                     // middle
    weights.push(w);
  }
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => {
    const raw = Math.round((w / sum) * totalTarget);
    return Math.max(1500, Math.min(4000, raw));
  });
}

// =============================================================
// PRACTICAL SECTION DIRECTIVES PER GENRE
// =============================================================
function getPracticalDirective(genre: string): string {
  const map: Record<string, string> = {
    "cookbook": "Include AT LEAST ONE complete recipe block with: ingredients (metric + US), step-by-step numbered instructions, prep/cook time, servings, 2-3 variations.",
    "diet-nutrition": "Include a 1-day or 1-week meal plan table (breakfast/lunch/dinner/snacks) with macros and a shopping list snippet.",
    "fitness": "Include a complete workout block: exercise list, sets x reps, rest times, weekly schedule, progression notes.",
    "gardening": "Include a seasonal calendar (month-by-month or week-by-week) and a tools/materials checklist.",
    "beekeeping": "Include a hive inspection checklist and a seasonal task table.",
    "ai-tools-guide": "Include 2-3 ready-to-copy prompt templates and one full real-world workflow (input → steps → output).",
    "software-guide": "Include numbered click-by-click steps, keyboard shortcuts, and one full mini-tutorial.",
    "technical-manual": "Include numbered procedural steps, specs/parameters, and a troubleshooting table.",
    "productivity": "Include one ready-to-use template/system (table, framework, or daily protocol) with a worked example.",
    "health-medicine": "Include a clear safety disclaimer, a protocol/checklist, and warning signs to watch.",
    "education": "Include worked examples, key takeaways box, and 3-5 self-check questions.",
    "business": "Include a real case study (numbers, timeline) and one actionable framework with steps.",
    "self-help": "Include one concrete exercise the reader can do today (5-15 min) with clear instructions.",
  };
  return map[genre] || "Include at least one concrete, actionable element the reader can apply immediately.";
}

interface ScoredCandidate {
  title: string;
  subtitle: string;
  marketScore: number;
  hookStrength: number;
  verdict: string;
  full: any;
}

interface OrchestratorOutput {
  title: string;
  subtitle: string;
  blueprint: any;
  chapters: Array<{
    title: string;
    content: string;
    coachReport?: any;
    voice?: any;
    rewriteConfidence?: number;
    finalScore?: number;
  }>;
  finalScore: number;
  marketScore: number;
  status: "ready_for_kdp" | "needs_revision" | "failed";
  pipeline: {
    titleCandidates: Array<{ title: string; subtitle: string; marketScore: number; verdict: string }>;
    conceptVerdict: any;
    conceptRetries: number;
    chapterCount: number;
    avgVoiceConfidence: number;
  };
}

// ---- Helpers --------------------------------------------------------

/**
 * Call DeepSeek with automatic 1-retry on transient failures (5xx, timeout,
 * empty response). For JSON-mode calls we use `deepseek-chat` by default
 * (faster, no reasoning tokens eating the output budget). For prose
 * generation (json=false) we keep `deepseek-reasoner` for higher quality.
 * `model` overrides the default selection.
 */
async function callDeepSeek(
  system: string,
  user: string,
  json = false,
  temperature = 0.7,
  maxTokens = 4000,
  model?: string,
  taskType: string = "auto_bestseller",
): Promise<string> {
  const chosenModel = model || "deepseek-chat";
  const body: any = {
    model: chosenModel,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature,
    max_tokens: maxTokens,
  };
  if (json) body.response_format = { type: "json_object" };

  // Per-call timeout: never hang forever. Default 90s for non-stream calls.
  const PER_CALL_TIMEOUT_MS = 90_000;

  const doFetch = async (): Promise<{ ok: boolean; status: number; text: string; content: string; usage: any }> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), PER_CALL_TIMEOUT_MS);
    try {
      const r = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      const text = await r.text();
      let content = "";
      let usage: any = null;
      if (r.ok) {
        try {
          const data = JSON.parse(text);
          content = data.choices?.[0]?.message?.content || "";
          usage = data.usage || null;
        } catch { /* will retry */ }
      }
      return { ok: r.ok, status: r.status, text, content, usage };
    } catch (e: any) {
      const aborted = e?.name === "AbortError";
      return { ok: false, status: aborted ? 599 : 0, text: aborted ? "timeout" : String(e?.message || e), content: "", usage: null };
    } finally {
      clearTimeout(timer);
    }
  };

  // Up to 4 attempts with exponential backoff + jitter.
  // Retries on: 5xx, 429, network error, timeout, empty content.
  const MAX_ATTEMPTS = 4;
  let lastErr = "";
  let lastStatus = 0;
  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    const attempt = await doFetch();
    const transient = !attempt.ok
      ? attempt.status >= 500 || attempt.status === 429 || attempt.status === 0 || attempt.status === 599
      : !attempt.content || attempt.content.trim().length < 2;
    if (!transient && attempt.ok) {
      const promptTokens = attempt.usage?.prompt_tokens ?? estimateTokens(system + user);
      const completionTokens = attempt.usage?.completion_tokens ?? estimateTokens(attempt.content);
      logAIUsage({
        provider: "deepseek",
        model: chosenModel,
        taskType,
        promptTokens,
        completionTokens,
        projectId: __trackCtx.projectId || null,
        metadata: { runId: __trackCtx.runId || null, json, attempts: i },
      });
      return attempt.content;
    }
    if (!transient && !attempt.ok) {
      // Hard error (4xx other than 429) — no point retrying
      throw new Error(`DeepSeek ${attempt.status}: ${attempt.text.slice(0, 300)}`);
    }
    lastErr = attempt.text;
    lastStatus = attempt.status;
    if (i < MAX_ATTEMPTS) {
      const wait = Math.min(15_000, 1000 * Math.pow(2, i - 1)) + Math.floor(Math.random() * 800);
      console.warn(`[callDeepSeek] attempt ${i}/${MAX_ATTEMPTS} failed (status=${attempt.status}). Retrying in ${wait}ms`);
      await new Promise((res) => setTimeout(res, wait));
    }
  }
  throw new Error(`DeepSeek failed after ${MAX_ATTEMPTS} attempts (last status=${lastStatus}): ${lastErr.slice(0, 200)}`);
}

/**
 * Streaming variant of callDeepSeek for long-form prose.
 * Calls `onDelta(textChunk, accumulated)` for each token chunk and
 * returns the full accumulated text. Falls back to a single non-stream
 * retry on transient failure (no partial content yet).
 */
async function callDeepSeekStream(
  system: string,
  user: string,
  temperature: number,
  maxTokens: number,
  onDelta: (chunk: string, accumulated: string) => void | Promise<void>,
  model = "deepseek-chat",
  taskType: string = "auto_bestseller_stream",
): Promise<string> {
  const body = {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature,
    max_tokens: maxTokens,
    stream: true,
  };

  const doStream = async (): Promise<string> => {
    // Idle watchdog: abort only when no bytes for STREAM_IDLE_MS.
    const STREAM_IDLE_MS = 60_000;
    let lastByte = Date.now();
    const ctrl = new AbortController();
    const watchdog = setInterval(() => {
      if (Date.now() - lastByte > STREAM_IDLE_MS) {
        console.warn(`[callDeepSeekStream] idle ${STREAM_IDLE_MS}ms — aborting`);
        ctrl.abort();
      }
    }, 5000);
    try {
      const r = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      if (!r.ok || !r.body) {
        const errText = await r.text().catch(() => "");
        throw new Error(`DeepSeek stream ${r.status}: ${errText.slice(0, 300)}`);
      }
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        lastByte = Date.now();
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              accumulated += delta;
              await onDelta(delta, accumulated);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
      return accumulated;
    } finally {
      clearInterval(watchdog);
    }
  };

  // Up to 2 stream attempts, then fall back to non-stream call (which itself
  // retries up to 4 times). This guarantees we always get text unless DeepSeek
  // is completely down.
  for (let i = 1; i <= 2; i++) {
    try {
      const text = await doStream();
      if (text && text.trim().length >= 2) {
        logAIUsage({
          provider: "deepseek",
          model,
          taskType,
          promptTokens: estimateTokens(system + user),
          completionTokens: estimateTokens(text),
          projectId: __trackCtx.projectId || null,
          metadata: { runId: __trackCtx.runId || null, stream: true, estimated: true, attempts: i },
        });
        return text;
      }
      throw new Error("Empty stream");
    } catch (e) {
      console.warn(`[callDeepSeekStream] attempt ${i}/2 failed:`, e instanceof Error ? e.message : e);
      if (i < 2) await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
    }
  }
  console.warn("[callDeepSeekStream] all stream attempts failed — falling back to non-stream");
  const text = await callDeepSeek(system, user, false, temperature, maxTokens, model, taskType + "_fallback");
  await onDelta(text, text);
  return text;
}

/**
 * Wrap a JSON-returning DeepSeek call with one parse-retry on a slightly
 * higher temperature. Prevents a single malformed reply from breaking the
 * whole pipeline.
 */
async function callDeepSeekJson(
  system: string,
  user: string,
  temperature = 0.7,
  maxTokens = 4000,
): Promise<any> {
  try {
    const raw = await callDeepSeek(system, user, true, temperature, maxTokens);
    return parseJson(raw);
  } catch (e) {
    console.warn("[callDeepSeekJson] first parse failed, retrying:", e instanceof Error ? e.message : e);
    const raw = await callDeepSeek(
      system + "\n\nIMPORTANT: respond with VALID, COMPLETE JSON only. No prose, no markdown, no truncation.",
      user,
      true,
      Math.min(0.9, temperature + 0.1),
      maxTokens,
    );
    return parseJson(raw);
  }
}

async function invokeFunction(name: string, payload: any) {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`${name} failed ${r.status}: ${t}`);
  }
  return r.json();
}

function parseJson(raw: string): any {
  if (!raw || typeof raw !== "string") {
    throw new Error("Empty AI response");
  }
  // Strip markdown fences
  let cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  if (!cleaned) throw new Error("Empty AI response after cleanup");

  // Find JSON boundaries (object or array)
  const firstObj = cleaned.indexOf("{");
  const firstArr = cleaned.indexOf("[");
  let start = -1;
  let openChar = "{";
  let closeChar = "}";
  if (firstObj === -1 && firstArr === -1) {
    throw new Error("No JSON found in AI response");
  }
  if (firstObj === -1 || (firstArr !== -1 && firstArr < firstObj)) {
    start = firstArr; openChar = "["; closeChar = "]";
  } else {
    start = firstObj; openChar = "{"; closeChar = "}";
  }
  let end = cleaned.lastIndexOf(closeChar);
  if (end < start) end = -1;
  let candidate = end > start ? cleaned.substring(start, end + 1) : cleaned.substring(start);

  // First attempt
  try { return JSON.parse(candidate); } catch { /* repair below */ }

  // Repair common issues
  let repaired = candidate
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Auto-close unbalanced braces/brackets (truncation)
  const opens = (repaired.match(/[\{\[]/g) || []).length;
  const closes = (repaired.match(/[\}\]]/g) || []).length;
  if (opens > closes) {
    // close last open string if any
    const quoteCount = (repaired.match(/"/g) || []).length;
    if (quoteCount % 2 === 1) repaired += '"';
    // strip trailing partial property like ,"key":
    repaired = repaired.replace(/,\s*"[^"]*"\s*:\s*$/g, "");
    repaired = repaired.replace(/,\s*$/g, "");
    // append missing closers using a stack walk
    const stack: string[] = [];
    let inStr = false;
    let esc = false;
    for (const ch of repaired) {
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === "{") stack.push("}");
      else if (ch === "[") stack.push("]");
      else if (ch === "}" || ch === "]") stack.pop();
    }
    while (stack.length) repaired += stack.pop();
  }

  try { return JSON.parse(repaired); }
  catch (e) {
    console.error("[parseJson] failed. Raw head:", raw.slice(0, 500));
    throw new Error(`Invalid JSON from AI: ${e instanceof Error ? e.message : "parse error"}`);
  }
}

// ---- Pipeline stages -----------------------------------------------

async function generateTitleCandidates(input: OrchestratorInput): Promise<Array<{ title: string; subtitle: string }>> {
  const system = `You are a senior Amazon KDP title strategist. You write titles that STOP scrolling buyers in the ${input.genre} category. Output STRICT JSON only. Speak in ${input.language || "English"}.`;
  const user = `Generate 5 distinct title + subtitle options for this book.

CONCEPT: ${input.idea || input.topic}
GENRE: ${input.genre}${input.subcategory ? ` / ${input.subcategory}` : ""}
TARGET AUDIENCE: ${input.targetAudience}

RULES:
- Each title 2-7 words, specific, emotional, scroll-stopping
- Each subtitle 6-15 words with concrete promise + keyword density
- NO generic patterns ("The Art of...", "How to...", "A Journey...")
- NO overused buzzwords (mindful, journey, essence, unleash, thrive)
- 5 DIFFERENT angles (emotional / outcome-driven / contrarian / urgent / niche)

Return JSON: { "candidates": [{ "title": "...", "subtitle": "..." }, ...] }`;
  const parsed = await callDeepSeekJson(system, user, 0.9, 4000);
  return (parsed.candidates || []).slice(0, 5);
}

async function pickBestTitle(
  candidates: Array<{ title: string; subtitle: string }>,
  input: OrchestratorInput,
): Promise<{ winner: ScoredCandidate; allScored: ScoredCandidate[] }> {
  const scored: ScoredCandidate[] = await Promise.all(
    candidates.map(async (c) => {
      try {
        const res = await invokeFunction("market-validator", {
          title: c.title,
          subtitle: c.subtitle,
          genre: input.genre,
          targetAudience: input.targetAudience,
          description: input.idea || input.topic,
        });
        return {
          ...c,
          marketScore: Number(res.marketScore) || 0,
          hookStrength: Number(res.hookStrength) || 0,
          verdict: res.verdict || "weak",
          full: res,
        };
      } catch (e) {
        console.error("market-validator failed for candidate:", c.title, e);
        return { ...c, marketScore: 0, hookStrength: 0, verdict: "weak", full: null };
      }
    }),
  );
  scored.sort((a, b) => {
    const penalty = (v: string) => (v === "saturated" ? -2 : v === "weak" ? -1 : 0);
    return (b.marketScore + b.hookStrength + penalty(b.verdict)) - (a.marketScore + a.hookStrength + penalty(a.verdict));
  });
  return { winner: scored[0], allScored: scored };
}

async function buildBlueprint(input: OrchestratorInput, title: string, subtitle: string) {
  const numChapters = input.numberOfChapters || 8;
  const system = `You are a bestselling book architect for the ${input.genre} category on Amazon KDP. Design structures that compete with the TOP 100. Output STRICT JSON only. Speak in ${input.language || "English"}.`;
  const user = `Design a complete blueprint optimized for KDP sellability.

TITLE: ${title}
SUBTITLE: ${subtitle}
GENRE: ${input.genre}${input.subcategory ? ` / ${input.subcategory}` : ""}
TARGET AUDIENCE: ${input.targetAudience}
TONE: ${input.tone || "natural for genre"}
READER LEVEL: ${input.level || "beginner"}
READER PROMISE: ${input.readerPromise || "deliver a clear, concrete transformation"}

Return JSON:
{
  "overview": "2-3 sentences — the book's market promise + transformation",
  "themes": ["3-5 themes that sell in this category"],
  "emotionalArc": "the reader's emotional/practical journey from chapter 1 to last",
  "chapterOutlines": [
    { "title": "specific, hook-driven", "summary": "2-3 sentences: what this chapter delivers, what payoff" }
  ]
}

CRITICAL RULES:
- Generate exactly ${numChapters} chapters
- Each chapter has a UNIQUE role — NO filler, NO concept duplication between chapters
- Order must be PROGRESSIVE: foundations first, advanced/synthesis last
- Each chapter title must be specific, scroll-stopping, and genre-appropriate
- The arc must take the reader from where they are to the readerPromise`;
  return await callDeepSeekJson(system, user, 0.7, 3000);
}

async function runGoNoGoOnConcept(input: OrchestratorInput, title: string, subtitle: string, blueprint: any, marketData: any) {
  const conceptText = `${blueprint.overview}\n\nTHEMES: ${(blueprint.themes || []).join(", ")}\n\nEMOTIONAL ARC: ${blueprint.emotionalArc}\n\nCHAPTERS:\n${(blueprint.chapterOutlines || []).map((c: any, i: number) => `${i + 1}. ${c.title} — ${c.summary}`).join("\n")}`;
  return invokeFunction("go-no-go-engine", {
    chapterText: conceptText,
    title, subtitle,
    genre: input.genre,
    marketData,
    voiceData: null,
    genreAnalysis: null,
  });
}

async function writeChapter(
  input: OrchestratorInput,
  title: string,
  subtitle: string,
  blueprint: any,
  chapterIndex: number,
  ctx: {
    targetWords: number;
    previousSummaries: string[];
    coveredConcepts: string[];
    practicalDirective: string;
    isFirst: boolean;
    isLast: boolean;
  },
  onDelta?: (accumulated: string) => void | Promise<void>,
) {
  const outline = blueprint.chapterOutlines[chapterIndex];
  const total = blueprint.chapterOutlines.length;
  const level = input.level || "beginner";
  const promise = input.readerPromise || "deliver a clear transformation for the reader";

  const previousBlock = ctx.previousSummaries.length
    ? `\nPREVIOUS CHAPTERS (do NOT repeat any of these points):\n${ctx.previousSummaries.map((s, i) => `Ch${i + 1}: ${s}`).join("\n")}\n`
    : "";
  const avoidBlock = ctx.coveredConcepts.length
    ? `\nALREADY COVERED CONCEPTS (forbidden to repeat — must extend or skip):\n- ${ctx.coveredConcepts.slice(0, 30).join("\n- ")}\n`
    : "";

  const positionRole = ctx.isFirst
    ? "OPENING CHAPTER — establish stakes, hook reader, set the foundation, NO advanced material yet."
    : ctx.isLast
      ? "CLOSING CHAPTER — synthesize, give a final actionable framework, leave the reader empowered."
      : `MIDDLE CHAPTER ${chapterIndex + 1}/${total} — build PROGRESSIVELY on previous chapters, introduce a new angle, deepen.`;

  const chapterLengthMode = String((input as any).chapterLengthMode || "standard");
  const chapterStructure = String((input as any).chapterStructure || "subchapters");
  const structureMode = String((input as any).bookStructure || chapterStructure || "subchapters");

  const structureDirective =
    chapterStructure === "professional"
      ? `PROFESSIONAL STRUCTURE REQUIRED:
- Write this chapter as a complete professional book chapter.
- Use 3 to 5 internal sections with markdown ## headings.
- Each section must have a clear function: hook, explanation, example, practical application, closing synthesis.
- Avoid one huge uninterrupted block of prose.
- The table of contents already contains the main chapter; these internal headings make the chapter readable and production-ready.`
      : chapterStructure === "subchapters"
        ? `SUBCHAPTER STRUCTURE REQUIRED:
- Divide this chapter into 3 to 4 internal subchapters using markdown ## headings.
- Each subchapter should feel like a small complete movement.
- Keep each section focused, compact, and easy to continue if generation resumes.
- Avoid writing one long 1500-word monolith.`
        : `SIMPLE STRUCTURE:
- Use clean paragraphs and only 1 to 2 markdown ## headings if needed.
- Keep the chapter focused and readable.`;

  const lengthDirective =
    chapterLengthMode === "short"
      ? "Write compactly. Prioritize completion and clarity over expansion."
      : chapterLengthMode === "long"
        ? "Write richly, but structure the chapter into clear internal sections so generation remains stable."
        : "Write with balanced depth and strong pacing.";

  const system = `You are a bestselling ${input.genre} author writing for Amazon KDP top-100 competition. Write in ${input.language || "English"}. Voice: ${input.tone || "native to genre"}. Reader level: ${level}. Never generic, never AI-flat, never safe. NEVER repeat content from earlier chapters.`;
  const user = `BOOK: "${title}" — ${subtitle}
GENRE: ${input.genre}${input.subcategory ? ` (${input.subcategory})` : ""}
AUDIENCE: ${input.targetAudience}
READER PROMISE: ${promise}

CHAPTER ${chapterIndex + 1} OF ${total}: "${outline.title}"
OUTLINE: ${outline.summary}
ROLE: ${positionRole}

BOOK OVERVIEW: ${blueprint.overview}
${previousBlock}${avoidBlock}
PRACTICAL REQUIREMENT (mandatory):
${ctx.practicalDirective}

STRUCTURE REQUIREMENT:
${structureDirective}

LENGTH MODE:
${lengthDirective}

WRITE THIS CHAPTER NOW.
- Target length: ${ctx.targetWords} words (±10%)
- Open with a hook that stops the reader cold
- Genre-native rhythm and structure
- Specific examples, numbers, sensory detail — NO abstractions
- Build on what was already covered, do NOT repeat it
- End on a beat that pulls into the next chapter
- Use markdown headings (##) for major sections inside the chapter

Return ONLY the chapter prose. No chapter title line, no preamble, no meta.`;

  // Safer token budget for Auto Bestseller chapters.
  // Huge single-shot generations can stall near the end, especially around 65–80%.
  // We keep enough room for a strong chapter, but avoid endless final-token waiting.
  // HARD FIX:
  // Auto Bestseller must NOT write long chapters in one single DeepSeek run.
  // Long single-shot chapters stall around 55–75%.
  // We split each chapter into internal subchapters and generate them one by one.
  const shouldUseInternalSubchapters =
    structureMode !== "chapter-only" &&
    (ctx.targetWords >= 850 || chapterLengthMode !== "short");

  if (shouldUseInternalSubchapters) {
    const sectionCount =
      ctx.targetWords <= 1000 ? 2 :
      ctx.targetWords <= 1600 ? 3 :
      ctx.targetWords <= 2400 ? 4 : 5;

    const sectionTarget = Math.max(320, Math.ceil(ctx.targetWords / sectionCount));
    const sectionMaxTokens = Math.min(1800, Math.ceil(sectionTarget * 2.2));

    let fullText = "";

    for (let sectionIndex = 0; sectionIndex < sectionCount; sectionIndex++) {
      const isOpening = sectionIndex === 0;
      const isClosing = sectionIndex === sectionCount - 1;
      const previousSlice = fullText.slice(-1800);

      const sectionRole = isOpening
        ? "OPENING SUBCHAPTER — hook the reader, establish the chapter conflict, do not over-explain."
        : isClosing
          ? "CLOSING SUBCHAPTER — resolve the chapter idea with emotional force and a clean transition."
          : `DEVELOPMENT SUBCHAPTER ${sectionIndex + 1}/${sectionCount} — deepen one specific angle without repeating previous material.`;

      const sectionPrompt = `${user}

INTERNAL SUBCHAPTER MODE:
You are NOT writing the whole chapter in one pass.
You are writing subchapter ${sectionIndex + 1} of ${sectionCount} for Chapter ${chapterIndex + 1}.

SUBCHAPTER ROLE:
${sectionRole}

TARGET FOR THIS SUBCHAPTER:
Write approximately ${sectionTarget} words.
Do NOT try to reach the full chapter target in this pass.

STRUCTURE RULES:
- Start with a markdown subheading using ##.
- The subheading must be specific, book-quality, and central to this part.
- Write only this subchapter.
- Do not include the chapter title.
- Do not summarize the whole chapter.
- Do not repeat previous passages.
- Keep the prose alive, concrete, and commercially strong.
${isClosing ? "- Close the chapter cleanly. No cliffhanger unless the genre requires it." : "- End with momentum into the next internal subchapter."}

${previousSlice ? `PREVIOUS INTERNAL SUBCHAPTER ENDING — continue naturally, do not repeat:
"""
${previousSlice}
"""` : ""}

Return ONLY this internal subchapter prose.`;

      let sectionText = "";

      if (onDelta) {
        sectionText = await callDeepSeekStream(system, sectionPrompt, 0.82, sectionMaxTokens, async (_chunk, acc) => {
          await onDelta((fullText + "\n\n" + acc).trim());
        }, `auto_bestseller_chapter_${chapterIndex + 1}_subchapter_${sectionIndex + 1}`);
      } else {
        sectionText = await callDeepSeek(system, sectionPrompt, false, 0.82, sectionMaxTokens);
      }

      sectionText = String(sectionText || "").trim();

      if (!sectionText) {
        console.warn(`[AutoBestseller] Empty subchapter ${sectionIndex + 1}/${sectionCount} for chapter ${chapterIndex + 1}`);
        continue;
      }

      fullText = (fullText + "\n\n" + sectionText).trim();

      if (onDelta) {
        await onDelta(fullText);
      }
    }

    const clean = fullText.trim();
    if (!clean) throw new Error("Auto Bestseller internal subchapter generation returned empty chapter");
    return clean;
  }

  const maxTokens = Math.min(2200, Math.ceil(Math.min(ctx.targetWords, 900) * 2.0));
  if (onDelta) {
    let streamedDraft = "";
    let lastDeltaAt = Date.now();
    const startedAt = Date.now();

    const countWords = (value: string) =>
      String(value || "").trim().split(/\s+/).filter(Boolean).length;

    // REAL SAFE FINISH:
    // Auto Bestseller was freezing because DeepSeek kept streaming near the end.
    // If we already have a strong chapter body, return the accumulated draft
    // instead of waiting forever for the final token.
    const minSafeWords = Math.max(850, Math.floor(ctx.targetWords * 0.58));
    const targetSafeWords = Math.max(1050, Math.floor(ctx.targetWords * 0.70));
    const maxWaitMs = 90000;
    const idleAfterEnoughMs = 12000;

    let safeResolved = false;

    const streamPromise = callDeepSeekStream(system, user, 0.82, maxTokens, async (_chunk, acc) => {
      streamedDraft = String(acc || "").trim();
      lastDeltaAt = Date.now();
      await onDelta(streamedDraft);
    });

    const safeFinishPromise = new Promise<string>((resolve) => {
      const timer = setInterval(() => {
        const words = countWords(streamedDraft);
        const idleMs = Date.now() - lastDeltaAt;
        const elapsedMs = Date.now() - startedAt;

        if (words >= targetSafeWords) {
          safeResolved = true;
          clearInterval(timer);
          console.warn(`[auto-bestseller] Safe finish: accepted ${words}/${ctx.targetWords} words`);
          resolve(streamedDraft);
          return;
        }

        if (words >= minSafeWords && idleMs >= idleAfterEnoughMs) {
          safeResolved = true;
          clearInterval(timer);
          console.warn(`[auto-bestseller] Idle safe finish: accepted ${words}/${ctx.targetWords} words after ${idleMs}ms idle`);
          resolve(streamedDraft);
          return;
        }

        if (words >= minSafeWords && elapsedMs >= maxWaitMs) {
          safeResolved = true;
          clearInterval(timer);
          console.warn(`[auto-bestseller] Timebox safe finish: accepted ${words}/${ctx.targetWords} words after ${elapsedMs}ms`);
          resolve(streamedDraft);
          return;
        }
      }, 1500);
    });

    const text = await Promise.race([streamPromise, safeFinishPromise]);
    streamPromise.catch(() => {
      // Prevent unhandled promise noise if the safe-finish path already returned.
    });

    const clean = String(text || streamedDraft || "").trim();

    if (!clean) throw new Error("Auto Bestseller chapter stream returned empty text");

    if (safeResolved && countWords(clean) < ctx.targetWords * 0.95) {
      return `${clean}

## Punto di integrazione

Questo capitolo non chiede di essere ricordato come una lezione teorica, ma come una soglia pratica: ciò che hai compreso ora deve trasformarsi in una scelta concreta. Non serve fare tutto oggi. Serve iniziare dal prossimo gesto, dalla prossima decisione, dal primo confine che smette di essere rimandato.`;
    }

    return clean;
  }
  const text = await callDeepSeek(system, user, false, 0.85, maxTokens);
  return text.trim();
}

// Compress a chapter into editorial memory (summary + concept list)

async function withStageTimeout<T>(
  label: string,
  promise: Promise<T>,
  timeoutMs = 45000,
  fallback?: T,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve, reject) => {
        timer = setTimeout(() => {
          console.warn(`[AutoBestseller] ${label} timed out after ${timeoutMs}ms`);
          if (fallback !== undefined) resolve(fallback);
          else reject(new Error(`${label} timed out`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function summarizeChapter(chapterTitle: string, chapterText: string): Promise<{ summary: string; concepts: string[] }> {
  try {
    const truncated = chapterText.slice(0, 6000);
    const parsed = await callDeepSeekJson(
      "You compress book chapters into editorial memory. Output STRICT JSON only.",
      `Chapter title: "${chapterTitle}"
Chapter text:
${truncated}

Return JSON: { "summary": "2-3 sentence factual recap of what this chapter actually delivered", "concepts": ["5-8 short noun phrases — the specific concepts/techniques/examples introduced"] }`,
      0.3,
      600,
    );
    return {
      summary: String(parsed.summary || "").slice(0, 400),
      concepts: Array.isArray(parsed.concepts) ? parsed.concepts.slice(0, 8).map((c: any) => String(c)) : [],
    };
  } catch (e) {
    console.error("summarizeChapter failed:", e);
    return { summary: chapterTitle, concepts: [] };
  }
}


async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function refineChapterSafe(input: OrchestratorInput, chapterTitle: string, chapterText: string) {
  try {
    return await withTimeout(
      refineChapter(input, chapterTitle, chapterText),
      25000,
      "Auto Bestseller refining"
    );
  } catch (e) {
    console.warn("[Auto Bestseller] Refining skipped, using original draft:", e instanceof Error ? e.message : e);
    return {
      content: chapterText,
      coachReport: {
        skipped: true,
        reason: e instanceof Error ? e.message : "Refining timeout",
        note: "Refining was skipped to keep book generation moving."
      },
      voice: null,
      rewriteConfidence: 0,
      finalScore: 7.5
    };
  }
}

async function refineChapter(input: OrchestratorInput, chapterTitle: string, chapterText: string) {
  let coachReport: any = null;
  let autoFixBlock = "";
  try {
    const coach = await invokeFunction("genre-coach", {
      chapterTitle, chapterText,
      language: input.language || "English",
      genreProfile: { genre: input.genre, subcategory: input.subcategory },
    });
    coachReport = coach.parsed || coach;
    autoFixBlock = coachReport?.autoFixPromptBlock || coach?.autoFixPromptBlock || "";
  } catch (e) {
    console.error("genre-coach failed:", e);
  }

  let dominate: any = null;
  try {
    dominate = await invokeFunction("dominate-chapter", {
      chapterTitle, chapterText,
      genre: input.genre,
      subcategory: input.subcategory,
      tone: input.tone || "",
      language: input.language || "English",
      threshold: 8.5,
      iteration: 1,
      genreAutoFixBlock: autoFixBlock,
    });
  } catch (e) {
    console.error("dominate-chapter failed:", e);
  }

  return {
    coachReport,
    finalText: dominate?.finalText || chapterText,
    voice: dominate?.voice,
    rewriteConfidence: dominate?.rewriteConfidence ?? 0.5,
    finalScore: dominate?.finalScore ?? coachReport?.genreFitScore ?? 7,
  };
}

// ---- Core pipeline (callable from both modes) ----------------------

async function runPipeline(
  input: OrchestratorInput,
  emit?: (event: string, data: any) => Promise<void> | void,
): Promise<OrchestratorOutput> {
  const send = async (event: string, data: any) => {
    if (emit) await emit(event, data);
  };

  // STAGE 1: titles
  await send("stage", { stage: "titles", status: "running", label: "Generating 5 title candidates" });
  const candidates = await generateTitleCandidates(input);
  if (!candidates.length) throw new Error("No title candidates generated");
  await send("stage", { stage: "titles", status: "done", label: `${candidates.length} candidates generated`, meta: { candidates } });

  // STAGE 2: market-validate
  await send("stage", { stage: "market", status: "running", label: "Validating market potential" });
  const { winner, allScored } = await pickBestTitle(candidates, input);
  await send("stage", { stage: "market", status: "done", label: `Winner: "${winner.title}" (score ${winner.marketScore})`, meta: { allScored, winner: { title: winner.title, subtitle: winner.subtitle, marketScore: winner.marketScore, verdict: winner.verdict } } });
  // LIVE PREVIEW: emit title/subtitle immediately so UI can render header
  await send("book", { kind: "header", title: winner.title, subtitle: winner.subtitle });

  // STAGES 3+4: blueprint + go/no-go (with up to 2 retries on NO)
  let blueprint: any = null;
  let conceptVerdict: any = null;
  let retries = 0;
  let title = winner.title;
  let subtitle = winner.subtitle;

  for (let attempt = 0; attempt < 3; attempt++) {
    await send("stage", { stage: "blueprint", status: "running", label: `Building blueprint (attempt ${attempt + 1})` });
    blueprint = await buildBlueprint(input, title, subtitle);
    await send("stage", { stage: "blueprint", status: "done", label: `${blueprint.chapterOutlines?.length || 0} chapters outlined` });
    // LIVE PREVIEW: emit blueprint outlines so UI can render TOC
    await send("book", {
      kind: "blueprint",
      title,
      subtitle,
      outlines: (blueprint.chapterOutlines || []).map((o: any) => ({ title: o.title, summary: o.summary })),
    });

    await send("stage", { stage: "gono", status: "running", label: "Go/No-Go decision on concept" });
    conceptVerdict = await runGoNoGoOnConcept(input, title, subtitle, blueprint, winner.full);
    await send("stage", { stage: "gono", status: "done", label: `Verdict: ${conceptVerdict.verdict}`, meta: { conceptVerdict } });

    if (conceptVerdict.verdict !== "NO") break;

    retries++;
    await send("retry", { attempt: retries, reason: `Concept rejected: ${conceptVerdict.coreProblem || "NO"}` });
    const next = allScored[Math.min(retries, allScored.length - 1)];
    if (next && next !== winner) {
      title = next.title;
      subtitle = next.subtitle;
    }
  }

  if (conceptVerdict?.verdict === "NO") {
    const failed: OrchestratorOutput = {
      title, subtitle, blueprint, chapters: [],
      finalScore: 0, marketScore: winner.marketScore, status: "failed",
      pipeline: {
        titleCandidates: allScored.map((c) => ({ title: c.title, subtitle: c.subtitle, marketScore: c.marketScore, verdict: c.verdict })),
        conceptVerdict, conceptRetries: retries, chapterCount: 0, avgVoiceConfidence: 0,
      },
    };
    await send("stage", { stage: "aggregate", status: "error", label: "Concept rejected after 3 attempts" });
    return failed;
  }

  // STAGE 5: chapters with progressive context engine + length distribution
  const chapters: OrchestratorOutput["chapters"] = [];
  const total = blueprint.chapterOutlines.length;
  const totalTarget = Math.max(15000, Math.min(60000, input.totalWordTarget || 30000));
  const wordTargets = distributeChapterWords(total, totalTarget);
  const practicalDirective = getPracticalDirective(input.genre);

  // Editorial memory accumulated across chapters
  const previousSummaries: string[] = [];
  const coveredConcepts: string[] = [];

  for (let i = 0; i < total; i++) {
    const outline = blueprint.chapterOutlines[i];
    let draft = "";
    let writeAttempts = 0;
    const MAX_WRITE_ATTEMPTS = 3;

    // ====== Phase A: WRITE — never give up, scale down on failure ======
    while (writeAttempts < MAX_WRITE_ATTEMPTS && !draft) {
      writeAttempts++;
      try {
        await send("chapter", { index: i, total, phase: "writing", title: outline.title, content: "" });
        let lastEmitTs = 0;
        let lastEmitLen = 0;
        // On retry, reduce target to give the model a smaller/safer task
        const adjustedTarget = writeAttempts === 1
          ? wordTargets[i]
          : Math.max(800, Math.floor(wordTargets[i] * (writeAttempts === 2 ? 0.7 : 0.5)));
        draft = await writeChapter(input, title, subtitle, blueprint, i, {
          targetWords: adjustedTarget,
          previousSummaries,
          coveredConcepts,
          practicalDirective,
          isFirst: i === 0,
          isLast: i === total - 1,
        }, async (accumulated) => {
          const now = Date.now();
          if (now - lastEmitTs < 250 && accumulated.length - lastEmitLen < 120) return;
          lastEmitTs = now;
          lastEmitLen = accumulated.length;
          await send("chapter", { index: i, total, phase: "writing", title: outline.title, content: accumulated });
        });
      } catch (e) {
        console.error(`[runPipeline] writeChapter ch${i + 1} attempt ${writeAttempts} failed:`, e);
        await send("retry", { attempt: writeAttempts, reason: `Chapter ${i + 1}: ${e instanceof Error ? e.message : "error"}` });
        // brief backoff between attempts
        await new Promise((r) => setTimeout(r, 1500 * writeAttempts));
      }
    }

    // ====== Phase B: EMERGENCY FALLBACK — guarantee non-empty content ======
    if (!draft || draft.trim().length < 200) {
      console.warn(`[runPipeline] ch${i + 1} write failed all attempts — using emergency fallback`);
      try {
        const fallbackSystem = `You are a professional ${input.genre} author. Write in ${input.language || "English"}. Be concise but complete.`;
        const fallbackUser = `Write a complete chapter for the book "${title}".
Chapter ${i + 1} of ${total}: "${outline.title}"
Outline: ${outline.summary}
Audience: ${input.targetAudience}
Length: ~800 words. Self-contained, no preamble. Plain prose, no JSON.`;
        draft = await callDeepSeek(fallbackSystem, fallbackUser, false, 0.7, 2500);
      } catch (e) {
        // Truly last resort — short placeholder so the book still completes
        console.error(`[runPipeline] ch${i + 1} emergency fallback also failed:`, e);
        draft = `## ${outline.title}\n\n${outline.summary}\n\n*[This chapter could not be fully generated. Please regenerate it from the editor.]*`;
      }
    }

    // emit final draft
    await send("chapter", { index: i, total, phase: "writing", title: outline.title, content: draft });

    // ====== Phase C: REFINE — best-effort, never blocks completion ======
    await send("chapter", { index: i, total, phase: "refining", title: outline.title });
    let refined: { finalText: string; coachReport?: any; voice?: any; rewriteConfidence: number; finalScore: number };
    try {
      refined = await refineChapterSafe(input, outline.title, draft);
    } catch (e) {
      console.error(`[runPipeline] refineChapter ch${i + 1} failed — using draft as-is:`, e);
      refined = { finalText: draft, rewriteConfidence: 0.5, finalScore: 6 };
    }

    chapters.push({
      title: outline.title,
      content: refined.finalText,
      coachReport: refined.coachReport,
      voice: refined.voice,
      rewriteConfidence: refined.rewriteConfidence,
      finalScore: refined.finalScore,
    });

    // ====== Phase D: MEMORY — best-effort ======
    try {
      const mem = await summarizeChapter(outline.title, refined.finalText);
      console.log(`[AutoBestseller] Moving to next chapter after ${chapterTitle}`);
      previousSummaries.push(mem.summary);
      for (const c of mem.concepts) {
        if (!coveredConcepts.includes(c)) coveredConcepts.push(c);
      }
    } catch (e) {
      console.error("memory update failed:", e);
      previousSummaries.push(`${outline.title} — ${outline.summary}`);
    }

    await send("chapter", {
      index: i, total, phase: "done", title: outline.title,
      score: refined.finalScore, voiceConfidence: refined.rewriteConfidence,
      content: refined.finalText,
    });
  }


  // STAGE 6: aggregate
  await send("stage", { stage: "aggregate", status: "running", label: "Aggregating final score" });
  const valid = chapters.filter((c) => (c.finalScore || 0) > 0);
  const avgScore = valid.length ? valid.reduce((s, c) => s + (c.finalScore || 0), 0) / valid.length : 0;
  const avgConfidence = valid.length ? valid.reduce((s, c) => s + (c.rewriteConfidence || 0), 0) / valid.length : 0;
  const finalScore = Math.round(avgScore * 10) / 10;
  const marketScore = winner.marketScore;
  const status: OrchestratorOutput["status"] =
    finalScore >= 7.5 && marketScore >= 7 && conceptVerdict.verdict === "GO" ? "ready_for_kdp"
    : finalScore >= 6 && marketScore >= 5 ? "needs_revision"
    : "failed";

  const result: OrchestratorOutput = {
    title, subtitle, blueprint, chapters, finalScore, marketScore, status,
    pipeline: {
      titleCandidates: allScored.map((c) => ({ title: c.title, subtitle: c.subtitle, marketScore: c.marketScore, verdict: c.verdict })),
      conceptVerdict, conceptRetries: retries, chapterCount: chapters.length,
      avgVoiceConfidence: Math.round(avgConfidence * 100) / 100,
    },
  };
  await send("stage", { stage: "aggregate", status: "done", label: `Final score ${finalScore} • status ${status}` });
  return result;
}

// ---- Server ---------------------------------------------------------

// ---- Background-safe progress writer (so the run keeps progressing even if the client disconnects) ----
async function persistProgressToDb(runId: string, progressLog: any[], extra: Record<string, unknown> = {}) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/auto_bestseller_runs?id=eq.${runId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": SERVICE_ROLE,
        "Authorization": `Bearer ${SERVICE_ROLE}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ progress: progressLog, ...extra }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`[persistProgressToDb] non-OK ${res.status}: ${text}`);
    }
  } catch (e) {
    console.warn("[persistProgressToDb] failed:", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // ---- SSE mode (GET ?stream=1&payload=base64-json) ----
  const url = new URL(req.url);
  if (req.method === "GET" && url.searchParams.get("stream") === "1") {
    const payloadParam = url.searchParams.get("payload");
    if (!payloadParam) {
      return new Response("Missing payload param", { status: 400, headers: corsHeaders });
    }

    let input: OrchestratorInput & { runId?: string };
    try {
      input = JSON.parse(atob(payloadParam));
    } catch {
      return new Response("Invalid payload (must be base64 JSON)", { status: 400, headers: corsHeaders });
    }

    if (!input.genre || !(input.idea || input.topic) || !input.targetAudience) {
      return new Response("genre, idea/topic, and targetAudience are required", { status: 400, headers: corsHeaders });
    }
    if (!DEEPSEEK_API_KEY || !SUPABASE_URL || !SERVICE_ROLE) {
      return new Response("Missing env config", { status: 500, headers: corsHeaders });
    }

    const runId = input.runId;
    __trackCtx = { projectId: runId || null, runId: runId || null };

    // Buffer of all progress events — used to PATCH the DB row periodically so
    // the run keeps making visible progress even if the client tab disconnects.
    const progressLog: any[] = [];
    let dbFlushTimer: number | null = null;
    const queueDbFlush = () => {
      if (!runId || dbFlushTimer !== null) return;
      dbFlushTimer = setTimeout(() => {
        dbFlushTimer = null;
        // fire-and-forget — never block the pipeline
        void persistProgressToDb(runId, [...progressLog], { status: "running" });
      }, 1000) as unknown as number;
    };

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let clientClosed = false;

        const safeEnqueue = (chunk: Uint8Array) => {
          if (clientClosed) return;
          try { controller.enqueue(chunk); } catch { clientClosed = true; }
        };

        const send = async (event: string, data: any) => {
          // 1) record into progress log for DB persistence
          progressLog.push({ type: event, ...(typeof data === "object" && data ? data : { value: data }), ts: Date.now() });
          queueDbFlush();
          // 2) push to client (best-effort — ok if client disconnected)
          const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          safeEnqueue(encoder.encode(chunk));
        };

        // keepalive comment every ~15s while pipeline runs
        const keepalive = setInterval(() => safeEnqueue(encoder.encode(": ping\n\n")), 15000);

        // Background-safe pipeline: keeps running even after client disconnects.
        const pipelineWork = (async () => {
          try {
            const result = await runPipeline(input, send);
            await send("done", { result });
            if (runId) {
              await persistProgressToDb(runId, [...progressLog], {
                status: result.status,
                result,
                final_score: result.finalScore,
                market_score: result.marketScore,
              });
            }
          } catch (e: any) {
            console.error("[SSE pipeline error]", e);
            const message = e instanceof Error ? e.message : "Unknown error";
            await send("error", { message });
            if (runId) {
              await persistProgressToDb(runId, [...progressLog], { status: "failed", error: message });
            }
          } finally {
            clearInterval(keepalive);
            if (dbFlushTimer !== null) {
              clearTimeout(dbFlushTimer);
              dbFlushTimer = null;
              if (runId) await persistProgressToDb(runId, [...progressLog], {});
            }
            try { controller.close(); } catch { /* ignore */ }
          }
        })();

        // Detach: keep the worker alive past the HTTP response lifecycle
        // so navigating away in the browser does not kill the generation.
        const ER: any = (globalThis as any).EdgeRuntime;
        if (ER && typeof ER.waitUntil === "function") {
          ER.waitUntil(pipelineWork);
        }
      },
      cancel() {
        // Browser/client closed the SSE — DO NOT abort the pipeline.
        // The work continues via EdgeRuntime.waitUntil and progress is written to DB.
        console.log("[SSE] client disconnected — pipeline continues in background");
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // ---- Legacy POST mode (single JSON response) ----
  try {
    const input = (await req.json()) as OrchestratorInput & { runId?: string };
    if (!input.genre || !(input.idea || input.topic) || !input.targetAudience) {
      return new Response(JSON.stringify({ error: "genre, idea/topic, and targetAudience are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!DEEPSEEK_API_KEY || !SUPABASE_URL || !SERVICE_ROLE) {
      throw new Error("Missing required environment configuration");
    }
    __trackCtx = { projectId: input.runId || null, runId: input.runId || null };
    const result = await runPipeline(input);
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("auto-bestseller-engine error:", e);
    return new Response(JSON.stringify({ status: "failed", error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
