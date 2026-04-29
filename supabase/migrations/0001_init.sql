-- Initial schema: per-user bankroll, hand history, and trainer stats.
-- Apply by pasting this file into the Supabase SQL Editor.

-- Bankroll sessions
create table if not exists public.bankroll_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date,
  game text,
  stakes text,
  buyin numeric,
  cashout numeric,
  hours numeric,
  notes text,
  created_at timestamptz default now()
);
alter table public.bankroll_sessions enable row level security;
create policy "users own bankroll_sessions" on public.bankroll_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists bankroll_sessions_user_idx on public.bankroll_sessions (user_id, date desc);

-- Hand history (analyzed hands from Uploads)
create table if not exists public.hand_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hero_cards text,
  hero_position text,
  villain_position text,
  community_cards text,
  grade text,
  ev_lost numeric,
  data jsonb,
  created_at timestamptz default now()
);
alter table public.hand_history enable row level security;
create policy "users own hand_history" on public.hand_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists hand_history_user_idx on public.hand_history (user_id, created_at desc);

-- Trainer stats (one row per user)
create table if not exists public.trainer_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  hands int default 0,
  correct int default 0,
  ev_loss numeric default 0,
  best_streak int default 0,
  log jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);
alter table public.trainer_stats enable row level security;
create policy "users own trainer_stats" on public.trainer_stats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
