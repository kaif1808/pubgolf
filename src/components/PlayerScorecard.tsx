"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Course } from "@/lib/course";
import {
  normalizePenaltySuggestions,
  type PenaltySuggestion,
} from "@/lib/penaltySuggestions";
import type { TeamRow } from "@/lib/queries";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import {
  playerStrokeTotalWithPenalties,
  type PlayerSlot,
  type ScoresJson,
} from "@/lib/scoring";
import ScorecardTotalsRows from "@/components/ScorecardTotalsRows";

type Props = {
  course: Course;
  team: TeamRow;
  eventSlug: string;
  playerToken: string;
  slot: PlayerSlot;
  /** When false, hide the top “Editing as …” bar (e.g. team hub has its own slot control). */
  showEditingBanner?: boolean;
};

const DEBOUNCE_MS = 450;

function labelForTeamSlot(team: TeamRow, s: PlayerSlot): string {
  if (s === "p1") return team.player_1;
  if (s === "p2") return team.player_2;
  return team.player_3;
}

export default function PlayerScorecard({
  course,
  team,
  eventSlug,
  playerToken,
  slot,
  showEditingBanner = true,
}: Props) {
  const [scores, setScores] = useState<ScoresJson>(team.scores);
  const [penalties, setPenalties] = useState(team.penalties);
  const [suggestions, setSuggestions] = useState<PenaltySuggestion[]>(
    team.penalty_suggestions,
  );
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [suggestErr, setSuggestErr] = useState<string | null>(null);
  const [suggestNote, setSuggestNote] = useState("");
  const [suggestStrokes, setSuggestStrokes] = useState(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoresRef = useRef(scores);
  const penaltiesRef = useRef(penalties);
  const mounted = useRef(true);
  const flushRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);

  useEffect(() => {
    penaltiesRef.current = penalties;
  }, [penalties]);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const p1 = playerStrokeTotalWithPenalties(course, scores, "p1", penalties);
  const p2 = playerStrokeTotalWithPenalties(course, scores, "p2", penalties);
  const p3 = playerStrokeTotalWithPenalties(course, scores, "p3", penalties);

  const flush = useCallback(async () => {
    if (!mounted.current) return;
    setStatus("saving");
    setErr(null);
    const s = scoresRef.current;
    const p = penaltiesRef.current;
    try {
      const holes: Record<string, number | null> = {};
      for (const h of course.holes) {
        const k = String(h.hole);
        const v = s[k]?.[slot];
        if (v === undefined || v === null) holes[k] = null;
        else holes[k] = v;
      }
      const res = await fetch(`/api/teams/${team.id}/scores`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerToken,
          holes,
          penalties: p[slot],
        }),
      });
      const data = await res.json();
      if (!mounted.current) return;
      if (!res.ok) {
        setStatus("error");
        setErr(typeof data.error === "string" ? data.error : "Save failed");
        return;
      }
      setStatus("idle");
      if (data.team?.scores) setScores(data.team.scores as ScoresJson);
      if (data.team?.penalties) setPenalties(data.team.penalties);
      if (data.team?.penalty_suggestions !== undefined) {
        setSuggestions(normalizePenaltySuggestions(data.team.penalty_suggestions));
      }
    } catch {
      if (!mounted.current) return;
      setStatus("error");
      setErr("Network error");
    }
  }, [course.holes, playerToken, slot, team.id]);

  flushRef.current = flush;

  const scheduleSave = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void flushRef.current();
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      void flushRef.current();
    };
  }, []);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`team-${team.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "teams",
          filter: `id=eq.${team.id}`,
        },
        (payload) => {
          const next = payload.new as {
            scores?: ScoresJson;
            penalties?: TeamRow["penalties"];
            penalty_suggestions?: unknown;
          };
          if (next.scores) setScores(next.scores);
          if (next.penalties) setPenalties(next.penalties);
          if (next.penalty_suggestions !== undefined) {
            setSuggestions(normalizePenaltySuggestions(next.penalty_suggestions));
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [team.id]);

  const labelForSlot = useMemo(() => labelForTeamSlot(team, slot), [slot, team]);

  const otherSlots = useMemo((): PlayerSlot[] => {
    return (["p1", "p2", "p3"] as const).filter((s) => s !== slot);
  }, [slot]);

  const incoming = useMemo(
    () => suggestions.filter((s) => s.status === "pending" && s.toSlot === slot),
    [suggestions, slot],
  );

  const outgoing = useMemo(
    () => suggestions.filter((s) => s.status === "pending" && s.fromSlot === slot),
    [suggestions, slot],
  );

  async function postSuggestion(toSlot: PlayerSlot) {
    setSuggestErr(null);
    try {
      const res = await fetch(`/api/teams/${team.id}/penalty-suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerToken,
          toSlot,
          strokes: suggestStrokes,
          note: suggestNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSuggestErr(typeof data.error === "string" ? data.error : "Could not send");
        return;
      }
      if (data.team?.penalty_suggestions !== undefined) {
        setSuggestions(normalizePenaltySuggestions(data.team.penalty_suggestions));
      }
      setSuggestNote("");
    } catch {
      setSuggestErr("Network error");
    }
  }

  async function resolveSuggestion(suggestionId: string, action: "accept" | "dismiss") {
    setSuggestErr(null);
    try {
      const res = await fetch(`/api/teams/${team.id}/penalty-suggestions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerToken, suggestionId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSuggestErr(typeof data.error === "string" ? data.error : "Could not update");
        return;
      }
      if (data.team?.scores) setScores(data.team.scores as ScoresJson);
      if (data.team?.penalties) setPenalties(data.team.penalties);
      if (data.team?.penalty_suggestions !== undefined) {
        setSuggestions(normalizePenaltySuggestions(data.team.penalty_suggestions));
      }
    } catch {
      setSuggestErr("Network error");
    }
  }

  function setHole(hole: number, value: string) {
    const key = String(hole);
    const n = value === "" ? null : Math.max(0, Math.min(99, Number.parseInt(value, 10)));
    setScores((prev) => {
      const row = { ...(prev[key] ?? {}) };
      if (n === null || Number.isNaN(n as number)) {
        delete row[slot];
      } else {
        row[slot] = n;
      }
      const next = { ...prev };
      if (Object.keys(row).length === 0) delete next[key];
      else next[key] = row;
      scoresRef.current = next;
      return next;
    });
    scheduleSave();
  }

  function setPenaltyValue(value: string) {
    const n = Math.max(0, Math.min(999, Number.parseInt(value || "0", 10)));
    setPenalties((prev) => {
      const next = { ...prev, [slot]: Number.isNaN(n) ? 0 : n };
      penaltiesRef.current = next;
      return next;
    });
    scheduleSave();
  }

  return (
    <div className="pg-card">
      {showEditingBanner ? (
        <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-pg-black pb-2">
          <p className="text-sm text-pg-gray-700">
            Editing as <strong>{labelForSlot}</strong> · Event{" "}
            <a
              className="text-pg-accent underline decoration-pg-accent-muted underline-offset-2 hover:text-pg-accent-hover"
              href={`/e/${eventSlug}`}
            >
              {eventSlug}
            </a>
          </p>
          <span className="text-xs uppercase tracking-widest text-pg-gray-700">
            {status === "saving" ? "Saving…" : status === "error" ? "Save issue" : "Saved"}
          </span>
        </div>
      ) : (
        <div className="no-print mb-3 flex flex-wrap items-center justify-end gap-2 border-b border-pg-black pb-2">
          <span className="text-xs uppercase tracking-widest text-pg-gray-700">
            {status === "saving" ? "Saving…" : status === "error" ? "Save issue" : "Saved"}
          </span>
        </div>
      )}
      {err ? <p className="no-print mb-2 text-sm text-red-800">{err}</p> : null}

      <header className="pg-header">
        <h1 className="pg-title">{course.meta.title}</h1>
        <div className="pg-subtitle">{course.meta.subtitle}</div>
        <div className="pg-course-meta">
          <span>
            Course Par · <strong>{course.meta.coursePar}</strong>
          </span>
          <span>
            Holes · <strong>{course.meta.holesCount}</strong>
          </span>
          <span>
            Distance · <strong>{course.meta.distance}</strong>
          </span>
        </div>
      </header>

      <div className="pg-team">
        <div className="pg-team-field">
          <label>Team Name</label>
          <div className="pg-line flex items-end text-[10.5pt] font-semibold leading-tight">
            {team.name}
          </div>
        </div>
        <div className="pg-team-field">
          <label>Player 1</label>
          <div className="pg-line flex items-end text-[10.5pt] font-semibold leading-tight">
            {team.player_1}
          </div>
        </div>
        <div className="pg-team-field">
          <label>Player 2</label>
          <div className="pg-line flex items-end text-[10.5pt] font-semibold leading-tight">
            {team.player_2}
          </div>
        </div>
        <div className="pg-team-field">
          <label>Player 3</label>
          <div className="pg-line flex items-end text-[10.5pt] font-semibold leading-tight">
            {team.player_3}
          </div>
        </div>
      </div>

      <div className="pg-table-wrap">
        <table className="pg-table">
          <thead>
            <tr>
              <th>#</th>
              <th className="pg-bar">Bar &amp; Local Rule</th>
              <th>Par Drink</th>
              <th>Par</th>
              <th>P1</th>
              <th>P2</th>
              <th>P3</th>
            </tr>
          </thead>
          <tbody>
            {course.holes.map((h) => {
              const key = String(h.hole);
              const row = scores[key] ?? {};
              return (
                <tr key={h.hole}>
                  <td className="pg-td-hole">{h.hole}</td>
                  <td className="pg-td-bar">
                    <div className="pg-bar-name">{h.barName}</div>
                    <div className="pg-rule">{h.rule}</div>
                  </td>
                  <td className="pg-td-drink">{h.drink}</td>
                  <td className="pg-td-par">{h.par}</td>
                  {(["p1", "p2", "p3"] as const).map((s) => (
                    <td key={s} className="pg-td-player">
                      {s === slot ? (
                        <input
                          aria-label={`Strokes hole ${h.hole}`}
                          className="w-full bg-transparent text-center font-[family-name:var(--font-playfair)] text-[12pt] font-bold outline-none"
                          inputMode="numeric"
                          value={row[s] ?? ""}
                          onChange={(e) => setHole(h.hole, e.target.value)}
                        />
                      ) : (
                        <span className="block text-center font-[family-name:var(--font-playfair)] text-[12pt] font-bold">
                          {row[s] ?? ""}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}

            <tr className="pg-total">
              <td colSpan={3} className="pg-label">
                Course Total
              </td>
              <td className="pg-par-total">{course.meta.coursePar}</td>
              <td>—</td>
              <td>—</td>
              <td>—</td>
            </tr>
            <ScorecardTotalsRows p1={p1} p2={p2} p3={p3} />
            <tr className="pg-total">
              <td colSpan={3} className="pg-label">
                + Penalties
              </td>
              <td>—</td>
              {(["p1", "p2", "p3"] as const).map((s) => (
                <td key={s}>
                  {s === slot ? (
                    <input
                      aria-label="Penalty strokes"
                      className="w-full bg-transparent text-center font-[family-name:var(--font-playfair)] text-[11pt] font-bold outline-none"
                      inputMode="numeric"
                      value={penalties[s]}
                      onChange={(e) => setPenaltyValue(e.target.value)}
                    />
                  ) : (
                    <span className="block text-center font-[family-name:var(--font-playfair)] text-[11pt] font-bold">
                      {penalties[s]}
                    </span>
                  )}
                </td>
              ))}
            </tr>
            <tr className="pg-total">
              <td colSpan={3} className="pg-label">
                FINAL SCORE
              </td>
              <td>—</td>
              <td>{p1.final}</td>
              <td>{p2.final}</td>
              <td>{p3.final}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="no-print mt-4 space-y-3 rounded-sm border border-pg-grid bg-pg-white p-3">
        <h3 className="font-[family-name:var(--font-playfair)] text-sm font-black uppercase tracking-widest">
          Penalty suggestions
        </h3>
        {suggestErr ? <p className="text-sm text-red-800">{suggestErr}</p> : null}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="pg-label" htmlFor="sug-strokes">
              Strokes
            </label>
            <input
              id="sug-strokes"
              className="pg-input w-20"
              inputMode="numeric"
              min={1}
              max={99}
              value={suggestStrokes}
              onChange={(e) =>
                setSuggestStrokes(Math.max(1, Math.min(99, Number(e.target.value) || 1)))
              }
            />
          </div>
          <div className="min-w-[12rem] flex-1">
            <label className="pg-label" htmlFor="sug-note">
              Note (optional)
            </label>
            <input
              id="sug-note"
              className="pg-input"
              value={suggestNote}
              onChange={(e) => setSuggestNote(e.target.value)}
              placeholder="Rule breach, etc."
              maxLength={200}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {otherSlots.map((s) => (
            <button
              key={s}
              type="button"
              className="pg-btn text-sm"
              onClick={() => void postSuggestion(s)}
            >
              Suggest to {labelForTeamSlot(team, s)}
            </button>
          ))}
        </div>
        {incoming.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-pg-gray-700">
              For you to accept or dismiss
            </p>
            <ul className="space-y-2">
              {incoming.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-dotted border-pg-grid pb-2 text-sm"
                >
                  <span>
                    From <strong>{labelForTeamSlot(team, s.fromSlot)}</strong>: +{s.strokes}{" "}
                    {s.note ? <span className="text-pg-gray-700">({s.note})</span> : null}
                  </span>
                  <span className="flex gap-2">
                    <button
                      type="button"
                      className="pg-btn text-xs"
                      onClick={() => void resolveSuggestion(s.id, "accept")}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="pg-btn text-xs"
                      onClick={() => void resolveSuggestion(s.id, "dismiss")}
                    >
                      Dismiss
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {outgoing.length > 0 ? (
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-pg-gray-700">
              Waiting on them
            </p>
            <ul className="text-sm text-pg-gray-700">
              {outgoing.map((s) => (
                <li key={s.id}>
                  Pending +{s.strokes} for {labelForTeamSlot(team, s.toSlot)}
                  {s.note ? ` (${s.note})` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <footer className="pg-footer">
        <div className="pg-panel">
          <h3>How to Score</h3>
          <ul>
            <li>
              <strong>1 stroke = 1 gulp.</strong> Lower is better. Finish drink in par or fewer =
              bonus −1.
            </li>
            <li>
              <strong>Each rule breach = +1 stroke penalty.</strong> Caller must witness it.
            </li>
            <li>
              <strong>Refusing a hole = +5.</strong> Substituting drink type without group vote =
              +3.
            </li>
            <li>
              <strong>Lowest aggregate team score wins a loaf of Grace&apos;s focaccia.</strong>
            </li>
          </ul>
        </div>
        <div className="pg-panel">
          <h3>Penalty Tally</h3>
          <p className="text-[8.5pt] leading-relaxed">
            P1: {penalties.p1} · P2: {penalties.p2} · P3: {penalties.p3}
          </p>
          <div className="mt-2 text-center text-[8pt] text-pg-gray-700">
            Team aggregate: {p1.final + p2.final + p3.final}
          </div>
        </div>
      </footer>
    </div>
  );
}
