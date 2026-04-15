import type { PlayerSlot } from "@/lib/scoring";

export type PenaltySuggestionStatus = "pending" | "accepted" | "dismissed";

export type PenaltySuggestion = {
  id: string;
  fromSlot: PlayerSlot;
  toSlot: PlayerSlot;
  strokes: number;
  note?: string;
  createdAt: string;
  status: PenaltySuggestionStatus;
};

const SLOTS: PlayerSlot[] = ["p1", "p2", "p3"];

function isSlot(x: unknown): x is PlayerSlot {
  return typeof x === "string" && SLOTS.includes(x as PlayerSlot);
}

export function normalizePenaltySuggestions(raw: unknown): PenaltySuggestion[] {
  if (!Array.isArray(raw)) return [];
  const out: PenaltySuggestion[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id : "";
    const fromSlot = o.fromSlot;
    const toSlot = o.toSlot;
    const status = o.status;
    const strokes = Number(o.strokes);
    const createdAt = typeof o.createdAt === "string" ? o.createdAt : "";
    if (!id || !isSlot(fromSlot) || !isSlot(toSlot)) continue;
    if (fromSlot === toSlot) continue;
    if (status !== "pending" && status !== "accepted" && status !== "dismissed") continue;
    if (!Number.isFinite(strokes) || strokes < 1 || strokes > 99) continue;
    if (!createdAt) continue;
    const note =
      typeof o.note === "string" && o.note.length > 0 ? o.note.slice(0, 200) : undefined;
    out.push({
      id,
      fromSlot,
      toSlot,
      strokes: Math.floor(strokes),
      note,
      createdAt,
      status,
    });
  }
  return out;
}
