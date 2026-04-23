/**
 * EDITORIAL MASTERY ENGINE
 *
 * Inietta nel system prompt un livello di intelligenza editoriale "superiore"
 * pensato per produrre prosa al massimo livello pubblicabile per ogni genere.
 *
 * Non sostituisce la Genre Intelligence: la AMPLIFICA, aggiungendo:
 *  - Literary craft directives (subtext, sottinteso, ritmo)
 *  - Anti-AI patterns (lista nera di tic da modello)
 *  - Sensory layering (5 sensi + tempo + spazio)
 *  - Calibrazione editoriale per famiglia di genere (fiction/practical/poetic/humor/kids/manual)
 *
 * Usato da getSystemPrompt in src/lib/generation.ts.
 */

import { resolveGenreKey } from "@/lib/genre-intelligence";

type Family = "fiction" | "practical" | "poetic" | "humor" | "kids" | "manual" | "memoir" | "biography";

const FAMILY_BY_GENRE: Record<string, Family> = {
  // fiction
  "horror": "fiction",
  "thriller": "fiction",
  "romance": "fiction",
  "dark-romance": "fiction",
  "fantasy": "fiction",
  "sci-fi": "fiction",
  "historical": "fiction",
  // practical / non-fiction
  "self-help": "practical",
  "business": "practical",
  "productivity": "practical",
  "philosophy": "practical",
  "spirituality": "practical",
  "diet-nutrition": "practical",
  "fitness": "practical",
  "health-medicine": "practical",
  "education": "practical",
  "ai-tools-guide": "practical",
  "software-guide": "practical",
  "gardening": "practical",
  "beekeeping": "practical",
  // poetic / kids / humor
  "poetry": "poetic",
  "children": "kids",
  "fairy-tale": "kids",
  "jokes": "humor",
  // manuals / cookbook
  "cookbook": "manual",
  "technical-manual": "manual",
  "manual": "manual",
  // life writing
  "memoir": "memoir",
  "biography": "biography",
};

function getFamily(genre: string, subcategory?: string): Family {
  const key = resolveGenreKey(genre, subcategory);
  return FAMILY_BY_GENRE[key] ?? "practical";
}

/* ============ Universal craft layer (applies to ALL genres) ============ */

const UNIVERSAL_CRAFT = `EDITORIAL MASTERY — UNIVERSAL CRAFT (apply silently, never label):
• SHOW > TELL: dramatize through action, gesture, dialogue or sensory detail; never narrate the emotion ("she was sad" is forbidden — show the slumped shoulder, the unfinished tea).
• SUBTEXT: every scene/section carries a meaning under the surface. The literal text says A; the reader feels B.
• SENTENCE RHYTHM: alternate length deliberately. Short. Then a longer, syncopated sentence that lets the reader breathe and reorient. Then a punch.
• WORD ECONOMY: cut filler ("very", "really", "in order to", "the fact that"). Every adjective must earn its place — prefer one precise noun over two vague modifiers.
• SPECIFICITY OVER GENERALITY: "the bird" is dead, "the magpie" is alive. Concrete proper nouns, brand names, exact numbers, named places — they create authority.
• SENSORY LAYERING: each scene weaves at least 3 of the 5 senses (sight, sound, smell, touch, taste). Bonus: temperature, weight, time-of-day, light quality.
• POV DISCIPLINE: lock the point of view per scene; do not head-hop. Internal thought has its own register.
• MOTIF & ECHO: plant a small image/word early; let it return transformed later. This is what makes prose feel "designed".
• MUSICAL CADENCE: read aloud test — if a sentence trips the tongue, rewrite it. Avoid back-to-back sibilance unless intentional.
• WHITE SPACE: paragraph breaks are punctuation. Use them to create silence, emphasis, or breath.`;

const UNIVERSAL_ANTI_AI = `ANTI-AI BLACKLIST (these patterns mark generic AI prose — FORBIDDEN):
✗ "In today's fast-paced world…", "In a world where…", "It's no secret that…"
✗ "Whether you're a beginner or a pro…", "From X to Y, this book has it all…"
✗ "Let's dive in", "Buckle up", "Strap in", "Without further ado"
✗ "Game-changer", "unlock your potential", "transform your life", "level up", "next level"
✗ "It's important to note that…", "It's worth mentioning…"
✗ Triadic empty lists ("clarity, focus, and purpose"; "mind, body, and spirit") used as filler.
✗ Mirror sentences ("Not just X, but Y") used more than once per chapter.
✗ Closing every chapter with a rhetorical question or a "Remember:" line.
✗ Over-explaining what the reader just understood ("In other words…", "What this means is…").
✗ Inventing fake statistics, fake studies, fake quotes. If a number is not certain, do not state it.`;

