-- AI 여자친구 MVP — Supabase PostgreSQL 스키마
-- Supabase Dashboard → SQL Editor 에서 실행

-- ─────────────────────────────────────────────────────────────
-- 캐릭터 마스터 테이블 (앱 시작 시 캐릭터 목록·기본 정보 로드)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.characters (
  id                text primary key,          -- 'yuna' | 'narin' | 'yoonseo' | 'eunha' | 'jiyu'
  name              text not null,             -- 표시 이름 (한글)
  tagline           text not null,             -- 캐릭터 한 줄 소개
  avatar_url        text not null,             -- 대표 아바타 이미지 경로
  default_emotion   text default 'happy',      -- 초기 감정 상태
  default_expression text default 'smile',    -- 초기 표정 상태
  is_active         boolean default true,      -- false → 앱에서 표시 안 됨
  is_premium_only   boolean default false,     -- true → 프리미엄 구독자만
  sort_order        smallint default 0,        -- 캐릭터 선택 화면 정렬 순서
  created_at        timestamptz default now()
);

-- 캐릭터 테이블은 모든 인증 유저가 읽을 수 있음 (쓰기는 서비스롤만)
alter table public.characters enable row level security;

create policy "characters_select_all_authenticated"
  on public.characters for select
  using (auth.role() = 'authenticated');

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

-- 대화방 (캐릭터별 다중 대화)
create table if not exists public.conversations (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  character_id       text not null,
  title              text not null default '새 대화',
  summary            text,
  emotion            text default 'happy',
  affection          int default 0 check (affection >= 0 and affection <= 100),
  relationship_level int default 1 check (relationship_level between 1 and 5),
  created_at         timestamptz default now(),
  updated_at         timestamptz default now(),
  last_message_at    timestamptz
);

create index if not exists conversations_user_char_updated
  on public.conversations (user_id, character_id, last_message_at desc nulls last);

create index if not exists conversations_user_updated
  on public.conversations (user_id, updated_at desc);

-- 채팅 메시지 — conversation_id 로 대화방별 분리
alter table public.messages
  add column if not exists conversation_id uuid references public.conversations(id) on delete cascade;

create index if not exists messages_conversation_created
  on public.messages (conversation_id, created_at desc);

-- 선물 기록
create table if not exists public.gift_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  character_id text not null,
  gift_id text not null,
  affection_delta int default 0,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- 마이그레이션 V2 — 동적 컨텍스트 변수 (Supabase SQL Editor에서 실행)
-- ─────────────────────────────────────────────────────────────

-- 유저 메타 (이름·나이·직업 등) JSONB 저장 — Settings 페이지에서 업데이트
alter table public.profiles
  add column if not exists user_context jsonb default '{}'::jsonb;

-- 윤서 전용 약속 이행 카운터
alter table public.user_character_states
  add column if not exists promise_kept_count int default 0,
  add column if not exists promise_broken_count int default 0;

-- Absence Event 중복 발송 방지 (쿨다운 체크용)
alter table public.user_character_states
  add column if not exists last_push_sent_at timestamptz default null;

-- ─────────────────────────────────────────────────────────────

-- RLS 활성화 (예시 — 세션 사용자만 본인 데이터)
alter table public.profiles enable row level security;
alter table public.user_character_states enable row level security;
alter table public.messages enable row level security;
alter table public.conversations enable row level security;
alter table public.gift_logs enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "ucs_all_own" on public.user_character_states
  for all using (auth.uid() = user_id);

create policy "messages_all_own" on public.messages
  for all using (auth.uid() = user_id);

create policy "conversations_all_own" on public.conversations
  for all using (auth.uid() = user_id);

create policy "gift_logs_all_own" on public.gift_logs
  for all using (auth.uid() = user_id);

-- ── 사용자 테스트 로그 (베타 분석용) ─────────────────────────────────
create table if not exists public.session_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete set null,
  character_id text,
  event_type   text not null,
  metadata     jsonb default '{}',
  created_at   timestamptz default now()
);

-- 분석 쿼리 최적화 인덱스
create index if not exists session_logs_user_created
  on public.session_logs (user_id, created_at desc);

create index if not exists session_logs_event_created
  on public.session_logs (event_type, created_at desc);

-- session_logs 에는 서버 사이드 insert 만 허용 (RLS 비활성)
-- 클라이언트는 /api/analytics 를 통해서만 기록 가능

-- ─────────────────────────────────────────────────────────────

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
