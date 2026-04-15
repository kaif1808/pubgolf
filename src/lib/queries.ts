import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Course } from "@/lib/course";
import { DEFAULT_BARCELONA_COURSE } from "@/lib/course";
import type { PenaltiesJson, ScoresJson } from "@/lib/scoring";

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  organizer_key_hash: string;
  course: Course;
  created_at: string;
};

export type TeamRow = {
  id: string;
  event_id: string;
  name: string;
  player_1: string;
  player_2: string;
  player_3: string;
  player_token_1: string;
  player_token_2: string;
  player_token_3: string;
  scores: ScoresJson;
  penalties: PenaltiesJson;
  updated_at: string;
};

function parseCourse(raw: unknown): Course {
  if (raw && typeof raw === "object" && "holes" in (raw as object)) {
    return raw as Course;
  }
  return DEFAULT_BARCELONA_COURSE;
}

export async function getEventBySlug(slug: string): Promise<EventRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return {
    ...data,
    course: parseCourse(data.course),
  } as EventRow;
}

export async function getTeamsForEvent(eventId: string): Promise<TeamRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("event_id", eventId)
    .order("name");
  if (error || !data) return [];
  return data.map((t) => ({
    ...t,
    scores: (t.scores ?? {}) as ScoresJson,
    penalties: normalizePenalties(t.penalties),
  }));
}

function normalizePenalties(p: unknown): PenaltiesJson {
  if (p && typeof p === "object" && "p1" in p) {
    const o = p as Record<string, unknown>;
    return {
      p1: Number(o.p1) || 0,
      p2: Number(o.p2) || 0,
      p3: Number(o.p3) || 0,
    };
  }
  return { p1: 0, p2: 0, p3: 0 };
}

export async function getTeamById(teamId: string): Promise<TeamRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    ...data,
    scores: (data.scores ?? {}) as ScoresJson,
    penalties: normalizePenalties(data.penalties),
  };
}

export async function getEventForTeam(team: TeamRow): Promise<EventRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", team.event_id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    ...data,
    course: parseCourse(data.course),
  } as EventRow;
}
