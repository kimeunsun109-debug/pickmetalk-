-- Stripe subscription fields on profiles (beta monetization)
alter table public.profiles
  add column if not exists subscription_status text default 'free',
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists premium_started_at timestamptz;

comment on column public.profiles.subscription_status is
  'free | active | canceled | past_due';
comment on column public.profiles.is_premium is
  'true when subscription_status=active (Stripe webhook)';
