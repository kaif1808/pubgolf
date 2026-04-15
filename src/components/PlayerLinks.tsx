"use client";

import { useEffect, useState } from "react";

type Props = {
  eventSlug: string;
  teamId: string;
  tokens: { p1: string; p2: string; p3: string };
  labels: { p1: string; p2: string; p3: string };
};

function link(origin: string, eventSlug: string, teamId: string, token: string) {
  return `${origin}/e/${eventSlug}/t/${teamId}/p/${token}`;
}

export default function PlayerLinks({ eventSlug, teamId, tokens, labels }: Props) {
  const [msg, setMsg] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function copy(url: string, label: string) {
    try {
      await navigator.clipboard.writeText(url);
      setMsg(`Copied ${label} link`);
      setTimeout(() => setMsg(null), 2000);
    } catch {
      setMsg("Could not copy — select and copy manually");
    }
  }

  const rows = [
    { slot: "p1" as const, token: tokens.p1, label: labels.p1 },
    { slot: "p2" as const, token: tokens.p2, label: labels.p2 },
    { slot: "p3" as const, token: tokens.p3, label: labels.p3 },
  ];

  return (
    <div className="rounded-sm border-2 border-black bg-white p-4 shadow-lg">
      <h2 className="mb-2 font-[family-name:var(--font-playfair)] text-xl font-black">
        Player score links
      </h2>
      <p className="mb-3 text-sm text-pg-gray-700">
        Send each player their own link. They can only edit their column and their penalty count.
      </p>
      {msg ? <p className="mb-2 text-sm text-pg-gray-700">{msg}</p> : null}
      <ul className="space-y-3">
        {rows.map((r) => {
          const url = link(origin, eventSlug, teamId, r.token);
          return (
            <li key={r.slot} className="border-b border-dotted border-pg-grid pb-3">
              <div className="mb-1 text-xs font-bold uppercase tracking-widest">{r.label}</div>
              <div className="break-all font-mono text-xs text-pg-gray-700">{url}</div>
              <button type="button" className="pg-btn mt-2 text-sm" onClick={() => void copy(url, r.label)}>
                Copy link
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