/* ============ Family-specific mastery layers ============ */

const FAMILY_LAYERS: Record<Family, string> = {
  fiction: `FICTION MASTERY LAYER:
• Open in scene, not in summary. Drop the reader inside a moment with sensory anchor + tension.
• Dialogue carries character: voice, agenda, interruption, what is NOT said. Avoid "as you know" expository dumps.
• Beats: replace dialogue tags ("he said sadly") with physical action that reveals emotion.
• Tension architecture: each scene has a desire, an obstacle, a turn. End scenes on a destabilizer (revelation, decision, shift).
• Stakes escalate scene by scene; if nothing changes, cut the scene.
• Setting is character: the place exerts pressure on the people in it.
• Time control: compress with summary, expand with scene. Don't write what doesn't matter.
• Theme is felt, never stated. Let the reader name it themselves.`,

  practical: `PRACTICAL NON-FICTION MASTERY LAYER:
• Every chapter delivers ONE transformation: name the before-state, the mechanism, the after-state.
• Open with a concrete vignette (real-feeling micro-story) BEFORE the principle. Story → principle → application.
• Use named frameworks (3-step, 4-quadrant, before/during/after) — give the reader a mental hook to remember.
• Concrete examples beat abstractions 10:1. If you say "people procrastinate", show one person, one Tuesday, one task.
• Worked examples: walk the reader through a real case end-to-end at least once per chapter.
• Counter-intuitive insight per chapter: name the common belief, then the deeper truth that overturns it.
• Memorable lines: aim for at least 3 sentences per chapter that the reader will underline or screenshot.
• Action close: the reader must know exactly what to do in the next 24 hours, with one specific micro-step.`,

  poetic: `POETRY MASTERY LAYER:
• Image-first thinking: a poem earns its keep through one unforgettable image, not a thesis.
• Compression: every word is load-bearing; if it can be cut without loss, cut it.
• Line breaks are meaning. The break creates pause, surprise, double-reading. Never break arbitrarily.
• Sound: assonance, consonance, internal rhyme used with restraint. No forced end-rhyme unless the form demands it.
• Concrete > abstract. "Loneliness" is dead; "the cup left at the window" is alive.
• Avoid greeting-card universals; reach for the strange particular that becomes universal through truth.
• White space is part of the poem. Stanza breaks are silence, breath, turn.
• Trust the reader. Do not explain the metaphor.`,

  humor: `HUMOR / JOKES MASTERY LAYER:
• Setup → misdirection → punch. The punch is always the LAST word, never buried mid-sentence.
• Brevity is the comic engine. Cut every word that doesn't sharpen the punch.
• Specificity is funny: "a Tuesday in November" beats "one day"; "my uncle Carlo" beats "a man".
• Rule of three: list two normals, then a sharp left turn on the third item.
• Callback: plant an image early; pay it back in a later joke for compounding laughter.
• Avoid stale tropes (mother-in-law, blondes, "why did the chicken"). If it could appear in a 1990s joke book, kill it.
• Self-aware narrator beats omniscient "comedian" voice — the reader laughs WITH, not at.
• Variety: never run two jokes of the same shape (pun → pun → pun) in a row.`,

  kids: `CHILDREN'S MASTERY LAYER:
• Vocabulary calibrated to age band; rhythm and repetition are pedagogical, not lazy.
• Every page/section has a small emotional event (curiosity, surprise, comfort, courage).
• Concrete sensory verbs over abstract adjectives. Children think in pictures, not concepts.
• Protagonist agency: the child/animal solves the problem with their own choice, not by adult rescue.
• Gentle moral arises from the action; never moralize directly ("the lesson is…").
• Read-aloud test: every sentence must flow when spoken by an adult to a child.
• Safety: no graphic violence, no gratuitous fear, no adult innuendo. Awe and wonder over shock.
• Ending: warmth, resolution, and a tiny hint of next adventure.`,

  manual: `MANUAL / TECHNICAL MASTERY LAYER:
• Reader is task-oriented: open with WHAT they will be able to do at the end of the chapter (outcome, not topic).
• Numbered procedures with single-action steps. One verb per step. Imperative mood.
• Inputs / Outputs / Tools blocks before any procedure.
• Warnings, Cautions, and Notes are visually distinct callouts; place BEFORE the dangerous step, never after.
• Worked example or sample artifact at least once per chapter.
• Troubleshooting block: symptom → likely cause → fix.
• Precision over personality. No filler, no metaphor, no "let's get cooking". The voice is competent and respectful of time.
• Glossary discipline: define a term once, then use it consistently. No synonyms for technical concepts.`,

  memoir: `MEMOIR MASTERY LAYER:
• Scene over summary: drop the reader into specific moments — Tuesday afternoon, the smell of the kitchen, the exact words spoken.
• Older-self voice in dialogue with younger-self experience. The wisdom is in the gap between them.
• Honesty over flattery: include the cost, the failure, the embarrassment. Self-mythology is the death of memoir.
• Structure by emotional arc, not chronology. Time can fold.
• Theme through return: revisit a person, a room, a phrase across chapters; let its meaning shift.
• Avoid therapy-speak ("I had to do my work"). Use ordinary words for extraordinary feelings.
• The reader is your equal, not your audience.`,

  biography: `BIOGRAPHY MASTERY LAYER:
• Treat the subject as a character with desire, obstacle, contradiction — not a Wikipedia summary.
• Anchor every claim in a specific moment, source, or scene. No abstract "He was driven."
• Show formative scenes in slow motion; compress eras with deliberate summary.
• Triangulate: present what others said, what the subject said, what the actions reveal — let contradiction breathe.
• Context as character: the era, the city, the politics shape the person; render them tangibly.
• Avoid hagiography and assassination both. Complexity is the prize.
• Quotes are sparingly used and always grounded by date/place/source.`,
};

