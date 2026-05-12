create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  rating text,
  message text not null,
  page text,
  user_agent text,
  created_at timestamptz default now()
);

alter table feedback enable row level security;

drop policy if exists "anyone can submit feedback" on feedback;
create policy "anyone can submit feedback" on feedback
  for insert with check (true);

drop policy if exists "users see their own feedback" on feedback;
create policy "users see their own feedback" on feedback
  for select using (auth.uid() = user_id);
