"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  eventSlug: string;
};

export default function AddTeamForm({ eventSlug }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [p3, setP3] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventSlug}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          player_1: p1,
          player_2: p2,
          player_3: p3,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Could not add team");
        return;
      }
      setName("");
      setP1("");
      setP2("");
      setP3("");
      router.refresh();
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-sm border-2 border-pg-black bg-pg-white p-4 shadow-lg">
      <h2 className="mb-3 font-[family-name:var(--font-playfair)] text-xl font-black">Add team</h2>
      <p className="mb-3 text-sm text-pg-gray-700">
        Add a team, then open the team page and share each player&apos;s score link with them.
      </p>
      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="pg-label" htmlFor="team-name">
            Team name
          </label>
          <input
            id="team-name"
            className="pg-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="pg-label" htmlFor="p1">
              Player 1
            </label>
            <input id="p1" className="pg-input" value={p1} onChange={(e) => setP1(e.target.value)} required />
          </div>
          <div>
            <label className="pg-label" htmlFor="p2">
              Player 2
            </label>
            <input id="p2" className="pg-input" value={p2} onChange={(e) => setP2(e.target.value)} required />
          </div>
          <div>
            <label className="pg-label" htmlFor="p3">
              Player 3
            </label>
            <input id="p3" className="pg-input" value={p3} onChange={(e) => setP3(e.target.value)} required />
          </div>
        </div>
        {err ? <p className="text-sm text-red-800">{err}</p> : null}
        <button type="submit" className="pg-btn" disabled={loading}>
          {loading ? "Adding…" : "Add team"}
        </button>
      </form>
    </div>
  );
}
