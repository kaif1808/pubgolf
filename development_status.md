# Development status

## 2026-04-15

- Initialized **Next.js 15** (App Router, TypeScript, Tailwind) in-repo.
- Implemented **Supabase** schema (`events`, `teams`) with public `SELECT` RLS and server-side writes via service role; migration in `supabase/migrations/001_pubgolf.sql`.
- Added **API routes**: create event, add team (organizer key), patch scores (player token).
- Built **UI**: home (create event), event leaderboard + add team, team hub with player links, player score entry with debounced saves and **Supabase Realtime** subscriptions.
- Added **Vitest** tests for scoring helpers (`src/lib/scoring.test.ts`).

### Operational notes

- Run the SQL migration once per Supabase project.
- Enable Realtime on `teams` is included in the migration (`supabase_realtime` publication). If re-running fails on “already member”, skip the `ALTER PUBLICATION` line or remove the table from the publication first.