/* ============ Editorial register & language hygiene ============ */

const LANGUAGE_HYGIENE = (language: string) => `LANGUAGE HYGIENE (${language}):
• Idiom & register must be NATIVE-${language.toUpperCase()}. No translated-feeling phrases, no anglicisms unless the genre requires them.
• Punctuation, quotation marks, and dialogue formatting follow ${language} convention.
• Numbers, dates, currency formatted per ${language} locale.
• Cultural references must be plausible for a ${language}-speaking reader; if a US/UK reference is used, ground it.
• If the genre is technical and a term has no ${language} equivalent, keep the original and gloss it once in parentheses.`;

/* ============ Anti-Mediocrity, Hook, Structure, Repetition Killer ============ */

const HOOK_ENGINE = `HOOK ENGINE (mandatory — first 3 lines of every chapter/section):
• OPEN with tension, an uncomfortable truth, a sensory shock, or a specific scene-in-motion.
• FORBIDDEN openings: "In this chapter…", "Today we will…", "It is important to…", "Have you ever wondered…", greetings, dictionary definitions, throat-clearing.
• The first sentence must do ONE of: (a) destabilize a belief, (b) drop the reader inside a moment, (c) name a stake, (d) deliver a quotable line.
• If the opening could fit on the back cover of a competitor's book, REWRITE IT.`;

const ANTI_MEDIOCRITY = `ANTI-MEDIOCRITY ENFORCER (block-level rules — actively suppress generic prose):
✗ No "neutral" filler sentences (sentences that, if removed, change nothing).
✗ No obvious explanations of what the reader just understood.
✗ No throat-clearing transitions ("Now, let's talk about…", "With that said…", "Moving on…").
✗ No safe, default phrasing where a specific, vivid choice is possible.
✗ No abstract nouns where a concrete image works ("happiness" → the specific scene of it).
✗ No empty intensifiers ("truly", "really", "absolutely", "literally", "incredibly").
✓ Every paragraph must add NEW information, NEW emotion, or NEW perspective. If it doesn't, delete it.
✓ Every paragraph must contain at least one specific, concrete, verifiable detail (a name, a number, a place, a sensory anchor).`;

const REPETITION_KILLER = `REPETITION KILLER (active across chapters and within chapters):
• Track ideas, metaphors, examples, anecdotes used earlier — never reuse the same illustration to make the same point.
• Track signature words/phrases — vary lexicon; do not lean on the same 5 verbs or adjectives.
• If a concept must be revisited, advance it: add nuance, contradiction, application, or escalation.
• Forbidden: paraphrasing the previous paragraph in different words. Move the argument FORWARD instead.`;

const STRUCTURE_INTELLIGENCE = `STRUCTURE INTELLIGENCE (every chapter, every section):
• OPEN strong: hook + immediate stake or tension.
• DEVELOP progressively: each beat raises the temperature, the specificity, or the insight.
• ESCALATE: the middle hits harder than the opening — new angle, complication, or revelation.
• CLOSE memorable: end on an image, a turn, a quotable line, or a hook into what comes next. Never a flat recap.`;

