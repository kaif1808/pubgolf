import type { PlayerSlot, ScoresJson } from "./scoring";

const HOLES = new Set(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);

export function mergePlayerHoleScores(
  existing: ScoresJson,
  slot: PlayerSlot,
  holes: Record<string, number | null | undefined>,
): ScoresJson {
  const next: ScoresJson = { ...existing };
  for (const [key, val] of Object.entries(holes)) {
    if (!HOLES.has(key)) continue;
    const row = { ...(next[key] ?? {}) };
    if (val === null || val === undefined) {
      delete row[slot];
    } else {
      row[slot] = Math.max(0, Math.floor(val));
    }
    if (Object.keys(row).length === 0) delete next[key];
    else next[key] = row;
  }
  return next;
}
