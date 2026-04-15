import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";

import {
  normalizePenaltySuggestions,
  type PenaltySuggestion,
} from "@/lib/penaltySuggestions";
import { getTeamById } from "@/lib/queries";
import { slotFromPlayerToken } from "@/lib/playerToken";
import type { PenaltiesJson } from "@/lib/scoring";
import { createAdminClient } from "@/lib/supabase/admin";

const postSchema = z.object({
  playerToken: z.string().uuid(),
  toSlot: z.enum(["p1", "p2", "p3"]),
  strokes: z.number().int().min(1).max(99),
  note: z.string().max(200).optional(),
});

const patchSchema = z.object({
  playerToken: z.string().uuid(),
  suggestionId: z.string().uuid(),
  action: z.enum(["accept", "dismiss"]),
});

type RouteContext = { params: Promise<{ teamId: string }> };

function mergeTeamSelect() {
  return "id, event_id, name, player_1, player_2, player_3, scores, penalties, penalty_suggestions, updated_at";
}

export async function POST(req: Request, context: RouteContext) {
  const { teamId } = await context.params;
  const team = await getTeamById(teamId);
  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const fromSlot = slotFromPlayerToken(team, parsed.data.playerToken);
  if (!fromSlot) {
    return NextResponse.json({ error: "Invalid player token" }, { status: 403 });
  }

  if (parsed.data.toSlot === fromSlot) {
    return NextResponse.json({ error: "Cannot suggest a penalty on yourself" }, { status: 400 });
  }

  const list = normalizePenaltySuggestions(team.penalty_suggestions);

  const next: PenaltySuggestion = {
    id: randomUUID(),
    fromSlot,
    toSlot: parsed.data.toSlot,
    strokes: parsed.data.strokes,
    note: parsed.data.note,
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  const penalty_suggestions = [...list, next];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("teams")
    .update({
      penalty_suggestions,
      updated_at: new Date().toISOString(),
    })
    .eq("id", team.id)
    .select(mergeTeamSelect())
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ team: data });
}

export async function PATCH(req: Request, context: RouteContext) {
  const { teamId } = await context.params;
  const team = await getTeamById(teamId);
  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const slot = slotFromPlayerToken(team, parsed.data.playerToken);
  if (!slot) {
    return NextResponse.json({ error: "Invalid player token" }, { status: 403 });
  }

  const list = normalizePenaltySuggestions(team.penalty_suggestions);
  const idx = list.findIndex((s) => s.id === parsed.data.suggestionId);
  if (idx === -1) {
    return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  }

  const sug = list[idx];
  if (sug.status !== "pending") {
    return NextResponse.json({ error: "Suggestion is no longer pending" }, { status: 409 });
  }

  if (sug.toSlot !== slot) {
    return NextResponse.json({ error: "Not your suggestion to resolve" }, { status: 403 });
  }

  let penalties: PenaltiesJson = { ...team.penalties };
  const nextList = [...list];

  if (parsed.data.action === "accept") {
    const add = Math.max(1, Math.floor(sug.strokes));
    const key = sug.toSlot as keyof PenaltiesJson;
    penalties = {
      ...penalties,
      [key]: Math.max(0, Math.floor(penalties[key] ?? 0) + add),
    };
    nextList[idx] = { ...sug, status: "accepted" };
  } else {
    nextList[idx] = { ...sug, status: "dismissed" };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("teams")
    .update({
      penalties,
      penalty_suggestions: nextList,
      updated_at: new Date().toISOString(),
    })
    .eq("id", team.id)
    .select(mergeTeamSelect())
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ team: data });
}
