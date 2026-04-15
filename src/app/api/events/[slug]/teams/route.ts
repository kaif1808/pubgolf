import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyOrganizerKey } from "@/lib/hash";
import { getEventBySlug } from "@/lib/queries";
import { createAdminClient } from "@/lib/supabase/admin";

const createTeamSchema = z.object({
  name: z.string().min(1).max(120),
  player_1: z.string().min(1).max(80),
  player_2: z.string().min(1).max(80),
  player_3: z.string().min(1).max(80),
});

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(req: Request, context: RouteContext) {
  const { slug } = await context.params;
  const event = await getEventBySlug(slug);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const organizerKey = req.headers.get("x-organizer-key") ?? "";
  if (!verifyOrganizerKey(organizerKey, event.organizer_key_hash)) {
    return NextResponse.json({ error: "Invalid organizer key" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createTeamSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("teams")
    .insert({
      event_id: event.id,
      name: parsed.data.name,
      player_1: parsed.data.player_1,
      player_2: parsed.data.player_2,
      player_3: parsed.data.player_3,
    })
    .select(
      "id, name, player_1, player_2, player_3, player_token_1, player_token_2, player_token_3, scores, penalties, updated_at",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ team: data });
}
