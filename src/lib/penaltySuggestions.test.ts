import { describe, expect, it } from "vitest";
import { normalizePenaltySuggestions } from "./penaltySuggestions";

describe("normalizePenaltySuggestions", () => {
  it("returns empty for invalid input", () => {
    expect(normalizePenaltySuggestions(null)).toEqual([]);
    expect(normalizePenaltySuggestions({})).toEqual([]);
  });

  it("keeps valid pending items", () => {
    const list = [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        fromSlot: "p1",
        toSlot: "p2",
        strokes: 2,
        createdAt: "2026-04-15T12:00:00.000Z",
        status: "pending" as const,
      },
    ];
    const out = normalizePenaltySuggestions(list);
    expect(out).toHaveLength(1);
    expect(out[0]!.strokes).toBe(2);
    expect(out[0]!.fromSlot).toBe("p1");
  });

  it("drops self-targeting and malformed rows", () => {
    const list = [
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        fromSlot: "p1",
        toSlot: "p1",
        strokes: 1,
        createdAt: "2026-04-15T12:00:00.000Z",
        status: "pending" as const,
      },
    ];
    expect(normalizePenaltySuggestions(list)).toEqual([]);
  });
});
