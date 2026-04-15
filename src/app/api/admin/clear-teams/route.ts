import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * One-off / emergency: delete all teams in the Supabase project linked to this deployment.
 * Requires PUBGOLF_TEAMS_CLEAR_SECRET on the server and Authorization: Bearer <secret>.
 * Remove or unset the secret after use.
 */
export async function POST(req: Request) {
  const secret = process.env.PUBGOLF_TEAMS_CLEAR_SECRET;
  if (!secret || secret.length < 24) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!token || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  // PostgREST requires a filter on delete; all rows have updated_at >= epoch.
  const { error } = await admin
    .from("teams")
    .delete()
    .gte("updated_at", "1970-01-01T00:00:00.000Z");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "All teams removed." });
}
