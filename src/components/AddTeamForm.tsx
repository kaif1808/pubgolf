"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_PREFIX = "pubgolf:organizer:";

type Props = {
  eventSlug: string;
};

export default function AddTeamForm({ eventSlug }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [p3, setP3] = useState("");
  const [organizerKey, setOrganizerKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function loadKeyFromStorage() {
    if (typeof window === "undefined") return;
    const k = window.sessionStorage.getItem(`${STORAGE_PREFIX}${eventSlug}`);
    if (k) setOrganizerKey(k);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const key =
        organizerKey || (typeof window !== "undefined"
          ? window.sessionStorage.getItem(`${STORAGE_PREFIX}${eventSlug}`) ?? ""
          : "");
      const res = await fetch(`/api/events/${eventSlug}/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(key ? { "X-Organizer-Key": key } : {}),
        },
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
    <div className="rounded-sm border-2 border-black bg-white p-4 shadow-lg">
      <h2 className="mb-3 font-[family-name:var(--font-playfair)] text-xl font-black">Add team</h2>
      <p className="mb-3 text-sm text-[#424242]">
        Requires organizer key (paste below or{" "}
        <button
          type="button"
          className="underline"
          onClick={() => {
            loadKeyFromStorage();
          }}
        >
          load from this browser
        </button>
        if you created the event here).
      </p>
      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="pg-label" htmlFor="org-key">
            Organizer key
          </label>
          <input
            id="org-key"
            className="pg-input font-mono text-sm"
            value={organizerKey}
            onChange={(e) => setOrganizerKey(e.target.value)}
            placeholder="Paste organizer key"
            autoComplete="off"
          />
        </div>
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