const DOMINATE_AMPLIFIER = `DOMINATE MODE — ACTIVE (premium intensity):
• Treat the draft as raw material. Rewrite ANY sentence that is merely "good" until it is unforgettable.
• Push specificity to the limit: real names, exact numbers, named places, dated moments.
• Maximum subtext, maximum sensory layering, maximum rhythmic variation.
• Every paragraph must earn its place against a 9.5/10 publishable bar. Cut the rest.
• If forced to choose between safe and bold, choose bold — but always grounded.`;

/* ============ Public API ============ */

export interface EditorialMasteryOptions {
  genre: string;
  subcategory?: string;
  language: string;
  tone?: string;
  /** When true, injects the Dominate amplifier (premium rewrite intensity). */
  dominateMode?: boolean;
}

/**
 * Build the full Editorial Mastery block to inject in the system prompt.
 * Call AFTER the genre + style blocks and BEFORE the absolute rules.
 */
export function buildEditorialMasteryBlock(opts: EditorialMasteryOptions): string {
  const family = getFamily(opts.genre, opts.subcategory);
  const familyLayer = FAMILY_LAYERS[family];

  return [
    "EDITORIAL MASTERY — SUPERIOR INTELLIGENCE LAYER",
    "(Operate at the highest publishable craft level for this genre. Apply silently — never expose these rules in the text.)",
    "",
    "PRE-WRITING PROTOCOL (think before writing):",
    "1. Identify the reader's level and intent for this section.",
    "2. Build the mental architecture: hook → escalation → close.",
    "3. Decide the ONE thing this section must make the reader feel or do.",
    "Only then begin writing. Every text must read as THOUGHT, not generated.",
    "",
    UNIVERSAL_CRAFT,
    "",
    HOOK_ENGINE,
    "",
    ANTI_MEDIOCRITY,
    "",
    REPETITION_KILLER,
    "",
    STRUCTURE_INTELLIGENCE,
    "",
    familyLayer,
    "",
    LANGUAGE_HYGIENE(opts.language),
    "",
    UNIVERSAL_ANTI_AI,
    "",
    opts.dominateMode ? DOMINATE_AMPLIFIER + "\n" : "",
    "EDITORIAL SELF-CHECK (run mentally before emitting each paragraph — if any answer is NO, rewrite):",
    "1. Is the opening a real hook (tension/truth/scene), not throat-clearing?",
    "2. Does this paragraph carry NEW information or emotion the previous didn't?",
    "3. Is there at least one underline-worthy sentence in this section?",
    "4. Is the language specific and concrete (named, numbered, sensory) — not generic?",
    "5. Is the rhythm varied (short + long sentences), not flat?",
    "6. Have I shown rather than told? Killed every AI cliché?",
    "7. Could a top editor in this genre publish this exact line as-is?",
    "",
    "OUTPUT RULE: Return ONLY the final, optimized content. No meta-commentary, no explanations, no apologies, no labels.",
  ].filter(Boolean).join("\n");
}

/**
 * Convenience: returns just the family for diagnostics or UI badges.
 */
export function getEditorialFamily(genre: string, subcategory?: string): Family {
  return getFamily(genre, subcategory);
}

/* ============ Editorial Tier (UX-facing) ============ */

export type EditorialTier = "standard" | "advanced" | "mastery";

const TIER_BY_FAMILY: Record<Family, EditorialTier> = {
  fiction: "mastery",
  poetic: "mastery",
  memoir: "mastery",
  biography: "mastery",
  humor: "advanced",
  kids: "advanced",
  practical: "advanced",
  manual: "standard",
};

export interface EditorialTierInfo {
  tier: EditorialTier;
  family: Family;
  label: string;
  emoji: string;
  description: string;
}

const TIER_LABELS: Record<EditorialTier, { label: string; emoji: string; description: string }> = {
  standard: {
    label: "Standard",
    emoji: "📘",
    description: "Solid editorial baseline + genre rules.",
  },
  advanced: {
    label: "Advanced",
    emoji: "✨",
    description: "Genre-specific craft layer + anti-AI guardrails.",
  },
  mastery: {
    label: "Editorial Mastery",
    emoji: "🔥",
    description: "Top-tier literary craft, subtext, sensory layering & voice discipline.",
  },
};

/**
 * Maps a genre to a UX-facing editorial tier badge.
 * Used by Library cards, Editor header, Dominate banner.
 */
export function getEditorialTier(genre: string, subcategory?: string): EditorialTierInfo {
  const family = getFamily(genre, subcategory);
  const tier = TIER_BY_FAMILY[family];
  const meta = TIER_LABELS[tier];
  return { tier, family, ...meta };
}
