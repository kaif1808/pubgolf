# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server with Turbopack on localhost:3000
npm run build    # Production build
npm run lint     # ESLint
npm run test     # Vitest (scoring helpers)
```

## Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Optional:

```
NEXT_PUBLIC_EVENT_SLUG=   # default: barcelona-pub-golf
PUBGOLF_TEAMS_CLEAR_SECRET=   # long random string; enables POST /api/admin/clear-teams (Bearer). Unset after use.
```

## Architecture

**Pub Golf** is a real-time scorecard for a **single** Barcelona course deployment. The app hosts one logical event; `/` redirects to `/e/{SINGLE_EVENT_SLUG}`. `ensureSingleEvent()` in `src/lib/queries.ts` inserts the lone `events` row on first visit (course JSON + dummy `organizer_key_hash` `"unused"` — column kept for legacy schema; no organizer auth).

### Data model (`supabase/migrations/001_pubgolf.sql`)

- `events` — effectively one row; holds the course definition as `jsonb`.
- `teams` — belongs to the event; stores `scores` (JSONB, holes `"1"`–`"9"`, `{p1,p2,p3}`) and `penalties`. Each player has a UUID token (`player_token_1/2/3`) for PATCH scoping.
- RLS: public SELECT for anon (leaderboard + Realtime); mutations via Next.js + service role.
- `teams` is in `supabase_realtime` with `replica identity full`.

### API routes (`src/app/api/`)

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/events/[slug]/teams` | POST | none (open add-team; slug must match `SINGLE_EVENT_SLUG`) | Add team |
| `/api/teams/[teamId]/scores` | PATCH | `playerToken` in body | Player updates their column |
| `/api/admin/clear-teams` | POST | `Authorization: Bearer` + `PUBGOLF_TEAMS_CLEAR_SECRET` | Delete all teams (same DB as deployment; remove secret after use) |

### Scoring logic (`src/lib/scoring.ts`)

- Per-hole: raw strokes; **−1 bonus** per hole if strokes ≤ par.
- Team aggregate = sum of three players’ finals (raw − bonus + penalties).
- `mergePlayerHoleScores` (`src/lib/mergeScores.ts`) merges one slot only.

### Auth model

- **Player token**: UUID on the team row; PATCH identifies `p1`/`p2`/`p3`. No organizer key.

### Config (`src/lib/singleEvent.ts`)

- `SINGLE_EVENT_SLUG`, `SINGLE_EVENT_TITLE`, `isAllowedEventSlug()`.

### Supabase clients

- `src/lib/supabase/admin.ts` — service role, server-only.
- `src/lib/supabase/browser.ts` — anon client for Realtime.

### Course definition (`src/lib/course.ts`)

`DEFAULT_BARCELONA_COURSE` is inserted by `ensureSingleEvent()`. `parseCourse` in `queries.ts` falls back if DB JSON is malformed.
