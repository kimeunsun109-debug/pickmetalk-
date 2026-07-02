-- V6: Inferred lifestyle rhythm memory for contextual chat nudges.

create table if not exists public.user_daily_patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pattern_type text not null check (
    pattern_type in (
      'wake',
      'work_start',
      'lunch',
      'work_end',
      'exercise',
      'sleep'
    )
  ),
  time_start_minute int not null check (time_start_minute between 0 and 1439),
  time_end_minute int not null check (time_end_minute between 0 and 1439),
  confidence int not null default 0 check (confidence between 0 and 100),
  evidence_count int not null default 0 check (evidence_count >= 0),
  timezone text not null default 'Asia/Seoul',
  last_observed_at timestamptz not null default now(),
  last_updated_at timestamptz not null default now(),
  updated_from_message_id uuid references public.messages(id) on delete set null,
  unique (user_id, pattern_type)
);

create index if not exists user_daily_patterns_user_confidence
  on public.user_daily_patterns (user_id, confidence desc);

create index if not exists user_daily_patterns_user_updated
  on public.user_daily_patterns (user_id, last_updated_at desc);

alter table public.user_daily_patterns enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_daily_patterns'
      and policyname = 'user_daily_patterns_all_own'
  ) then
    create policy "user_daily_patterns_all_own"
      on public.user_daily_patterns
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create table if not exists public.user_pattern_alert_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pattern_type text not null check (
    pattern_type in (
      'wake',
      'work_start',
      'lunch',
      'work_end',
      'exercise',
      'sleep'
    )
  ),
  offset_minutes int not null default 0 check (offset_minutes between -180 and 180),
  enabled boolean not null default true,
  next_trigger_at timestamptz,
  last_computed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, pattern_type)
);

create index if not exists user_pattern_alert_plans_next_trigger
  on public.user_pattern_alert_plans (enabled, next_trigger_at);

alter table public.user_pattern_alert_plans enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_pattern_alert_plans'
      and policyname = 'user_pattern_alert_plans_all_own'
  ) then
    create policy "user_pattern_alert_plans_all_own"
      on public.user_pattern_alert_plans
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
