import { describe, expect, it } from "vitest";
import { DEFAULT_BARCELONA_COURSE } from "./course";
import {
  emptyPenalties,
  holeContribution,
  playerStrokeTotalWithPenalties,
  teamAggregateScore,
  type ScoresJson,
} from "./scoring";

describe("holeContribution", () => {
  it("returns zero for empty hole", () => {
    expect(holeContribution(null, 4)).toEqual({ raw: 0, bonus: 0 });
    expect(holeContribution(undefined, 4)).toEqual({ raw: 0, bonus: 0 });
  });

  it("applies under-par bonus when strokes are positive and within par", () => {
    expect(holeContribution(3, 4)).toEqual({ raw: 3, bonus: 1 });
    expect(holeContribution(4, 4)).toEqual({ raw: 4, bonus: 1 });
  });

  it("does not apply bonus when over par", () => {
    expect(holeContribution(5, 4)).toEqual({ raw: 5, bonus: 0 });
  });
});

describe("playerStrokeTotalWithPenalties", () => {
  it("sums holes with bonuses and penalties", () => {
    const scores: ScoresJson = {
      "1": { p1: 4 },
      "2": { p1: 5 },
    };
    const course = DEFAULT_BARCELONA_COURSE;
    const penalties = { ...emptyPenalties(), p1: 2 };
    const r = playerStrokeTotalWithPenalties(course, scores, "p1", penalties);
    // hole 1: par 4, strokes 4 -> raw 4, bonus 1 -> net 3 for that hole in final formula: raw - bonus
    // hole 2: par 4, strokes 5 -> raw 5, bonus 0
    // raw total 9, bonus total 1, penalties 2 -> final = 9 - 1 + 2 = 10
    expect(r.raw).toBe(9);
    expect(r.bonus).toBe(1);
    expect(r.final).toBe(10);
  });

  it("final equals (raw − bonus) + penalties (net before penalties + penalties)", () => {
    const scores: ScoresJson = {
      "1": { p1: 4 },
      "2": { p1: 6 },
    };
    const penalties = { ...emptyPenalties(), p1: 3 };
    const r = playerStrokeTotalWithPenalties(
      DEFAULT_BARCELONA_COURSE,
      scores,
      "p1",
      penalties,
    );
    const netAfterParBonus = r.raw - r.bonus;
    expect(r.final).toBe(netAfterParBonus + r.penalties);
  });
});

describe("teamAggregateScore", () => {
  it("sums all three players", () => {
    const scores: ScoresJson = {
      "1": { p1: 1, p2: 1, p3: 1 },
    };
    const pen = emptyPenalties();
    const t = teamAggregateScore(DEFAULT_BARCELONA_COURSE, scores, pen);
    // hole 1 par 4, each 1 stroke -> each gets bonus 1, raw 1 -> final per player 1 - 1 + 0 = 0
    const p1 = playerStrokeTotalWithPenalties(DEFAULT_BARCELONA_COURSE, scores, "p1", pen);
    expect(p1.final).toBe(0);
    expect(t).toBe(0);
  });

  it("matches sum of per-player finals (display identity)", () => {
    const scores: ScoresJson = {
      "1": { p1: 3, p2: 4, p3: 5 },
      "2": { p1: 2, p2: 2 },
    };
    const pen = { ...emptyPenalties(), p2: 1 };
    const a = playerStrokeTotalWithPenalties(DEFAULT_BARCELONA_COURSE, scores, "p1", pen);
    const b = playerStrokeTotalWithPenalties(DEFAULT_BARCELONA_COURSE, scores, "p2", pen);
    const c = playerStrokeTotalWithPenalties(DEFAULT_BARCELONA_COURSE, scores, "p3", pen);
    expect(a.final + b.final + c.final).toBe(
      teamAggregateScore(DEFAULT_BARCELONA_COURSE, scores, pen),
    );
    expect(a.final).toBe(a.raw - a.bonus + a.penalties);
    expect(b.final).toBe(b.raw - b.bonus + b.penalties);
  });
});
