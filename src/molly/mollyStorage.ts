import type { MollyState } from "./mollyEngine";

const KEY = "molly.v2.state";

export function loadState(): MollyState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.hunger !== "number") return null;
    return parsed as MollyState;
  } catch {
    return null;
  }
}

export function saveState(state: MollyState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore quota
  }
}
