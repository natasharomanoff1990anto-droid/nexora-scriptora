/**
 * EDITORIAL VALIDATOR
 *
 * Lightweight, regex-based post-generation QA that flags mediocre patterns:
 *  - weak openings (throat-clearing, "in this chapter…")
 *  - AI clichés ("dive in", "game-changer", "in today's fast-paced…")
 *  - empty intensifiers ("really", "very", "truly"…)
 *  - flat rhythm (long runs of similar-length sentences)
 *  - lack of underline-worthy lines (no quotable sentence detected)
 *  - cross-paragraph repetition
 *
 * Returns a score 0-10 + a list of issues. Used as a QA signal — does NOT
 * block generation. The Mastery prompt does the heavy lifting; this catches
 * what slipped through.
 */

export interface EditorialIssue {
  kind:
    | "weak-opening"
    | "ai-cliche"
    | "empty-intensifier"
    | "flat-rhythm"
    | "no-quotable"
    | "repetition"
    | "throat-clearing";
  detail: string;
  excerpt?: string;
}

export interface EditorialReport {
  score: number; // 0-10
  passes: boolean; // score >= 7
  issues: EditorialIssue[];
  stats: {
    wordCount: number;
    sentenceCount: number;
    avgSentenceLength: number;
    rhythmVariance: number;
  };
}

/* ---------- pattern banks ---------- */

const WEAK_OPENINGS = [
  /^\s*in this chapter[,\s]/i,
  /^\s*in questo capitolo[,\s]/i,
  /^\s*today[,\s]+(we|i)\s/i,
  /^\s*oggi[,\s]+(parler|vedremo|scopriremo)/i,
  /^\s*have you ever (wondered|thought|asked)/i,
  /^\s*ti sei mai (chiesto|domandato)/i,
  /^\s*welcome to/i,
  /^\s*benvenut/i,
  /^\s*let'?s (dive|begin|start|talk|explore)/i,
  /^\s*it'?s (important|worth) (to|noting)/i,
  /^\s*è importante (notare|sottolineare|capire)/i,
  /^\s*according to (the )?dictionary/i,
];

const AI_CLICHES = [
  /in today'?s fast[- ]paced world/i,
  /in a world where/i,
  /it'?s no secret that/i,
  /whether you'?re a beginner or a pro/i,
  /from .{1,30} to .{1,30}, this book has it all/i,
  /buckle up/i, /strap in/i, /without further ado/i,
  /game[- ]changer/i, /unlock your potential/i, /transform your life/i,
  /next level/i, /level up/i,
  /it'?s important to note that/i, /it'?s worth mentioning/i,
  /at the end of the day/i,
  /nel mondo (di oggi|frenetico)/i,
  /sblocca il tuo potenziale/i, /cambia la tua vita/i,
  /allacciate le cinture/i, /senza ulteriori indugi/i,
  /è importante notare che/i, /vale la pena ricordare/i,
];

const EMPTY_INTENSIFIERS = [
  /\b(really|very|truly|absolutely|literally|incredibly|extremely)\b/gi,
  /\b(davvero|veramente|assolutamente|letteralmente|incredibilmente|estremamente|proprio)\b/gi,
];

const THROAT_CLEARING = [
  /\bin other words\b/gi,
  /\bwhat this means is\b/gi,
  /\bmoving on\b/gi,
  /\bwith that said\b/gi,
  /\bthat being said\b/gi,
  /\bin altre parole\b/gi,
  /\bquesto significa che\b/gi,
  /\bdetto questo\b/gi,
  /\bandando avanti\b/gi,
];

/* ---------- helpers ---------- */

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+(?=[A-ZÀ-Ú"«"])/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function variance(nums: number[]): number {
  if (nums.length === 0) return 0;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const v = nums.reduce((acc, n) => acc + (n - mean) ** 2, 0) / nums.length;
  return Math.sqrt(v);
}

function hasQuotableSentence(sentences: string[]): boolean {
  // Heuristic: a quotable sentence is short-to-mid (5-25 words),
  // contains no filler intensifier, and ends with a strong terminator
  // or contains a paradox/contrast marker.
  const contrastMarkers = /\b(but|yet|however|instead|not .{1,30} but|non .{1,30} ma|ma|però|invece|eppure)\b/i;
  return sentences.some(s => {
    const wc = s.split(/\s+/).length;
    if (wc < 5 || wc > 28) return false;
    if (/\b(very|really|truly|davvero|veramente|proprio)\b/i.test(s)) return false;
    return contrastMarkers.test(s) || /[.!?…]$/.test(s.trim());
  });
}

