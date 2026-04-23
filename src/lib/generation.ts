import { BookConfig, Chapter, FrontMatter, BackMatter, BookBlueprint, Genre, AIQualityRating, BOOK_LENGTH_CONFIG, getBookTotalWords, GenreLock } from "@/types/book";
import { safeGenerateAI } from "@/lib/ai/safeGenerateAI";
import { supabase } from "@/integrations/supabase/client";
import { buildGenreSystemBlock, buildGenreBlueprintBlock, buildGenreEditorialBlock, getGenreBlueprint, buildPromptByGenre, resolveGenreKey } from "@/lib/genre-intelligence";
import { buildWritingStyleBlock, findStylePresetById, findStylePresetByLabel } from "@/lib/writing-styles";
import { buildEditorialMasteryBlock } from "@/lib/editorial-mastery";
import { validateEditorial } from "@/lib/editorial-validator";
import { withRetry, getBreakerCooldown } from "@/lib/api-resilience";

/**
 * Verbose streaming logs are off by default — they intasavano la console
 * during chunked generation (12+ logs per chunk × ~5 chunks × 12 chapters
 * = ~700 entries per book). Enable in DevTools with:
 *   window.__NEXORA_DEBUG_STREAM__ = true
 * or set localStorage key 'nexora-debug-stream' = '1'.
 * Critical events (start, completion, errors, warnings) always log.
 */
const DEV_DEBUG_STREAM: boolean = (() => {
  try {
    if (typeof window === "undefined") return false;
    if ((window as any).__NEXORA_DEBUG_STREAM__ === true) return true;
    return localStorage.getItem("nexora-debug-stream") === "1";
  } catch { return false; }
})();

/* ============ Genre Lock helper ============ */
/**
 * Build a GenreLock from a config. Called once at project creation
 * so the entire book stays editorially consistent.
 */
export function buildGenreLock(config: BookConfig): GenreLock {
  const bp = getGenreBlueprint(config.genre, (config as any).subcategory);
  return {
    genre: config.genre,
    subcategory: (config as any).subcategory,
    structure: bp.structure,
    rules: bp.contentRules,
    chapterStyle: bp.chapterStyle,
    tone: bp.tone,
    frontMatterTemplate: bp.frontMatterTemplate,
    backMatterTemplate: bp.backMatterTemplate,
    hasSubchapters: bp.hasSubchapters,
    lockedAt: new Date().toISOString(),
  };
}

/** Resolve effective blueprint: prefer locked one, else compute fresh. */
function resolveLockedBlueprint(config: BookConfig, lock?: GenreLock) {
  if (lock) {
    return {
      structure: lock.structure,
      tone: lock.tone,
      chapterStyle: lock.chapterStyle as any,
      hasSubchapters: lock.hasSubchapters,
      frontMatterTemplate: lock.frontMatterTemplate,
      backMatterTemplate: lock.backMatterTemplate,
      contentRules: lock.rules,
    };
  }
  return getGenreBlueprint(config.genre, (config as any).subcategory);
}

class AICreditsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AICreditsError";
  }
}

async function callAIOnce(systemPrompt: string, userPrompt: string, timeoutMs: number = 300000): Promise<string> {
  const controller = new AbortController();

  // Two-layer protection:
  // 1) idle watchdog: aborts when no bytes arrive.
  // 2) hard deadline: aborts even if keepalive whitespace keeps arriving forever.
  // This prevents chapters from getting stuck forever near the final chunk.
  let lastByteAt = Date.now();
  const hardDeadlineMs = Math.max(120000, Math.min(timeoutMs + 60000, 300000));

  const hardDeadline = setTimeout(() => {
    console.warn(`[Nexora] Hard AI deadline reached after ${hardDeadlineMs}ms — aborting`);
    controller.abort();
  }, hardDeadlineMs);

  const watchdog = setInterval(() => {
    if (Date.now() - lastByteAt > timeoutMs) {
      console.warn(`[Nexora] No bytes received for ${timeoutMs}ms — aborting`);
      controller.abort();
    }
  }, 5000);

  if (DEV_DEBUG_STREAM) console.log("[Nexora] AI request started (streaming)");
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-book`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ systemPrompt, userPrompt }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let errMsg = text;
      try { errMsg = JSON.parse(text).error || text; } catch {}
      if (errMsg.includes("credits exhausted") || errMsg.includes("API key invalid") || res.status === 402) {
        throw new AICreditsError(errMsg);
      }
      throw new Error(errMsg || `AI generation failed (${res.status})`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      lastByteAt = Date.now(); // reset watchdog on each byte
      buffer += decoder.decode(value, { stream: true });
    }
    clearInterval(watchdog);
    clearTimeout(hardDeadline);

    const marker = buffer.lastIndexOf("__RESULT__");
    if (marker === -1) {
      console.warn("[Nexora] No result marker found");
      throw new Error("Empty response from AI");
    }
    const jsonStr = buffer.slice(marker + "__RESULT__".length).trim();
    const parsed = JSON.parse(jsonStr);
    if (parsed.error) {
      if (parsed.error.includes("credits exhausted")) throw new AICreditsError(parsed.error);
      throw new Error(parsed.error);
    }
    if (!parsed.content) throw new Error("Empty response from AI");
    if (DEV_DEBUG_STREAM) console.log("[Nexora] AI response received:", parsed.content.length, "chars");
    return parsed.content;
  } catch (e: any) {
    clearInterval(watchdog);
    clearTimeout(hardDeadline);
    clearInterval(watchdog);
    if (e.name === "AbortError") throw new Error("Generation timed out (no response)");
    throw e;
  }
}

/**
 * Resilient AI call with circuit breaker + exponential backoff.
 * Retries up to 3 times; never blocks the caller forever.
 */
async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const cooldown = getBreakerCooldown("deepseek");
  if (cooldown > 0) {
    throw new Error(`AI temporarily unavailable. Retry in ${Math.ceil(cooldown / 1000)}s.`);
  }
  return withRetry(
    () => callAIOnce(systemPrompt, userPrompt, 180000),
    {
      maxAttempts: 3,
      baseDelayMs: 2000,
      maxDelayMs: 12000,
      serviceKey: "deepseek",
      shouldRetry: (err) => !(err instanceof AICreditsError),
    },
  );
}

// Reduced chunk size fallback for resilience
async function callAIReduced(systemPrompt: string, userPrompt: string): Promise<string> {
  return callAIOnce(systemPrompt, userPrompt, 180000);
}

/**
 * FAST blueprint call — uses Lovable AI (Gemini Flash, non-streaming JSON).
 * 60s hard timeout; far faster than DeepSeek streaming for short structured output.
 */
async function callBlueprintFast(systemPrompt: string, userPrompt: string): Promise<string> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-blueprint-fast`;
  const callOnce = async (): Promise<string> => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ systemPrompt, userPrompt }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let errMsg = text;
      try { errMsg = JSON.parse(text).error || text; } catch {}
      if (res.status === 402) throw new AICreditsError(errMsg || "AI credits exhausted");
      throw new Error(errMsg || `Blueprint generation failed (${res.status})`);
    }
    const { content, error } = await res.json();
    if (error) {
      if (String(error).includes("credits")) throw new AICreditsError(error);
      throw new Error(error);
    }
    if (!content) throw new Error("Empty blueprint response");
    return content as string;
  };
  return withRetry(callOnce, {
    maxAttempts: 2,
    baseDelayMs: 1500,
    maxDelayMs: 4000,
    serviceKey: "lovable-ai",
    shouldRetry: (err) => !(err instanceof AICreditsError),
  });
}

