import { NextResponse } from "next/server";
import { z } from "zod";

import { mergePlayerHoleScores } from "@/lib/mergeScores";
import { getTeamById } from "@/lib/queries";
import { slotFromPlayerToken } from "@/lib/playerToken";
import type { PlayerSlot } from "@/lib/scoring";
import { createAdminClient } from "@/lib/supabase/admin";

const patchSchema = z.object({
  playerToken: z.string().uuid(),
  holes: z
    .record(z.string(), z.union([z.number().int().min(0).max(99), z.null()]))
    .optional(),
  penalties: z.number().int().min(0).max(999).optional(),
});

const HOLE_KEYS = new Set([
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
]);

type RouteContext = { params: Promise<{ teamId: string }> };

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

  let scores = team.scores;
  if (parsed.data.holes && Object.keys(parsed.data.holes).length > 0) {
    const filtered: Record<string, number | null> = {};
    for (const [k, v] of Object.entries(parsed.data.holes)) {
      if (!HOLE_KEYS.has(k)) continue;
      filtered[k] = v;
    }
    scores = mergePlayerHoleScores(scores, slot as PlayerSlot, filtered);
  }

  let penalties = { ...team.penalties };
  if (parsed.data.penalties !== undefined) {
    penalties = { ...penalties, [slot]: parsed.data.penalties };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("teams")
    .update({
      scores,
      penalties,
      updated_at: new Date().toISOString(),
    })
    .eq("id", team.id)
    .select(
      "id, event_id, name, player_1, player_2, player_3, scores, penalties, penalty_suggestions, updated_at",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ team: data });
}