function detectRepetition(text: string): EditorialIssue[] {
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const issues: EditorialIssue[] = [];
  if (paragraphs.length < 2) return issues;

  // Compare first 8 words of each paragraph against others — flag near-duplicates
  const opens = paragraphs.map(p => p.split(/\s+/).slice(0, 8).join(" ").toLowerCase());
  for (let i = 0; i < opens.length; i++) {
    for (let j = i + 1; j < opens.length; j++) {
      if (opens[i].length > 20 && opens[i] === opens[j]) {
        issues.push({
          kind: "repetition",
          detail: `Paragraphs ${i + 1} and ${j + 1} open identically.`,
          excerpt: opens[i],
        });
      }
    }
  }
  return issues;
}

/* ---------- public API ---------- */

export function validateEditorial(text: string): EditorialReport {
  const trimmed = text.trim();
  const issues: EditorialIssue[] = [];

  // 1. Weak opening
  for (const rx of WEAK_OPENINGS) {
    if (rx.test(trimmed)) {
      issues.push({
        kind: "weak-opening",
        detail: "Opening matches a known weak / throat-clearing pattern.",
        excerpt: trimmed.slice(0, 120),
      });
      break;
    }
  }

  // 2. AI clichés
  for (const rx of AI_CLICHES) {
    const m = trimmed.match(rx);
    if (m) {
      issues.push({
        kind: "ai-cliche",
        detail: "Generic AI phrasing detected.",
        excerpt: m[0],
      });
    }
  }

  // 3. Empty intensifiers (count occurrences)
  let intensifierCount = 0;
  for (const rx of EMPTY_INTENSIFIERS) {
    intensifierCount += (trimmed.match(rx) || []).length;
  }
  if (intensifierCount > 5) {
    issues.push({
      kind: "empty-intensifier",
      detail: `Empty intensifiers used ${intensifierCount} times — cut to sharpen prose.`,
    });
  }

  // 4. Throat-clearing transitions
  let throatCount = 0;
  for (const rx of THROAT_CLEARING) {
    throatCount += (trimmed.match(rx) || []).length;
  }
  if (throatCount > 2) {
    issues.push({
      kind: "throat-clearing",
      detail: `${throatCount} throat-clearing transitions — replace with action.`,
    });
  }

  // 5. Sentence rhythm
  const sentences = splitSentences(trimmed);
  const lengths = sentences.map(s => s.split(/\s+/).length);
  const avg = lengths.length ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
  const v = variance(lengths);
  if (sentences.length > 8 && v < 4) {
    issues.push({
      kind: "flat-rhythm",
      detail: `Flat rhythm — sentence-length variance ${v.toFixed(1)}. Mix short punches with longer flows.`,
    });
  }

  // 6. Quotable check
  if (sentences.length >= 6 && !hasQuotableSentence(sentences)) {
    issues.push({
      kind: "no-quotable",
      detail: "No clear underline-worthy sentence detected — craft at least one memorable line.",
    });
  }

  // 7. Cross-paragraph repetition
  issues.push(...detectRepetition(trimmed));

  // Score: start at 10, deduct per issue weighted by severity
  const weights: Record<EditorialIssue["kind"], number> = {
    "weak-opening": 2.5,
    "ai-cliche": 1.5,
    "empty-intensifier": 1,
    "throat-clearing": 1,
    "flat-rhythm": 1.5,
    "no-quotable": 2,
    "repetition": 1.5,
  };
  let score = 10;
  for (const i of issues) score -= weights[i.kind] || 1;
  score = Math.max(0, Math.min(10, score));

  return {
    score: Number(score.toFixed(1)),
    passes: score >= 7,
    issues,
    stats: {
      wordCount: trimmed.split(/\s+/).filter(Boolean).length,
      sentenceCount: sentences.length,
      avgSentenceLength: Number(avg.toFixed(1)),
      rhythmVariance: Number(v.toFixed(1)),
    },
  };
}
