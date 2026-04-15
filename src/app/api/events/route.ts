import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";

import { DEFAULT_BARCELONA_COURSE } from "@/lib/course";
import { hashOrganizerKey } from "@/lib/hash";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomSlugSuffix, slugify } from "@/lib/slug";

const bodySchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(80).optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title } = parsed.data;
  let slug = parsed.data.slug ? slugify(parsed.data.slug) : slugify(title);
  if (!parsed.data.slug) {
    slug = `${slug}-${randomSlugSuffix()}`;
  }

  const organizerKey = randomBytes(24).toString("hex");
  const organizer_key_hash = hashOrganizerKey(organizerKey);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("events")
    .insert({
      slug,
      title,
      organizer_key_hash,
      course: DEFAULT_BARCELONA_COURSE as unknown as Record<string, unknown>,
    })
    .select("id, slug, title, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Slug already taken. Pick a different slug." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    event: data,
    organizerKey,
    eventUrl: `/e/${data.slug}`,
  });
}
