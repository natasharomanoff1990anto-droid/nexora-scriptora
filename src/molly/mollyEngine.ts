// Molly state engine — pure, no React.

export type MollyMood = "playful" | "calm" | "tired" | "sad";
export type MollyVisual = "idle" | "play" | "eat" | "sleep";

export interface MollyState {
  hunger: number;     // 0–100 (100 = starving)
  thirst: number;     // 0–100
  energy: number;     // 0–100 (0 = exhausted)
  happiness: number;  // 0–100
  bond: number;       // 0–100
  mood: MollyMood;
  visual: MollyVisual;
  lastTick: number;
}

export function defaultState(): MollyState {
  return {
    hunger: 25,
    thirst: 25,
    energy: 80,
    happiness: 70,
    bond: 30,
    mood: "calm",
    visual: "idle",
    lastTick: Date.now(),
  };
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

export function computeMood(s: Pick<MollyState, "hunger" | "thirst" | "energy" | "bond">): MollyMood {
  if (s.hunger > 80 || s.thirst > 85) return "sad";
  if (s.energy < 20) return "tired";
  if (s.bond > 60 && s.energy > 45) return "playful";
  return "calm";
}

function computeHappiness(s: Pick<MollyState, "hunger" | "thirst" | "energy" | "bond">): number {
  return clamp((100 - s.hunger) * 0.25 + (100 - s.thirst) * 0.2 + s.energy * 0.25 + s.bond * 0.3);
}

// Decay applied every tick (called every 30s).
export function tick(state: MollyState, now: number = Date.now()): MollyState {
  const next: MollyState = {
    ...state,
    hunger: clamp(state.hunger + 3),
    thirst: clamp(state.thirst + 4),
    energy: clamp(state.energy - 3),
    lastTick: now,
  };
  next.happiness = computeHappiness(next);
  next.mood = computeMood(next);
  return next;
}

// User actions
export function feed(s: MollyState): MollyState {
  const next: MollyState = {
    ...s,
    hunger: clamp(s.hunger - 50),
    energy: clamp(s.energy + 8),
    bond: clamp(s.bond + 3),
    visual: "eat",
  };
  next.happiness = computeHappiness(next);
  next.mood = computeMood(next);
  return next;
}

export function drink(s: MollyState): MollyState {
  const next: MollyState = {
    ...s,
    thirst: clamp(s.thirst - 55),
    bond: clamp(s.bond + 2),
    visual: "eat",
  };
  next.happiness = computeHappiness(next);
  next.mood = computeMood(next);
  return next;
}

export function sleep(s: MollyState): MollyState {
  const next: MollyState = {
    ...s,
    energy: clamp(s.energy + 60),
    visual: "sleep",
  };
  next.happiness = computeHappiness(next);
  next.mood = computeMood(next);
  return next;
}

export function play(s: MollyState): MollyState {
  const next: MollyState = {
    ...s,
    energy: clamp(s.energy - 10),
    bond: clamp(s.bond + 6),
    happiness: clamp(s.happiness + 8),
    visual: "play",
  };
  next.mood = computeMood(next);
  return next;
}
