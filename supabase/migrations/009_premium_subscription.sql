-- Premium subscription metadata (payment provider wired later)

alter table public.profiles
  add column if not exists subscription_status text default 'free',
  add column if not exists payment_provider text,
  add column if not exists premium_started_at timestamptz;

comment on column public.profiles.subscription_status is
  'free | active | canceled | past_due';
comment on column public.profiles.payment_provider is
  'korea | stripe — set when checkout completes';
