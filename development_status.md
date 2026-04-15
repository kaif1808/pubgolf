# Development status

## 2026-04-15

- Initialized **Next.js 15** (App Router, TypeScript, Tailwind) in-repo.
- Implemented **Supabase** schema (`events`, `teams`) with public `SELECT` RLS and server-side writes via service role; migration in `supabase/migrations/001_pubgolf.sql`.
- Added **API routes**: add team (open), patch scores (player token).
- Built **UI**: redirect home to single event, leaderboard + add team, team hub with player links, player score entry with debounced saves and **Supabase Realtime** subscriptions.
- Added **Vitest** tests for scoring helpers (`src/lib/scoring.test.ts`).
- **Production (Vercel)**: Confirmed Supabase env vars are set for Production/Preview/Development. The live app pointed at a Supabase project where `001_pubgolf.sql` had not been applied, which caused `ensureSingleEvent` / PostgREST errors. Ran that migration against the database backing Production’s `NEXT_PUBLIC_SUPABASE_URL` so `public.events` / `public.teams` exist; smoke-tested `https://pubgolf-beta.vercel.app/e/barcelona-pub-golf` (HTTP 200).

## Later

- **Single-event-only, no organizer key** (`src/lib/singleEvent.ts`, `ensureSingleEvent()`): `/` → `/e/barcelona-pub-golf`; only that slug is valid; create-event API removed; add-team requires no secret.

### Operational notes

- Run the SQL migration once per Supabase project.
- Enable Realtime on `teams` is included in the migration (`supabase_realtime` publication). If re-running fails on “already member”, skip the `ALTER PUBLICATION` line or remove the table from the publication first.
