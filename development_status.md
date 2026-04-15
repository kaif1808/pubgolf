# Development status

## 2026-04-15

- **Vercel / production DB clear**: Optional env `PUBGOLF_TEAMS_CLEAR_SECRET` (24+ chars) enables `POST /api/admin/clear-teams` with `Authorization: Bearer <secret>` — uses the same `SUPABASE_SERVICE_ROLE_KEY` as the deployment so teams are removed from the **live** project. Unset the secret after use.
- **Score table totals + data**: Summary rows (`tr.pg-total`) use a sticky first cell (`colSpan` over # / bar / drink) in [`globals.css`](src/app/globals.css) so Par and P1–P3 stay aligned with hole rows when scrolling horizontally on narrow viewports; [`pubgolf.html`](pubgolf.html) mirrors the rule. **Course Total** row shows `—` in P1–P3 for consistency. All rows in `public.teams` were cleared via `DELETE FROM public.teams` (player links from deleted teams are invalid; add teams again for new tokens).
- **Warm theme + mobile**: `:root` in [`globals.css`](src/app/globals.css) uses a warm pub palette (cream paper, forest ink, terracotta `--accent`); Tailwind adds `pg-accent` / `pg-accent-muted` / `pg-accent-hover`. [`layout.tsx`](src/app/layout.tsx) exports `viewport` with `viewportFit: cover` for safe areas; `.pg-shell` uses `env(safe-area-inset-*)`; narrow screens get tighter `.pg-card` padding, 44px min touch targets, and 16px score inputs to avoid iOS zoom. Score table has a sticky first column (`#` / hole). Links and team slot picker use accent styling; [`pubgolf.html`](pubgolf.html) `:root` matches the app.
- **Supabase `penalty_suggestions`**: If PostgREST reports a missing `penalty_suggestions` column, run [`002_penalty_suggestions.sql`](supabase/migrations/002_penalty_suggestions.sql) in the SQL editor for the **same** project as `NEXT_PUBLIC_SUPABASE_URL`. If the schema cache lags, run `NOTIFY pgrst, 'reload schema';` there (or wait a minute).
- **Scorecard totals**: Table includes **After par bonus** (`raw − bonus`) between par bonus and penalties; par bonus cells show `0` instead of `−0` when there is no bonus.
- **Theme**: Shell cards and links use `border-pg-black` / `bg-pg-white` / `text-pg-black` instead of default Tailwind `black`/`white`.
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
