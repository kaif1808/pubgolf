"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Course } from "@/lib/course";
import { normalizePenaltySuggestions } from "@/lib/penaltySuggestions";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { TeamRow } from "@/lib/queries";
import { teamAggregateScore } from "@/lib/scoring";

function normalizePenalties(p: unknown): TeamRow["penalties"] {
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

type Props = {
  eventId: string;
  eventSlug: string;
  course: Course;
  initialTeams: TeamRow[];
};

type Row = {
  id: string;
  name: string;
  aggregate: number;
};

function toRows(course: Course, teams: TeamRow[]): Row[] {
  return teams
    .map((t) => ({
      id: t.id,
      name: t.name,
      aggregate: teamAggregateScore(course, t.scores, t.penalties),
    }))
    .sort((a, b) => a.aggregate - b.aggregate);
}

export default function EventLeaderboard({
  eventId,
  eventSlug,
  course,
  initialTeams,
}: Props) {
  const [teams, setTeams] = useState<TeamRow[]>(initialTeams);

  useEffect(() => {
    setTeams(initialTeams);
  }, [initialTeams]);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`event-teams-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" && payload.new) {
            const row = payload.new as Record<string, unknown>;
            const id = String(row.id);
            const normalized: TeamRow = {
              id,
              event_id: String(row.event_id),
              name: String(row.name),
              player_1: String(row.player_1),
              player_2: String(row.player_2),
              player_3: String(row.player_3),
              player_token_1: String(row.player_token_1),
              player_token_2: String(row.player_token_2),
              player_token_3: String(row.player_token_3),
              scores: (row.scores ?? {}) as TeamRow["scores"],
              penalties: normalizePenalties(row.penalties),
              penalty_suggestions: normalizePenaltySuggestions(
                (row as { penalty_suggestions?: unknown }).penalty_suggestions,
              ),
              updated_at: String(row.updated_at ?? new Date().toISOString()),
            };
            setTeams((prev) => {
              if (prev.some((t) => t.id === id)) return prev;
              return [...prev, normalized].sort((a, b) => a.name.localeCompare(b.name));
            });
          }
          if (payload.eventType === "UPDATE" && payload.new) {
            const row = payload.new as Record<string, unknown>;
            const id = String(row.id);
            setTeams((prev) =>
              prev.map((t) =>
                t.id === id
                  ? {
                      ...t,
                      ...row,
                      name: String(row.name ?? t.name),
                      scores: (row.scores ?? t.scores) as TeamRow["scores"],
                      penalties: normalizePenalties(row.penalties ?? t.penalties),
                      penalty_suggestions:
                        (row as { penalty_suggestions?: unknown }).penalty_suggestions !==
                        undefined
                          ? normalizePenaltySuggestions(
                              (row as { penalty_suggestions?: unknown }).penalty_suggestions,
                            )
                          : t.penalty_suggestions,
                      updated_at: String(row.updated_at ?? t.updated_at),
                    }
                  : t,
              ),
            );
          }
          if (payload.eventType === "DELETE" && payload.old) {
            const id = (payload.old as { id?: string }).id;
            if (id) setTeams((prev) => prev.filter((t) => t.id !== id));
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [eventId]);

  const rows = useMemo(() => toRows(course, teams), [course, teams]);

  return (
    <div className="rounded-sm border-2 border-pg-black bg-pg-white p-4 shadow-lg">
      <h2 className="mb-3 font-[family-name:var(--font-playfair)] text-xl font-black">
        Leaderboard
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-pg-gray-700">No teams yet. Add one below.</p>
      ) : (
        <ol className="space-y-2">
          {rows.map((r, i) => (
            <li
              key={r.id}
              className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dotted border-pg-grid pb-2"
            >
              <span className="text-sm text-pg-gray-700">
                {i + 1}.{" "}
                <Link
                  className="font-semibold text-pg-accent underline decoration-pg-accent-muted underline-offset-2 hover:text-pg-accent-hover"
                  href={`/e/${eventSlug}/t/${r.id}`}
                >
                  {r.name}
                </Link>
              </span>
              <span className="font-[family-name:var(--font-playfair)] text-lg font-bold">{r.aggregate}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