/* ============ Context Memory Engine ============ */

function extractKeyIdeas(content: string): string[] {
  // Extract sentences that look like key insights (contain strong verbs, declarations)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 40 && s.trim().length < 200);
  // Take the first and last meaningful sentences as bookends
  const first = sentences.slice(0, 2).map(s => s.trim());
  const last = sentences.slice(-2).map(s => s.trim());
  return [...new Set([...first, ...last])].slice(0, 4);
}

function buildContextMemory(config: BookConfig, blueprint: BookBlueprint, previousChapters: Chapter[], chapterIndex: number): string {
  if (previousChapters.length === 0) return "This is the FIRST chapter — establish the tone, introduce the core premise, and hook the reader immediately.";

  const summaries = previousChapters.map((c, i) => {
    const wordCount = c.content.split(/\s+/).length;
    const keyIdeas = extractKeyIdeas(c.content);
    const subTitles = c.subchapters.map(s => s.title).join(", ");
    return `Ch ${i + 1} "${c.title}" (${wordCount} words):
  Opening: ${c.content.substring(0, 150)}...
  Key ideas: ${keyIdeas.join(" | ")}
  Ending: ...${c.content.substring(Math.max(0, c.content.length - 150))}${subTitles ? `\n  Subchapters: ${subTitles}` : ""}`;
  }).join("\n\n");

  const arcPosition = chapterIndex / config.numberOfChapters;
  const arcPhase = arcPosition < 0.25 ? "OPENING — establishing foundations"
    : arcPosition < 0.5 ? "RISING — deepening and developing"
    : arcPosition < 0.75 ? "CLIMAX — peak tension and transformation"
    : "RESOLUTION — integration and closure";

  // Track emotional progression across chapters
  const emotionalTrack = previousChapters.length >= 2
    ? `Emotional trajectory: The book has moved from "${previousChapters[0].title}" through "${previousChapters[previousChapters.length - 1].title}". Continue escalating.`
    : "";

  return `NARRATIVE MEMORY (you MUST maintain perfect continuity):

PREVIOUS CHAPTERS:
${summaries}

${emotionalTrack}

BOOK ARCHITECTURE:
- Emotional arc: ${blueprint.emotionalArc}
- Arc position: Chapter ${chapterIndex + 1} of ${config.numberOfChapters} — ${arcPhase}
- Core themes: ${blueprint.themes.join(", ")}

CONTINUITY RULES (MANDATORY):
- Reference and BUILD UPON ideas from previous chapters — create callbacks
- NEVER repeat examples, metaphors, anecdotes, or structural patterns
- Progress the emotional arc naturally — escalate, deepen, transform
- Each chapter must feel like the NEXT step in a journey, not a standalone piece
- The reader must sense ONE author mind behind the entire book
- Include 2-4 sentences per chapter that are highlight-worthy — emotionally powerful, quotable, shareable
- These "highlight sentences" must feel natural, not forced — embed them within the flow`;
}

/* ============ Style Lock ============ */

function getStyleLock(config: BookConfig): string {
  // Risolvi un eventuale preset (per id o per label legacy) per esporre il nome leggibile
  const preset = findStylePresetById(config.authorStyle) ?? findStylePresetByLabel(config.authorStyle);
  const styleLabel = preset?.label ?? config.authorStyle;
  const styleBlock = buildWritingStyleBlock(config.authorStyle);

  return `STYLE LOCK — MAINTAIN CONSISTENTLY:
- Tone: "${config.tone}" — NEVER deviate from this voice
- Author/Style DNA: "${styleLabel}" — channel this voice's rhythm, vocabulary, and sensibility
- Genre conventions: ${config.genre} — honor genre expectations while transcending them
- Language: ${config.language} — EVERY word in ${config.language}, no exceptions

${styleBlock}

If previous chapters established a specific vocabulary, rhythm, or narrative device, CONTINUE using it. Style drift = failure.`;
}

/* ============ Word Budget System ============ */

function getChapterTargetWords(config: BookConfig, chapterIndex: number, totalChapters: number, chapterLengthOverride?: string): number {
  const bookTotal = getBookTotalWords(config);
  const chapterBase = Math.round(bookTotal / totalChapters);
  const localLength = chapterLengthOverride || config.chapterLength;
  const multiplier = localLength === "short" ? 0.6 : localLength === "long" ? 1.5 : 1.0;
  return Math.round(chapterBase * multiplier);
}

function getChapterLengthInstruction(config: BookConfig, chapterIndex: number, totalChapters: number, chapterLengthOverride?: string): string {
  const target = getChapterTargetWords(config, chapterIndex, totalChapters, chapterLengthOverride);
  const min = Math.round(target * 0.8);
  const max = Math.round(target * 1.2);

  const langNote = config.language !== "English" ? ` Write in ${config.language}.` : "";
  const depthNote = config.bookLength === "long"
    ? " Write with deep, immersive, layered narrative."
    : config.bookLength === "short"
      ? " Concise, high-density writing."
      : "";

  return `Write approximately ${min}–${max} words.${depthNote}${langNote}`;
}

/* ============ Genre Prompts (delegated to Genre Intelligence Engine) ============ */

function getGenrePrompt(config: BookConfig): string {
  // Usa il modulo Genre Intelligence per profili profondi per genere/sottocategoria
  return buildGenreSystemBlock(config.genre, (config as any).subcategory);
}

