-- Pending / resolved penalty suggestions between teammates (JSON array on teams row)

alter table public.teams
  add column if not exists penalty_suggestions jsonb not null default '[]'::jsonb;
