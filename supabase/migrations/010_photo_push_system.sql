-- Natural photo push system (scheduler, analytics, follow-ups)
-- OS push delivery (Web Push/FCM) wired separately; in-app + DB scheduling first.

-- ── User preferences ─────────────────────────────────────────
create table if not exists public.photo_push_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  enabled boolean not null default true,
  timezone text not null default 'Asia/Seoul',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Photo asset catalog (metadata; bulk import ~1000/character later) ──
create table if not exists public.character_photo_assets (
  id uuid primary key default gen_random_uuid(),
  character_id text not null,
  scenario_id text not null,
  storage_path text not null,
  tags text[] not null default '{}',
  emotion text,
  min_affection int not null default 0,
  min_level int not null default 1,
  is_premium boolean not null default false,
  season text,
  time_of_day text,
  hash_fingerprint text,
  created_at timestamptz not null default now()
);

create index if not exists idx_character_photo_assets_lookup
  on public.character_photo_assets (character_id, scenario_id);

-- ── Engagement aggregate (frequency tuning) ────────────────────
create table if not exists public.photo_push_engagement (
  user_id uuid not null references public.profiles(id) on delete cascade,
  character_id text not null,
  engagement_score numeric(5,2) not null default 50,
  sends_last_7d int not null default 0,
  clicks_last_7d int not null default 0,
  replies_last_7d int not null default 0,
  optimal_hours int[] default '{}',
  optimal_weekdays int[] default '{}',
  last_computed_at timestamptz,
  cooldown_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, character_id)
);

-- ── Daily plan (0–2 sends, skip days, special bonus) ───────────
create table if not exists public.photo_push_daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  character_id text not null,
  plan_day date not null,
  timezone text not null default 'Asia/Seoul',
  is_skip_day boolean not null default false,
  planned_count int not null default 0,
  special_bonus int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, character_id, plan_day)
);

-- ── Scheduled slot (random time within day) ────────────────────
create table if not exists public.photo_push_scheduled (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  character_id text not null,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  plan_id uuid references public.photo_push_daily_plans(id) on delete set null,
  scheduled_at timestamptz not null,
  scenario_id text not null,
  asset_id uuid references public.character_photo_assets(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'delivered', 'canceled')),
  is_special_day boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_photo_push_scheduled_due
  on public.photo_push_scheduled (status, scheduled_at)
  where status = 'pending';

-- ── Delivery log + analytics ───────────────────────────────────
create table if not exists public.photo_push_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  character_id text not null,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  message_id uuid references public.messages(id) on delete set null,
  scheduled_id uuid references public.photo_push_scheduled(id) on delete set null,
  scenario_id text not null,
  asset_id uuid references public.character_photo_assets(id) on delete set null,
  caption text not null,
  media_url text not null,
  sent_at timestamptz not null default now(),
  push_clicked_at timestamptz,
  photo_viewed_at timestamptz,
  replied_at timestamptz,
  reply_latency_sec int,
  conversation_started boolean default false,
  conversation_length int,
  revisited_at timestamptz,
  metadata jsonb not null default '{}'
);

create index if not exists idx_photo_push_deliveries_user
  on public.photo_push_deliveries (user_id, character_id, sent_at desc);

-- ── Follow-up chain (no-reply scenarios) ───────────────────────
create table if not exists public.photo_push_followups (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.photo_push_deliveries(id) on delete cascade,
  stage int not null default 1,
  due_at timestamptz not null,
  message text not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'canceled')),
  sent_message_id uuid references public.messages(id) on delete set null,
  sent_at timestamptz,
  unique (delivery_id, stage)
);

create index if not exists idx_photo_push_followups_due
  on public.photo_push_followups (status, due_at)
  where status = 'pending';

-- ── Future: Web Push subscriptions ─────────────────────────────
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('web', 'android', 'ios')),
  endpoint text not null,
  keys jsonb,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  unique (user_id, endpoint)
);

-- ── Messages: photo attachment ───────────────────────────────
alter table public.messages
  add column if not exists media_type text,
  add column if not exists media_url text,
  add column if not exists photo_delivery_id uuid
    references public.photo_push_deliveries(id) on delete set null;

comment on table public.photo_push_deliveries is
  'Photo push analytics: CTR, reply rate, retention, skip-day effect';

-- RLS: users read own deliveries; writes via service role / API
alter table public.photo_push_preferences enable row level security;
alter table public.photo_push_engagement enable row level security;
alter table public.photo_push_deliveries enable row level security;

create policy "photo_push_prefs_own" on public.photo_push_preferences
  for all using (auth.uid() = user_id);

create policy "photo_push_engagement_own" on public.photo_push_engagement
  for select using (auth.uid() = user_id);

create policy "photo_push_deliveries_own" on public.photo_push_deliveries
  for select using (auth.uid() = user_id);