function getSystemPrompt(config: BookConfig, lock?: GenreLock, opts?: { dominateMode?: boolean }): string {
  const langMap: Record<string, string> = {
    English: "English", Italian: "Italian (Italiano)", Spanish: "Spanish (Español)",
    French: "French (Français)", German: "German (Deutsch)",
  };
  const lang = langMap[config.language] || config.language;
  const genrePrompt = getGenrePrompt(config);
  const bp = resolveLockedBlueprint(config, lock);
  const editorialBlock = `EDITORIAL BLUEPRINT — ${resolveGenreKey(config.genre, (config as any).subcategory).toUpperCase()}${lock ? " (LOCKED)" : ""}
Book structure (sections): ${bp.structure.join(" → ")}
Editorial tone: ${bp.tone}
Chapter style: ${bp.chapterStyle}
Subchapters expected: ${bp.hasSubchapters ? "yes" : "no"}

CONTENT RULES (mandatory for every chapter):
${bp.contentRules.map(r => `• ${r}`).join("\n")}`;

  const masteryBlock = buildEditorialMasteryBlock({
    genre: config.genre,
    subcategory: (config as any).subcategory,
    language: lang,
    tone: config.tone,
    dominateMode: opts?.dominateMode,
  });

  return `${genrePrompt}

${editorialBlock}

${getStyleLock(config)}

${masteryBlock}

ABSOLUTE RULES — BESTSELLER STANDARD:
1. WRITE EVERYTHING IN ${lang.toUpperCase()}. Every word, title, sentence MUST be in ${lang}. No exceptions.
2. START every chapter with a powerful HOOK — tension, uncomfortable truth, or scene-in-motion. Never throat-clearing.
3. Include at least 3–5 quotable, highlight-worthy sentences per chapter.
4. NEVER repeat ideas, phrases, examples, or structural patterns across chapters.
5. Each chapter must escalate — building emotional, cognitive, or narrative momentum.
6. Write at PUBLISHED BESTSELLER quality — superior to current market average.
7. Create sentences readers will screenshot, highlight, and share.
8. Use varied sentence rhythm — short punches mixed with flowing prose.
9. Book scope: ${BOOK_LENGTH_CONFIG[config.bookLength].description} (target: ~${getBookTotalWords(config).toLocaleString()} total words)
10. RESPECT THE EDITORIAL BLUEPRINT — chapter style and content rules are MANDATORY${lock ? " AND LOCKED" : ""}.
11. RESPECT THE EDITORIAL MASTERY LAYER — apply silently, never expose its rules in the text.
12. OUTPUT RULE: return ONLY the final content. No commentary, no explanations, no labels, no apologies.`;
}

/* ============ Phase Logic for Chunked Writing ============ */

type ChunkPhase = "OPENING" | "DEVELOPMENT" | "EXPANSION" | "TRANSITION" | "CLOSURE";

function getChunkPhase(currentWords: number, targetWords: number): ChunkPhase {
  const ratio = currentWords / targetWords;
  if (ratio < 0.2) return "OPENING";
  if (ratio < 0.4) return "DEVELOPMENT";
  if (ratio < 0.7) return "EXPANSION";
  if (ratio < 0.85) return "TRANSITION";
  return "CLOSURE";
}

