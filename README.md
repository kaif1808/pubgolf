# Pub Golf — live scorecard

Next.js app for multi-team pub golf: live leaderboard, team hubs, and per-player score links (each player edits only their own column). Data lives in **Supabase**; realtime updates use Supabase Realtime on the `teams` table.

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

4. Open [http://localhost:3000](http://localhost:3000), create an event, and save the **organizer key** (also stored in `sessionStorage` for that browser).

## Deploy on Vercel

1. Push this repo to GitHub and import the project in Vercel.
2. Add the same three env vars in the Vercel project (Production + Preview as needed).
3. Deploy. Optionally set `ORGANIZER_PEPPER` to a long random string so organizer key hashes are not tied to the service role.

## User flow

- **Organizer**: creates an event → receives an **organizer key** (shown once) → opens the event URL → adds teams (requires organizer key) → shares **player links** from each team hub.
- **Players**: open their personal link → enter strokes and penalties for their column only; other devices update via realtime.

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Development server       |
| `npm run build`| Production build         |
| `npm run test` | Vitest (scoring helpers) |
