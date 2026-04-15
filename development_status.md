# Development status

## 2026-04-15

- **Team score UX**: Team hub (`/e/.../t/[teamId]`) uses `TeamHubScorecard` with an in-page “Enter scores as…” control so players can edit the scorecard without opening separate links; `PlayerScorecard` flushes debounced saves on unmount when switching the active player.
- **Tally clarity**: Score table includes **Strokes (raw)** and **Par bonus (−)** total rows before penalties and final (via `ScorecardTotalsRows`); tests document `final === raw − bonus + penalties` and aggregate consistency.
- **Theme**: Tailwind `pg-*` color tokens map to the same `:root` grayscale variables as `pubgolf.html` / `globals.css`; replaced ad hoc hex classes in leaderboard, forms, and links.
- **Penalty suggestions**: Migration `002_penalty_suggestions.sql` adds `teams.penalty_suggestions` (JSONB). API `POST`/`PATCH` on `/api/teams/[teamId]/penalty-suggestions` lets a player propose strokes on a teammate; only the target may accept (adds to their penalty tally) or dismiss. UI lives on `PlayerScorecard` (team hub and per-player pages).
- Initialized **Next.js 15** (App Router, TypeScript, Tailwind) in-repo.
- Implemented **Supabase** schema (`events`, `teams`) with public `SELECT` RLS and server-side writes via service role; migration in `supabase/migrations/001_pubgolf.sql`.
- Added **API routes**: add team (open), patch scores (player token).
- Built **UI**: redirect home to single event, leaderboard + add team, team hub with player links, player score entry with debounced saves and **Supabase Realtime** subscriptions.
- Added **Vitest** tests for scoring helpers (`src/lib/scoring.test.ts`).
- **Production (Vercel)**: Confirmed Supabase env vars are set for Production/Preview/Development. The live app pointed at a Supabase project where `001_pubgolf.sql` had not been applied, which caused `ensureSingleEvent` / PostgREST errors. Ran that migration against the database backing Production’s `NEXT_PUBLIC_SUPABASE_URL` so `public.events` / `public.teams` exist; smoke-tested `https://pubgolf-beta.vercel.app/e/barcelona-pub-golf` (HTTP 200).

## Later

- **Single-event-only, no organizer key** (`src/lib/singleEvent.ts`, `ensureSingleEvent()`): `/` → `/e/barcelona-pub-golf`; only that slug is valid; create-event API removed; add-team requires no secret.

### Operational notes

- Run SQL migrations (`001_pubgolf.sql`, then `002_penalty_suggestions.sql`) once per Supabase project.
- Enable Realtime on `teams` is included in the migration (`supabase_realtime` publication). If re-running fails on “already member”, skip the `ALTER PUBLICATION` line or remove the table from the publication first.
