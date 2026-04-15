-- Pub Golf: events + teams with public read for leaderboard / realtime

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  organizer_key_hash text not null,
  course jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  player_1 text not null,
  player_2 text not null,
  player_3 text not null,
  player_token_1 uuid not null default gen_random_uuid(),
  player_token_2 uuid not null default gen_random_uuid(),
  player_token_3 uuid not null default gen_random_uuid(),
  scores jsonb not null default '{}'::jsonb,
  penalties jsonb not null default '{"p1":0,"p2":0,"p3":0}'::jsonb,
  updated_at timestamptz not null default now()
);

create unique index if not exists teams_player_token_1_key on public.teams (player_token_1);
create unique index if not exists teams_player_token_2_key on public.teams (player_token_2);
create unique index if not exists teams_player_token_3_key on public.teams (player_token_3);
create index if not exists teams_event_id_idx on public.teams (event_id);

alter table public.events enable row level security;
alter table public.teams enable row level security;

-- Public read for anon (leaderboard + scorecards + Realtime)
drop policy if exists "events_select_public" on public.events;
create policy "events_select_public" on public.events
  for select using (true);

drop policy if exists "teams_select_public" on public.teams;
create policy "teams_select_public" on public.teams
  for select using (true);

-- No direct writes for anon — mutations go through Next.js + service role

alter table public.teams replica identity full;

alter publication supabase_realtime add table public.teams;
