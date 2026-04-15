# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server with Turbopack on localhost:3000
npm run build    # Production build
npm run lint     # ESLint
npx vitest       # Run tests
npx vitest run src/lib/scoring.ts   # Run a single test file
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ORGANIZER_PEPPER=        # optional; falls back to SERVICE_ROLE_KEY then a dev default
```

## Architecture

**Pub Golf** is a real-time scorecard app for pub crawl events. Each event has a 9-hole "course" (one bar per hole), teams of 3 players, and a live leaderboard via Supabase Realtime.

### Data model (`supabase/migrations/001_pubgolf.sql`)

- `events` — one row per pub golf event; holds the entire course definition as a `jsonb` column, plus an `organizer_key_hash` for gating write operations.
- `teams` — belongs to an event; stores `scores` (JSONB, keyed by hole number string `"1"`–`"9"`, each containing per-player strokes `{p1,p2,p3}`) and `penalties` (`{p1,p2,p3}` integers). Each player gets a UUID token (`player_token_1/2/3`) for authentication.
- RLS: public SELECT for anon (leaderboard + Realtime); all mutations go through Next.js API routes using the service-role key.
- `teams` is added to `supabase_realtime` with `replica identity full` for live updates.

### API routes (`src/app/api/`)

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/events` | POST | none | Create event; returns `organizerKey` (plaintext, shown once) |
| `/api/events/[slug]/teams` | POST | `x-organizer-key` header | Add team to event |
| `/api/teams/[teamId]/scores` | PATCH | `playerToken` in body | Player submits/updates their hole scores and penalties |

### Scoring logic (`src/lib/scoring.ts`)

- Each player's score per hole: raw strokes + **−1 bonus** if strokes ≤ par (incentivises drinking faster).
- Team aggregate = sum of all three players' `final` scores (raw − bonus + penalties).
- `mergePlayerHoleScores` (`src/lib/mergeScores.ts`) does a non-destructive merge so one player's patch never overwrites another player's scores.

### Auth model

- **Organizer key**: random 48-char hex, SHA-256 hashed with a pepper before storage. Timing-safe comparison in `src/lib/hash.ts`. Organizers use this key to manage their event (add teams, etc.).
- **Player token**: UUID stored on the team row. Passed in PATCH requests to identify which player slot (`p1`/`p2`/`p3`) is submitting scores.

### Supabase clients

- `src/lib/supabase/admin.ts` — service-role client, used server-side only (`import "server-only"` in `queries.ts`).
- `src/lib/supabase/browser.ts` — anon client for client-side Realtime subscriptions.

### Course definition (`src/lib/course.ts`)

The `Course` type (id, meta, holes array) is stored as JSONB in the `events` table. `DEFAULT_BARCELONA_COURSE` is the hardcoded 9-hole Barcelona course used when creating new events. `parseCourse` in `queries.ts` falls back to this default if the DB value is malformed.
