create table if not exists trainer_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz,
  ended_at timestamptz,
  duration_ms bigint,
  hands int default 0,
  correct int default 0,
  accuracy_pct int default 0,
  best_streak int default 0,
  ev_loss numeric default 0,
  mode text,
  positions jsonb,
  log jsonb,
  created_at timestamptz default now()
);

alter table trainer_sessions enable row level security;

drop policy if exists "users own trainer_sessions" on trainer_sessions;
create policy "users own trainer_sessions" on trainer_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists trainer_sessions_user_idx
  on trainer_sessions (user_id, created_at desc);
