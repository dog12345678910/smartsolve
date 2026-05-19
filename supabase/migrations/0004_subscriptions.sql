create table if not exists subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text,
  plan text,
  current_period_end timestamptz,
  trial_end timestamptz,
  cancel_at_period_end boolean default false,
  updated_at timestamptz default now()
);

create index if not exists subscriptions_customer_idx on subscriptions(stripe_customer_id);

alter table subscriptions enable row level security;

drop policy if exists "users see their own subscription" on subscriptions;
create policy "users see their own subscription" on subscriptions
  for select using (auth.uid() = user_id);
