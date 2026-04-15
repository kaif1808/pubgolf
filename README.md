# Pub Golf — live scorecard

Single-deployment **Barcelona Pub Golf** app: live leaderboard, team hubs, and per-player score links (each player edits only their own column). Data lives in **Supabase**; realtime updates use Supabase Realtime on the `teams` table.

The only event URL is `/e/barcelona-pub-golf` (override with `NEXT_PUBLIC_EVENT_SLUG`). `/` redirects there. There is **no organizer key**—anyone can add a team; player links still gate per-column edits.

## Local setup

1. Create a Supabase project and run the SQL in [`supabase/migrations/001_pubgolf.sql`](supabase/migrations/001_pubgolf.sql) (SQL Editor → New query → Run).

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from **Project Settings → API**.

3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) — you are redirected to the leaderboard. The first load **creates** the single event row if it is missing.

## Deploy on Vercel

1. Push this repo to GitHub and import the project in Vercel.
2. Add the three Supabase env vars (Production + Preview as needed).
3. Deploy. Optionally set `NEXT_PUBLIC_EVENT_SLUG` if you want a different path segment than `barcelona-pub-golf`.

## User flow

- Open the event page → **Add team** (team name + three player names) → open the team hub → copy **player links** for P1–P3.
- **Players** open their personal link → enter strokes and penalties for their column only; other devices update via realtime.

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Development server       |
| `npm run build`| Production build         |
| `npm run test` | Vitest (scoring helpers) |
