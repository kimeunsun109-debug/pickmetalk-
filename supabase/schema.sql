-- AI 여자친구 MVP — Supabase PostgreSQL 스키마
-- Supabase Dashboard → SQL Editor 에서 실행

-- profiles: auth.users 확장
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  trial_ends_at timestamptz default (now() + interval '14 days'),
  is_premium boolean default false,
  daily_message_count int default 0,
  daily_message_reset_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 사용자별 캐릭터 관계 상태
create table if not exists public.user_character_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  character_id text not null,
  affection int default 0 check (affection >= 0 and affection <= 100),
  relationship_level int default 1 check (relationship_level between 1 and 5),
  emotion text default 'happy',
  expression text default 'smile',
  nickname_for_user text,
  last_seen_at timestamptz default now(),
  last_chat_at timestamptz,
  memory_summary text,
  created_at timestamptz default now(),
  unique (user_id, character_id)
);

-- 채팅 메시지
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  character_id text not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  emotion text,
  created_at timestamptz default now()
);

create index if not exists messages_user_char_created
  on public.messages (user_id, character_id, created_at desc);

-- 선물 기록
create table if not exists public.gift_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  character_id text not null,
  gift_id text not null,
  affection_delta int default 0,
  created_at timestamptz default now()
);

-- RLS 활성화 (예시 — 세션 사용자만 본인 데이터)
alter table public.profiles enable row level security;
alter table public.user_character_states enable row level security;
alter table public.messages enable row level security;
alter table public.gift_logs enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "ucs_all_own" on public.user_character_states
  for all using (auth.uid() = user_id);

create policy "messages_all_own" on public.messages
  for all using (auth.uid() = user_id);

create policy "gift_logs_all_own" on public.gift_logs
  for all using (auth.uid() = user_id);

-- 신규 가입 시 profiles 자동 생성 (트리거)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
