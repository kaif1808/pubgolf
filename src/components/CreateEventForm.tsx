"use client";

import { useState } from "react";
import Link from "next/link";

const STORAGE_PREFIX = "pubgolf:organizer:";

export default function CreateEventForm() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    slug: string;
    organizerKey: string;
    eventUrl: string;
  } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          ...(slug.trim() ? { slug: slug.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Could not create event");
        return;
      }
      if (typeof window !== "undefined" && data.organizerKey && data.event?.slug) {
        window.sessionStorage.setItem(
          `${STORAGE_PREFIX}${data.event.slug}`,
          data.organizerKey,
        );
      }
      setCreated({
        slug: data.event.slug,
        organizerKey: data.organizerKey,
        eventUrl: data.eventUrl,
      });
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    return (
      <div className="mx-auto max-w-lg rounded-sm border-2 border-black bg-white p-6 shadow-lg">
        <h1 className="mb-2 font-[family-name:var(--font-playfair)] text-2xl font-black">
          Event created
        </h1>
        <p className="mb-4 text-sm text-[#424242]">
          Save your organizer key somewhere safe. It is not shown again.
        </p>
        <div className="mb-3">
          <span className="pg-label">Organizer key</span>
          <pre className="overflow-x-auto border border-black bg-[#f4f4f4] p-2 text-xs">
            {created.organizerKey}
          </pre>
        </div>
        <div className="mb-6 flex flex-wrap gap-2 no-print">
          <Link className="pg-btn" href={created.eventUrl}>
            Open event
          </Link>
          <button
            type="button"
            className="pg-btn"
            onClick={() => {
              void navigator.clipboard.writeText(created.organizerKey);
            }}
          >
            Copy key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg rounded-sm border-2 border-black bg-white p-6 shadow-lg">
      <h1 className="mb-1 font-[family-name:var(--font-playfair)] text-3xl font-black tracking-tight">
        Pub Golf
      </h1>
      <p className="mb-6 text-sm text-[#424242]">
        Create a live event. You will get an organizer key to add teams, plus public links for
        players to enter their own scores.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="pg-label" htmlFor="title">
            Event title
          </label>
          <input
            id="title"
            className="pg-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Barcelona Pub Golf"
          />
        </div>
        <div>
          <label className="pg-label" htmlFor="slug">
            Custom URL slug (optional)
          </label>
          <input
            id="slug"
            className="pg-input"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto-generated if empty"
          />
        </div>
        {err ? <p className="text-sm text-red-800">{err}</p> : null}
        <button type="submit" className="pg-btn" disabled={loading}>
          {loading ? "Creating…" : "Create event"}
        </button>
      </form>
    </div>
  );
}
