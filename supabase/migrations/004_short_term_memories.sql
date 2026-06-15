-- V4: Short-term memories for near-future reminders and missions.

create table if not exists public.short_term_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  character_id text,
  memory_type text not null check (
    memory_type in (
      'reminder',
      'mission',
      'purchase',
      'health',
      'weather',
      'gratitude',
      'follow_up'
    )
  ),
  content text not null,
  due_date timestamptz,
  expires_at timestamptz not null,
  status text not null default 'active' check (
    status in ('active', 'completed', 'expired', 'dismissed')
  ),
  priority smallint not null default 2 check (priority between 1 and 5),
  source_message_id uuid references public.messages(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists short_term_memories_user_active_expires
  on public.short_term_memories (user_id, status, expires_at);

create index if not exists short_term_memories_user_due
  on public.short_term_memories (user_id, due_date);

alter table public.short_term_memories enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'short_term_memories'
      and policyname = 'short_term_memories_all_own'
  ) then
    create policy "short_term_memories_all_own"
      on public.short_term_memories
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