function getPhaseInstruction(phase: ChunkPhase): string {
  switch (phase) {
    case "OPENING":
      return "Hook the reader immediately. Build intrigue and establish the emotional premise. Create a compelling opening that demands continued reading.";
    case "DEVELOPMENT":
      return "Expand on the core ideas. Deepen the narrative with examples, insights, and emotional layers. Build momentum.";
    case "EXPANSION":
      return "Add richness: new perspectives, vivid examples, emotional complexity. This is the heart of the chapter — make it resonate deeply.";
    case "TRANSITION":
      return "Begin guiding toward resolution. Tie threads together. Start the emotional convergence toward the chapter's conclusion.";
    case "CLOSURE":
      return "Write toward a powerful, satisfying ending only when the chapter genuinely feels complete. Create emotional payoff, but do not rush closure or cut the chapter short.";
  }
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function checkOverlap(existingText: string, newChunk: string): number {
  const existingSentences = existingText.split(/[.!?]+/).filter(s => s.trim().length > 20).slice(-10);
  const newSentences = newChunk.split(/[.!?]+/).filter(s => s.trim().length > 20);
  if (newSentences.length === 0) return 0;
  let overlapping = 0;
  for (const ns of newSentences) {
    const nsTrimmed = ns.trim().toLowerCase();
    for (const es of existingSentences) {
      if (es.trim().toLowerCase().includes(nsTrimmed.substring(0, 50)) || nsTrimmed.includes(es.trim().toLowerCase().substring(0, 50))) {
        overlapping++;
        break;
      }
    }
  }
  return overlapping / newSentences.length;
}

/* ============ Adaptive Chunk Intelligence ============ */

type ChunkSize = "LARGE" | "MEDIUM" | "SMALL" | "MICRO";

interface ChunkSizeConfig {
  min: number;
  max: number;
  timeout: number;
  label: string;
}

// Timeouts increased — DeepSeek streaming can take 60-90s for LARGE chunks
// Watchdog in callAIOnce resets on each received byte, so timeout = max IDLE time
const CHUNK_SIZES: Record<ChunkSize, ChunkSizeConfig> = {
  // Pro sequential chapter rhythm:
  // standard chunk gravitates around ~700 words,
  // then shrinks only if failures force a safer fallback.
  LARGE:  { min: 620, max: 760, timeout: 210000, label: "Large Pro (620–760)" },
  MEDIUM: { min: 520, max: 680, timeout: 180000, label: "Medium Pro (520–680)" },
  SMALL:  { min: 380, max: 520, timeout: 150000, label: "Small Safe (380–520)" },
  MICRO:  { min: 220, max: 360, timeout: 120000, label: "Micro Rescue (220–360)" },
};

function selectChunkSize(consecutiveFailures: number): ChunkSize {
  if (consecutiveFailures === 0) return "LARGE";
  if (consecutiveFailures === 1) return "MEDIUM";
  if (consecutiveFailures === 2) return "SMALL";
  return "MICRO";
}

function getAdaptivePromptSuffix(chunkSize: ChunkSize): string {
  if (chunkSize === "SMALL" || chunkSize === "MICRO") {
    return `\n\nIMPORTANT: You are writing a shorter, focused section of a larger chapter.
Develop ONE idea clearly and deeply.
Do NOT rush. Maintain high quality and emotional depth.
Every sentence must feel intentional and polished.`;
  }
  return "";
}

/* ============ Chunked Chapter Generation ============ */

export interface ChunkProgress {
  chunkIndex: number;
  totalChunks: number;
  currentWords: number;
  targetWords: number;
  phase: ChunkPhase;
  content: string;
  chunkSize?: ChunkSize;
}

export async function generateChapterChunked(
  config: BookConfig,
  blueprint: BookBlueprint,
  chapterIndex: number,
  previousChapters: Chapter[],
  chapterLengthOverride?: string,
  onChunkProgress?: (progress: ChunkProgress) => void,
  genreLock?: GenreLock,
  opts?: { adaptive?: { plan: import("@/lib/plan").PlanTier } },
): Promise<Chapter> {
  const outline = blueprint.chapterOutlines[chapterIndex];
  const targetWords = getChapterTargetWords(config, chapterIndex, config.numberOfChapters, chapterLengthOverride);
  const contextMemory = buildContextMemory(config, blueprint, previousChapters, chapterIndex);
  const systemBase = getSystemPrompt(config, genreLock);
  const genreDirective = buildPromptByGenre({
    genre: genreLock?.genre || config.genre,
    subcategory: genreLock?.subcategory || (config as any).subcategory,
    chapterTitle: outline.title,
    chapterSummary: outline.summary,
    language: config.language,
  });

  let accumulatedContent = "";
  let chapterTitle = outline.title;
  let chunkIndex = 0;
  let consecutiveFailures = 0;
  const maxChunks = Math.max(80, Math.ceil(targetWords / 250) + 30); // safety cap only: prevents infinite loops, never acts as chapter-length wall

  if (DEV_DEBUG_STREAM) console.log(`[Nexora] Adaptive chunked generation: target=${targetWords} words, safetyMaxChunks=${maxChunks}`);

  while (chunkIndex < maxChunks) {
    const currentWords = countWords(accumulatedContent);
    const phase = getChunkPhase(currentWords, targetWords);
    const phaseInstruction = getPhaseInstruction(phase);
    const remainingWords = Math.max(600, targetWords - currentWords);

    // Stop if past target
    // Target words are guidance only, never a hard wall.
    // Do not stop just because the estimated chapter target was exceeded.

    // Professional continuation guard:
    // Never close the chapter early at 850/1200 words.
    // Keep generating until the real target range is reached.
    // Do not force closure merely because the chapter is near the estimated target.
    // The continuation loop decides based on safety caps and generated content.

    // Adaptive chunk size selection
    const chunkSize = selectChunkSize(consecutiveFailures);
    const sizeConfig = CHUNK_SIZES[chunkSize];
    const chunkTarget = phase === "CLOSURE"
      ? Math.min(remainingWords + 100, sizeConfig.max)
      : Math.min(Math.max(sizeConfig.min, remainingWords), sizeConfig.max);

    if (DEV_DEBUG_STREAM) console.log(`[Nexora] Chunk ${chunkIndex + 1}: size=${chunkSize} (${sizeConfig.label}), failures=${consecutiveFailures}`);

    const isFirstChunk = chunkIndex === 0;
    const lastTextSegment = accumulatedContent.slice(-1200);
    const adaptiveSuffix = getAdaptivePromptSuffix(chunkSize);

    const chunkPrompt = isFirstChunk
      ? `Write the OPENING of Chapter ${chapterIndex + 1} of "${config.title}".
Chapter title: "${outline.title}"
Chapter plan: ${outline.summary}
Genre: ${config.genre}
Language: ${config.language} — WRITE ENTIRELY IN ${config.language}

${genreDirective}

${contextMemory}

TARGET: Write approximately ${chunkTarget} words for this segment.
TOTAL CHAPTER TARGET: ${targetWords} words (you will write more chunks after this).
PHASE: ${phase} — ${phaseInstruction}

BESTSELLER QUALITY REQUIREMENTS:
- Open with a line that stops the reader — a hook they'll remember
- Include 2-3 highlight-worthy sentences
- Write like a PUBLISHED BESTSELLER
- Use varied sentence rhythm
- HONOR the GENRE DIRECTIVE above — chapter style and content rules are MANDATORY

Return ONLY the chapter text. Start with the chapter content directly.
Do NOT return JSON. Do NOT include the chapter title in the text.
Write in ${config.language}.${adaptiveSuffix}`

      : `CONTINUE writing Chapter ${chapterIndex + 1} of "${config.title}".
Chapter title: "${chapterTitle}"
Chapter plan: ${outline.summary}
Genre: ${config.genre}
Language: ${config.language}

${genreDirective}

PREVIOUS TEXT (last segment):
"""
${lastTextSegment}
"""

CURRENT PROGRESS: ${currentWords} / ${targetWords} words written
REMAINING: ~${remainingWords} words needed
PHASE: ${phase} — ${phaseInstruction}

TARGET for this chunk: Write approximately ${chunkTarget} words.

CRITICAL RULES:
- Continue EXACTLY from where the previous text ended
- DO NOT restart, summarize, or repeat what was already written
- DO NOT repeat ideas, metaphors, or phrases from previous text
- Maintain narrative coherence and emotional continuity
- HONOR the GENRE DIRECTIVE — same chapter style throughout the book
- Increase depth and quality with each chunk
${phase === "CLOSURE" ? `
ENDING RULES:
- Write toward a POWERFUL, SATISFYING conclusion
- The final lines must feel inevitable and emotionally resonant
- DO NOT leave the chapter unfinished
- Create a strong final paragraph that provides closure
- DO NOT exceed the remaining word budget significantly
` : ""}
Return ONLY the continuation text. No JSON. No titles. No meta-commentary.
Write in ${config.language}.${adaptiveSuffix}`;

    const systemPrompt = `${systemBase} You are writing ${isFirstChunk ? "the opening of" : "a continuation for"} chapter ${chapterIndex + 1} of ${config.numberOfChapters}. Phase: ${phase}. Chunk size: ${chunkSize}.`;

    let chunkText: string | null = null;

    try {
      chunkText = await callAIOnce(systemPrompt, chunkPrompt, sizeConfig.timeout);
      consecutiveFailures = 0; // Reset on success
    } catch (e: any) {
      consecutiveFailures++;
      console.error(`[Nexora] Chunk ${chunkIndex + 1} failed (failures=${consecutiveFailures}):`, e.message);

      // Credit/auth errors = bail immediately
      if (e instanceof AICreditsError) throw e;

      // After 6 consecutive failures, try emergency fallback or stop gracefully
      if (consecutiveFailures > 4 && countWords(accumulatedContent) >= targetWords * 0.92) {
        console.warn(`[Nexora] Emergency finish activated near target at ${countWords(accumulatedContent)}/${targetWords} words after ${consecutiveFailures} failures`);
        break;
      }

      if (consecutiveFailures > 6) {
        if (chunkIndex === 0) {
          // Last-resort fallback for first chunk: smaller/simpler prompt
          console.warn(`[Nexora] Emergency fallback for first chunk`);
          try {
            chunkText = await callAIOnce(
              `You are a ${config.genre} author writing in ${config.language}. Be concise and complete.`,
              `Write the opening section (~600 words) of chapter "${outline.title}" for the book "${config.title}". Outline: ${outline.summary}. Plain prose only.`,
              90000,
            );
            consecutiveFailures = 0;
          } catch {
            throw new Error(`Generation failed after multiple attempts. Try again or reduce chapter length.`);
          }
        } else {
          console.warn(`[Nexora] Stopping with ${countWords(accumulatedContent)} words after ${consecutiveFailures} failures`);
          break;
        }
      } else {
        // Exponential backoff before retry with smaller chunk
        const backoff = Math.min(8000, 1500 * consecutiveFailures);
        await new Promise(r => setTimeout(r, backoff));
        continue; // Loop back — selectChunkSize will downgrade
      }
    }

    if (!chunkText) {
      consecutiveFailures++;
      continue;
    }

    // Clean up
    chunkText = chunkText.replace(/^```[a-z]*\n?/g, "").replace(/\n?```$/g, "").trim();
    if (isFirstChunk) {
      const lines = chunkText.split("\n");
      if (lines[0] && lines[0].startsWith("#")) {
        chapterTitle = lines[0].replace(/^#+\s*/, "").trim();
        chunkText = lines.slice(1).join("\n").trim();
      }
    }

    // Anti-repetition check
    if (!isFirstChunk && accumulatedContent.length > 0) {
      const overlap = checkOverlap(accumulatedContent, chunkText);
      if (overlap > 0.2) {
        console.warn(`[Nexora] Chunk ${chunkIndex + 1} has ${(overlap * 100).toFixed(0)}% overlap — regenerating`);
        try {
          chunkText = await callAI(
            systemPrompt + " CRITICAL: Your previous attempt repeated content. Write ENTIRELY NEW prose that continues from the last sentence.",
            chunkPrompt + "\n\nWARNING: Previous attempt overlapped. Write COMPLETELY NEW content."
          );
          chunkText = chunkText.replace(/^```[a-z]*\n?/g, "").replace(/\n?```$/g, "").trim();
        } catch {
          // Use original if regen fails
        }
      }
    }

    accumulatedContent += (accumulatedContent ? "\n\n" : "") + chunkText;
    chunkIndex++;

    const updatedWords = countWords(accumulatedContent);
    if (DEV_DEBUG_STREAM) console.log(`[Nexora] Chunk ${chunkIndex} complete: ${updatedWords}/${targetWords} words, phase=${phase}, size=${chunkSize}`);

    // Report progress
    onChunkProgress?.({
      chunkIndex,
      totalChunks: maxChunks,
      currentWords: updatedWords,
      targetWords,
      phase,
      content: accumulatedContent,
      chunkSize,
    });

    // SMART COMPLETION GATE:
    // The chapter target is guidance, not a prison.
    // But the engine must stop when the chapter is already complete enough.
    const minAcceptableWords = Math.max(650, Math.floor(targetWords * 0.82));
    const idealStopWords = Math.max(900, Math.floor(targetWords * 0.95));
    const hardStopWords = Math.min(
      Math.max(1200, Math.floor(targetWords * 1.08)),
      1500,
    );

    const endingSample = accumulatedContent.slice(-900).toLowerCase();
    const hasEndingShape =
      /\\b(conclusion|finally|in the end|ultimately|from this moment|this is where|now you|remember|the truth is|and so|because of this|da questo momento|in definitiva|alla fine|ricorda|la verità è|per questo)\\b/i.test(endingSample)
      || /[.!?][\\s\\n]*$/.test(accumulatedContent.trim());

    if (updatedWords >= idealStopWords && hasEndingShape) {
      if (DEV_DEBUG_STREAM) {
        console.log(`[Nexora] Smart stop: ${updatedWords}/${targetWords} words with clean ending.`);
      }
      break;
    }

    if (updatedWords >= hardStopWords) {
      console.log(`[Nexora] Hard stop: ${updatedWords}/${targetWords} words. Chapter accepted.`);
      break;
    }

    if (phase === "CLOSURE" && updatedWords >= minAcceptableWords && hasEndingShape) {
      if (DEV_DEBUG_STREAM) {
        console.log(`[Nexora] Closure stop: ${updatedWords}/${targetWords} words.`);
      }
      break;
    }
  }

  if (!accumulatedContent.trim()) {
    throw new Error("Chapter generation returned empty content.");
  }

  // Completion log is essential — kept always on (1 line per chapter).
  console.log(`[Nexora] Chapter ${chapterIndex + 1} complete: ${countWords(accumulatedContent)} words in ${chunkIndex} chunks`);

  // Editorial QA gate (non-blocking — surfaces in console + Mastery diagnostic)
  let qaScore: number | undefined;
  try {
    const report = validateEditorial(accumulatedContent);
    qaScore = report.score;
    if (DEV_DEBUG_STREAM) {
      console.log(
        `[Nexora] Editorial QA — Ch${chapterIndex + 1}: score ${report.score}/10` +
        (report.issues.length ? ` · ${report.issues.length} issue(s): ${report.issues.map(i => i.kind).join(", ")}` : " · clean"),
      );
    }
  } catch { /* validator must never block */ }

  // Adaptive Rewrite Engine — invisible quality optimiser.
  // Runs only when the caller passes opts.adaptive (current callers stay unchanged).
  if (opts?.adaptive) {
    try {
      const { adaptiveRewritePipeline, estimateMetrics } = await import("@/lib/ai/adaptive-rewrite-engine");
      const { qualityScore, metrics } = estimateMetrics(accumulatedContent);
      const result = await adaptiveRewritePipeline(
        accumulatedContent,
        { contentType: "chapter", plan: opts.adaptive.plan, qualityScore: qaScore ?? qualityScore, metrics },
        {
          rewrite: async (text, instructions, _mode) => {
            const sysBase = getSystemPrompt(config, genreLock);
            const sysPrompt = `${sysBase}\n\n${instructions}`;
            const userPrompt = `Original chapter text to revise (in ${config.language}):\n\n${text}`;
            return await callAI(sysPrompt, userPrompt);
          },
        },
      );
      if (result.rewritten) accumulatedContent = result.text;
    } catch (e) {
      console.warn("[Nexora] Adaptive rewrite skipped:", e);
    }
  }

  return {
    title: chapterTitle,
    content: accumulatedContent,
    subchapters: [],
  };
}

/* ============ Blueprint ============ */

export async function generateBlueprint(config: BookConfig, genreLock?: GenreLock): Promise<BookBlueprint> {
  const bookInfo = BOOK_LENGTH_CONFIG[config.bookLength];
  const totalWords = getBookTotalWords(config);
  const editorialBP = resolveLockedBlueprint(config, genreLock);
  const structureScaffold = editorialBP.structure.length
    ? `\nGENRE STRUCTURE SCAFFOLD${genreLock ? " (LOCKED)" : ""} (use as backbone, expand into ${config.numberOfChapters} chapters):\n${editorialBP.structure.map((s, i) => `${i + 1}. ${s}`).join("\n")}\nMap and expand this scaffold across the ${config.numberOfChapters} chapters — fold/split sections so EVERY chapter advances the editorial structure above.`
    : "";

  const prompt = `Create a detailed book blueprint for:
Title: "${config.title}"
Subtitle: "${config.subtitle}"
Genre: ${config.genre}
Tone: ${config.tone}
Language: ${config.language} — ALL content MUST be in ${config.language}
Book length: ${bookInfo.label} (~${totalWords.toLocaleString()} total words)
Number of chapters: ${config.numberOfChapters}
${config.subchaptersEnabled ? "Include 2-4 subchapters per chapter." : "No subchapters."}
${structureScaffold}

${buildGenreBlueprintBlock(config.genre, (config as any).subcategory)}

CRITICAL — BESTSELLER QUALITY TITLES:
- Chapter titles must be EMOTIONALLY COMPELLING — the kind that make readers flip to that page
- Titles should be evocative, intriguing, or provocative — NOT generic or descriptive
- Think bestseller table of contents that sells the book on its own

Return a COMPACT valid JSON object with:
- overview: maximum 900 characters, clear and marketable (in ${config.language})
- chapterOutlines: Array of {title, summary${config.subchaptersEnabled ? ', subchapters: [{title, summary}]' : ''}} (in ${config.language})
- themes: 4-8 short core themes (in ${config.language})
- emotionalArc: maximum 700 characters (in ${config.language})

STRICT JSON SIZE RULES:
- Each chapter summary must be maximum 260 characters.
- Each subchapter summary must be maximum 180 characters.
- Do NOT write long paragraphs inside JSON fields.
- Do NOT add extra keys.
- Do NOT include markdown.
- Do NOT include commentary before or after the JSON.
- The JSON must be complete and parseable.

Return ONLY valid JSON, no markdown.`;

  const blueprintResult = await safeGenerateAI(
    () => callBlueprintFast(
      getSystemPrompt(config, genreLock) + " You are creating a book architecture optimized for the genre profile above.",
      prompt,
    ),
    {
      mode: "blueprint",
      retries: 2,
      minChars: 120,
      allowPartial: true,
      extractJsonOnly: true,
      systemPrompt: getSystemPrompt(config, genreLock),
      userPrompt: prompt,
    },
  );

  const result = blueprintResult.content;

  try {
    return JSON.parse(result.replace(/```json\n?|```/g, "").trim());
  } catch {
    return {
      overview: result,
      chapterOutlines: Array.from({ length: config.numberOfChapters }, (_, i) => ({
        title: `Chapter ${i + 1}`, summary: "To be generated",
      })),
      themes: [],
      emotionalArc: "",
    };
  }
}

/* ============ Front Matter — TEMPLATE-DRIVEN PER GENRE ============ */

/**
 * Map a genre's frontMatterTemplate sections to the canonical FrontMatter
 * fields. The AI is instructed to write each section as if it belongs in
 * that specific kind of book (e.g. "Kitchen Equipment Notes" for cookbook).
 */
export async function generateFrontMatter(
  config: BookConfig,
  blueprint: BookBlueprint,
  genreLock?: GenreLock,
): Promise<FrontMatter> {
  const bp = resolveLockedBlueprint(config, genreLock);
  const genreKey = resolveGenreKey(config.genre, (config as any).subcategory);
  const sectionsList = bp.frontMatterTemplate.length
    ? bp.frontMatterTemplate
    : ["Title Page", "Copyright", "Dedication", "About the Author", "How to Use This Book", "Letter to the Reader"];

  const prompt = `Generate FRONT MATTER for a ${genreKey.toUpperCase()} book — sections must read as if written by a domain expert in this genre.

BOOK:
- Title: "${config.title}"
- Subtitle: "${config.subtitle}"
- Genre: ${genreKey}
- Language: ${config.language} — ALL content MUST be in ${config.language}
- Overview: ${blueprint.overview}

GENRE-SPECIFIC FRONT MATTER SECTIONS TO PRODUCE (in this exact spirit):
${sectionsList.map((s, i) => `${i + 1}. ${s}`).join("\n")}

CRITICAL EDITORIAL RULES:
- Tone of every section must match: ${bp.tone}
- Use the genre's authentic vocabulary and conventions (e.g. recipes → kitchen equipment notes; medical → disclaimers; software → version notes)
- NEVER produce generic placeholders. Each section must feel domain-native.
- Every field MUST be in ${config.language}.

Map your sections to this JSON shape (combine extra sections into the closest field, NEVER omit domain-specific content):
{
  "titlePage": "Title page content (Title + Subtitle + Author placeholder)",
  "copyright": "Professional copyright notice for current year + any genre-specific legal/disclaimer line",
  "dedication": "A heartfelt, brief dedication (or genre-equivalent: e.g. 'To every gardener who...' / 'To the cooks who...')",
  "aboutAuthor": "Compelling author bio paragraph (positioned as expert in this genre)",
  "howToUse": "How to read and apply THIS specific kind of book — include any genre-specific notes (equipment, prerequisites, climate zone, software version, medical disclaimer, safety, etc.)",
  "letterToReader": "Intimate, warm letter to the reader anchored in the genre's reader promise"
}

Return ONLY valid JSON. No markdown.`;

  const frontMatterResult = await safeGenerateAI(
    () => callAI(getSystemPrompt(config, genreLock), prompt),
    {
      mode: "frontMatter",
      retries: 2,
      minChars: 120,
      allowPartial: true,
      extractJsonOnly: true,
      systemPrompt: getSystemPrompt(config, genreLock),
      userPrompt: prompt,
    },
  );

  const result = frontMatterResult.content;

  try {
    return JSON.parse(result.replace(/```json\n?|```/g, "").trim());
  } catch {
    return {
      titlePage: config.title,
      copyright: `© ${new Date().getFullYear()}`,
      dedication: "",
      aboutAuthor: "",
      howToUse: "",
      letterToReader: result,
    };
  }
}

/* ============ Chapter (legacy single-call, kept for subchapters) ============ */

export async function generateChapter(
  config: BookConfig, blueprint: BookBlueprint, chapterIndex: number,
  previousChapters: Chapter[], chapterLengthOverride?: string,
  genreLock?: GenreLock,
): Promise<Chapter> {
  // Delegate to chunked generation
  return generateChapterChunked(config, blueprint, chapterIndex, previousChapters, chapterLengthOverride, undefined, genreLock);
}

/* ============ Subchapter ============ */

export async function generateSubchapter(
  config: BookConfig, blueprint: BookBlueprint, chapterIndex: number,
  subchapterIndex: number, chapter: Chapter, previousChapters: Chapter[],
  genreLock?: GenreLock,
): Promise<{ title: string; content: string }> {
  const outline = blueprint.chapterOutlines[chapterIndex];
  const subOutline = (outline as any).subchapters?.[subchapterIndex];
  const contextMemory = buildContextMemory(config, blueprint, previousChapters, chapterIndex);
  const existingSubs = chapter.subchapters.map((s, i) =>
    `Subchapter ${i + 1} "${s.title}": ${s.content.substring(0, 200)}...`
  ).join("\n");

  const bookTotal = getBookTotalWords(config);
  const subWordTarget = Math.round((bookTotal / config.numberOfChapters) / 3);
  const subMin = Math.max(400, Math.round(subWordTarget * 0.8));
  const subMax = Math.round(subWordTarget * 1.2);

  const genreDirective = buildPromptByGenre({
    genre: genreLock?.genre || config.genre,
    subcategory: genreLock?.subcategory || (config as any).subcategory,
    chapterTitle: subOutline?.title || `Subchapter ${subchapterIndex + 1}`,
    chapterSummary: subOutline?.summary || "",
    language: config.language,
  });

  const prompt = `Write Subchapter ${subchapterIndex + 1} of Chapter ${chapterIndex + 1} "${chapter.title}" in "${config.title}".
${subOutline ? `Subchapter plan: "${subOutline.title}" — ${subOutline.summary}` : `Write the ${subchapterIndex + 1}th subchapter.`}
Genre: ${config.genre}
Language: ${config.language} — WRITE ENTIRELY IN ${config.language}
Write approximately ${subMin}–${subMax} words.

${genreDirective}

Parent chapter intro: ${chapter.content.substring(0, 500)}...
${existingSubs ? `Already written subchapters (do NOT repeat):\n${existingSubs}` : ""}
${contextMemory}

BESTSELLER QUALITY — same standard as main chapters. HONOR the genre directive above.

Return JSON: { "title": "...", "content": "..." }
ALL in ${config.language}. Return ONLY valid JSON.`;

  const result = await callAI(
    getSystemPrompt(config, genreLock) + ` You are writing a subchapter for chapter ${chapterIndex + 1}. Maintain style lock.`,
    prompt
  );
  try {
    return JSON.parse(result.replace(/```json\n?|```/g, "").trim());
  } catch {
    return { title: subOutline?.title || `Subchapter ${subchapterIndex + 1}`, content: result };
  }
}

/* ============ Back Matter ============ */

export async function generateBackMatter(
  config: BookConfig,
  blueprint: BookBlueprint,
  chapters: Chapter[],
  genreLock?: GenreLock,
): Promise<BackMatter> {
  const bp = resolveLockedBlueprint(config, genreLock);
  const genreKey = resolveGenreKey(config.genre, (config as any).subcategory);
  const chapterTitles = chapters.map((c, i) => `${i + 1}. ${c.title}`).join("\n");
  const sectionsList = bp.backMatterTemplate.length
    ? bp.backMatterTemplate
    : ["Conclusion", "Author Note", "Call to Action", "Review Request", "Other Books"];

  const prompt = `Generate BACK MATTER for a ${genreKey.toUpperCase()} book — read as if written by a domain expert.

BOOK:
- Title: "${config.title}"
- Genre: ${genreKey}
- Language: ${config.language} — ALL content MUST be in ${config.language}
- Chapters:\n${chapterTitles}

GENRE-SPECIFIC BACK MATTER SECTIONS TO PRODUCE (in this exact spirit):
${sectionsList.map((s, i) => `${i + 1}. ${s}`).join("\n")}

CRITICAL EDITORIAL RULES:
- Tone: ${bp.tone}
- Use authentic genre conventions (cookbook → conversion tables; medical → references; software → shortcuts; fitness → progression tables; gardening → seasonal calendar; etc.)
- NEVER produce generic placeholders. Each section must feel domain-native.
- All in ${config.language}.

Map your sections to this JSON shape (combine extra/domain-specific sections into the closest field, NEVER omit them — fold them into authorNote/callToAction/otherBooks as needed):
{
  "conclusion": "Powerful, emotionally or practically resonant conclusion that closes the book in this genre's voice",
  "authorNote": "Personal note from the author — use it ALSO for any technical reference content (glossary, calendar, references) when it fits",
  "callToAction": "Concrete call to action specific to this genre (try the first recipe, schedule the workout week, set up the system today, etc.)",
  "reviewRequest": "Warm, specific request for a review",
  "otherBooks": "Placeholder for other books / further reading / resources in this genre"
}

Return ONLY valid JSON.`;

  const backMatterResult = await safeGenerateAI(
    () => callAI(getSystemPrompt(config, genreLock), prompt),
    {
      mode: "backMatter",
      retries: 2,
      minChars: 120,
      allowPartial: true,
      extractJsonOnly: true,
      systemPrompt: getSystemPrompt(config, genreLock),
      userPrompt: prompt,
    },
  );

  const result = backMatterResult.content;

  try {
    return JSON.parse(result.replace(/```json\n?|```/g, "").trim());
  } catch {
    return {
      conclusion: result,
      authorNote: "",
      callToAction: "",
      reviewRequest: "",
      otherBooks: "",
    };
  }
}

/* ============ AI Quality Evaluation ============ */

export async function evaluateChapterQuality(
  config: BookConfig, chapter: Chapter, chapterIndex: number
): Promise<AIQualityRating> {
  const prompt = `You are a professional book editor and literary critic. Evaluate this chapter with BRUTAL HONESTY.

Book: "${config.title}"
Genre: ${config.genre}
Chapter ${chapterIndex + 1}: "${chapter.title}"

Content (first 3000 chars):
${chapter.content.substring(0, 3000)}

Rate this chapter on a scale of 1-5 stars using STRICT BESTSELLER STANDARDS:
1 = Poor (generic AI writing, repetitive, no emotional depth)
2 = Below Average (some good moments but mostly flat)
3 = Good (solid writing but lacks the spark of a bestseller)
4 = Very Good (publishable quality with memorable moments)
5 = Excellent (bestseller-level, quotable, emotionally powerful)

Return JSON:
{
  "score": <number 1-5>,
  "explanation": "<2-3 sentences explaining the score honestly>",
  "missing": "<what is missing or weak in this chapter>",
  "improvements": "<specific actionable improvements to reach 5 stars>"
}

Be HONEST. Most AI-generated content is 2-3 stars. Only truly exceptional writing deserves 4-5.
Language: Respond in ${config.language}.
Return ONLY valid JSON.`;

  const evaluationResult = await safeGenerateAI(
    () => callAI(
      "You are a world-class literary editor. Evaluate writing quality with precision and honesty. Never inflate scores.",
      prompt
    ),
    {
      mode: "evaluation",
      retries: 2,
      minChars: 80,
      allowPartial: true,
      extractJsonOnly: true,
      systemPrompt: "You are a world-class literary editor. Evaluate writing quality with precision and honesty. Never inflate scores.",
      userPrompt: prompt,
    },
  );

  const result = evaluationResult.content;

  try {
    const parsed = JSON.parse(result.replace(/```json\n?|```/g, "").trim());

    return {
      score: Math.min(5, Math.max(1, Number(parsed.score) || 3)),
      explanation: String(parsed.explanation || ""),
      missing: String(parsed.missing || ""),
      improvements: String(parsed.improvements || ""),
    };
  } catch {
    return {
      score: 3,
      explanation: result,
      missing: "",
      improvements: "",
    };
  }
}

/* ============ Smart Rewrite with Levels ============ */

export type RewriteLevel = "light" | "deep" | "bestseller" | "precision";

function getRewriteLevelInstruction(level: RewriteLevel): string {
  switch (level) {
    case "light":
      return `LIGHT IMPROVEMENT:
- Polish prose: fix awkward phrasing, tighten sentences
- Improve word choice for precision and rhythm
- Strengthen transitions between paragraphs
- Keep the same structure and core ideas
- Enhance 2-3 key sentences for quotability`;
    case "precision":
      return `PRECISION REWRITE LOCK — SURGICAL EDITORIAL UPGRADE:
You are NOT writing a new chapter. You are surgically improving the existing chapter.

ABSOLUTE CONTINUITY LOCK:
- Do NOT change character names.
- Do NOT introduce new family members or replace existing ones.
- Do NOT replace key objects, symbols, locations, or supernatural motifs.
- Do NOT invent a new scene sequence.
- Do NOT change the ending.
- Do NOT remove the original final image/payoff.
- Do NOT change the central mystery.
- Do NOT transform subtle horror into loud horror.
- If the original has Marco, Sara and Leo, keep Marco, Sara and Leo.
- If the original has a stone, keep the stone.
- If the original has a trapdoor/attic, keep the trapdoor/attic.
- If the original ends with the stone rolling in the attic, preserve that ending.

WHAT TO IMPROVE:
- Preserve the existing plot, scene order, character intent, and core atmosphere.
- Protect the best images and strongest sentences.
- Reduce only the excess: overloaded metaphors, repeated emotional beats, vague phrasing.
- Sharpen sensory details, tension, pacing, and psychological subtext.
- Make the family trauma more specific without over-explaining it.
- Strengthen foreshadowing and payoff using details already present in the chapter.
- Improve paragraph rhythm and transitions while keeping the chapter recognizable.
- The result must feel like the same chapter, but cleaner, darker, more precise, and more publishable.

FINAL RULE:
Rewrite the existing chapter. Do not create an alternative version. Do not replace its bones. Polish the blade; do not forge a different weapon.`;
    case "deep":
      return `DEEP REWRITE:
- Restructure paragraphs for better flow and impact
- Add new metaphors, examples, or insights
- Deepen emotional resonance — make the reader FEEL more
- Strengthen the opening hook and closing thought
- Rewrite at least 60% of sentences with fresh prose
- Add layers of meaning and subtext`;
    case "bestseller":
      return `BESTSELLER UPGRADE — TOTAL TRANSFORMATION:
- COMPLETELY reimagine the prose from scratch
- Every paragraph must be publishable in a top-selling book
- Add 5+ highlight-worthy, screenshot-worthy sentences
- Create moments of genuine surprise and emotional power
- Use literary techniques: foreshadowing, callback, rhythm breaks
- The reader must feel changed after reading this chapter
- Channel the DNA of bestsellers in this genre
- Zero generic phrasing — every sentence must be SPECIFIC and VIVID`;
  }
}

export async function rewriteChapter(
  config: BookConfig, blueprint: BookBlueprint, chapter: Chapter,
  chapterIndex: number, previousChapters: Chapter[], instruction: string,
  aiRating?: AIQualityRating, level: RewriteLevel = "deep"
): Promise<Chapter> {
  const weaknessTarget = aiRating
    ? `\n\nAI EDITOR FEEDBACK (you MUST address these weaknesses):
- Current Score: ${aiRating.score}/5
- Issues: ${aiRating.explanation}
- Missing: ${aiRating.missing}
- Required Improvements: ${aiRating.improvements}`
    : "";

  const contextMemory = buildContextMemory(config, blueprint, previousChapters, chapterIndex);
  const lengthInstruction = getChapterLengthInstruction(config, chapterIndex, config.numberOfChapters);
  const levelInstruction = getRewriteLevelInstruction(level);

  const prompt = `${level.toUpperCase()} REWRITE — Chapter ${chapterIndex + 1}: "${chapter.title}"

${levelInstruction}

Instruction: "${instruction}"
${weaknessTarget}

Current content (to be rewritten):
${level === "precision" ? chapter.content.slice(0, 12000) : `${chapter.content.substring(0, 2500)}...`}

${contextMemory}

Book: "${config.title}"
Genre: ${config.genre}
Language: ${config.language} — WRITE ENTIRELY IN ${config.language}
${lengthInstruction}

EVOLUTION RULES:
- Produce NEW PROSE — zero repeated sentences from original
- Maintain continuity with previous chapters
- The rewrite must be MEASURABLY BETTER than the original

Return JSON: { "title": "...", "content": "...", "subchapters": [...] }
ALL in ${config.language}. Return ONLY valid JSON.`;

  const rewriteResult = await safeGenerateAI(
    () => callAI(
      getSystemPrompt(config) + ` You are performing a ${level.toUpperCase()} rewrite. The new version must be superior.`,
      prompt
    ),
    {
      mode: "rewrite",
      retries: 2,
      minChars: 120,
      allowPartial: true,
      extractJsonOnly: true,
      systemPrompt: getSystemPrompt(config) + ` You are performing a ${level.toUpperCase()} rewrite. The new version must be superior.`,
      userPrompt: prompt,
    },
  );

  const result = rewriteResult.content;

  try {
    const parsed = JSON.parse(result.replace(/```json\n?|```/g, "").trim());
    return {
      title: parsed.title || chapter.title,
      content: parsed.content || chapter.content,
      subchapters: Array.isArray(parsed.subchapters) ? parsed.subchapters : chapter.subchapters,
    };
  } catch {
    return { ...chapter, content: result || chapter.content };
  }
}
