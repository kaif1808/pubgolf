import type { Course } from "./course";

export type PlayerSlot = "p1" | "p2" | "p3";

/** Per-hole strokes for all three players */
export type HoleScores = {
  p1?: number | null;
  p2?: number | null;
  p3?: number | null;
};

/** Keyed by hole number as string "1".."9" */
export type ScoresJson = Record<string, HoleScores>;

export type PenaltiesJson = {
  p1: number;
  p2: number;
  p3: number;
};

export function emptyPenalties(): PenaltiesJson {
  return { p1: 0, p2: 0, p3: 0 };
}

/**
 * Per hole: raw strokes + optional under-par bonus (−1) when strokes <= par.
 * Null/undefined hole = not played (0 contribution).
 */
export function holeContribution(
  strokes: number | null | undefined,
  par: number,
): { raw: number; bonus: number } {
  if (strokes === null || strokes === undefined) return { raw: 0, bonus: 0 };
  const s = Math.max(0, Math.floor(strokes));
  const bonus = s > 0 && s <= par ? 1 : 0;
  return { raw: s, bonus };
}

export function playerStrokeTotal(
  course: Course,
  scores: ScoresJson,
  slot: PlayerSlot,
): { raw: number; bonus: number; penalties: number; final: number } {
  const penalties = emptyPenalties();
  return playerStrokeTotalWithPenalties(course, scores, slot, penalties);
}

export function playerStrokeTotalWithPenalties(
  course: Course,
  scores: ScoresJson,
  slot: PlayerSlot,
  penalties: PenaltiesJson,
): { raw: number; bonus: number; penalties: number; final: number } {
  let raw = 0;
  let bonus = 0;
  const parMap = new Map(course.holes.map((h) => [h.hole, h.par]));

  for (const h of course.holes) {
    const key = String(h.hole);
    const row = scores[key];
    const strokes = row?.[slot];
    const par = parMap.get(h.hole) ?? h.par;
    const c = holeContribution(strokes, par);
    raw += c.raw;
    bonus += c.bonus;
  }

  const pen = Math.max(0, Math.floor(penalties[slot] ?? 0));
  const final = raw - bonus + pen;
  return { raw, bonus, penalties: pen, final };
}

export function teamAggregateScore(
  course: Course,
  scores: ScoresJson,
  penalties: PenaltiesJson,
): number {
  const a = playerStrokeTotalWithPenalties(course, scores, "p1", penalties);
  const b = playerStrokeTotalWithPenalties(course, scores, "p2", penalties);
  const c = playerStrokeTotalWithPenalties(course, scores, "p3", penalties);
  return a.final + b.final + c.final;
}
