import type { MollyState, MollyVisual } from "./mollyEngine";

export interface BehaviorDecision {
  visual: MollyVisual;
  message?: string;
}

const FLOW_LINES = [
  "You're in the flow.",
  "That part feels strong.",
  "Keep going. I'm reading along.",
  "Nice rhythm. Don't stop.",
];

export const AUTHOR_FACTS = [
  "Stephen King writes 2,000 words every single day. No excuses.",
  "Virginia Woolf rewrote sentences dozens of times before she let them live.",
  "Hemingway stopped mid-sentence so tomorrow's start wasn't blank.",
  "Toni Morrison wrote at 4am, before her kids woke up.",
  "Dostoevsky wrote under deadline pressure. You too?",
  "Murakami runs every day. He says writing is a physical act.",
];

export const WRITING_PROMPTS = [
  "Write one sentence that hurts.",
  "Describe a smell that means home.",
  "Open a chapter with a single word.",
  "What would your villain whisper at 3am?",
  "Write the line you're afraid to write.",
];

export const JOKES = [
  "Why did the writer bring a ladder? To reach the high concept.",
  "I tried fetching plot holes. Couldn't carry them all.",
  "My favourite genre? Anything with a treat at the end.",
];

export function pickFlowLine(): string {
  return FLOW_LINES[Math.floor(Math.random() * FLOW_LINES.length)];
}

export function pickImmersion(): string {
  const pool = [...AUTHOR_FACTS, ...WRITING_PROMPTS, ...JOKES];
  return pool[Math.floor(Math.random() * pool.length)];
}

// Behavior loop — called every tick. NO walking; only chooses a visual + maybe a line.
export function decideBehavior(state: MollyState, lastSpokeAt: number, now: number = Date.now()): BehaviorDecision {
  // Critical needs first
  if (state.hunger > 80) {
    return {
      visual: "idle",
      message: now - lastSpokeAt > 60000 ? "I'm hungry…" : undefined,
    };
  }
  if (state.thirst > 85) {
    return {
      visual: "idle",
      message: now - lastSpokeAt > 60000 ? "Water?" : undefined,
    };
  }
  if (state.energy < 20) {
    return { visual: "sleep" };
  }

  if (state.mood === "playful") {
    const speak = now - lastSpokeAt > 90000 && Math.random() < 0.4;
    return {
      visual: Math.random() < 0.5 ? "play" : "idle",
      message: speak ? "Throw something! I'll catch it." : undefined,
    };
  }

  // Calm: maybe immersion line
  const speak = now - lastSpokeAt > 120000 && Math.random() < 0.25;
  return {
    visual: "idle",
    message: speak ? pickImmersion() : undefined,
  };
}
