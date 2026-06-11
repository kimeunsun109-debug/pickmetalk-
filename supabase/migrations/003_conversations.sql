-- ─────────────────────────────────────────────────────────────
-- V3: 캐릭터별 다중 대화방 (conversations)
-- Supabase SQL Editor에서 schema.sql 이후 실행
-- ─────────────────────────────────────────────────────────────

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

alter table public.conversations enable row level security;

create policy "conversations_all_own" on public.conversations
  for all using (auth.uid() = user_id);

-- messages에 conversation_id 추가
alter table public.messages
  add column if not exists conversation_id uuid references public.conversations(id) on delete cascade;

create index if not exists messages_conversation_created
  on public.messages (conversation_id, created_at desc);

-- ── 기존 데이터 마이그레이션: 캐릭터당 기본 대화방 1개 ──
insert into public.conversations (
  user_id,
  character_id,
  title,
  summary,
  emotion,
  affection,
  relationship_level,
  last_message_at,
  updated_at,
  created_at
)
select
  ucs.user_id,
  ucs.character_id,
  '기본 대화',
  ucs.memory_summary,
  coalesce(ucs.emotion, 'happy'),
  coalesce(ucs.affection, 0),
  coalesce(ucs.relationship_level, 1),
  ucs.last_chat_at,
  coalesce(ucs.last_chat_at, ucs.last_seen_at, ucs.created_at),
  coalesce(ucs.created_at, now())
from public.user_character_states ucs
where not exists (
  select 1
  from public.conversations c
  where c.user_id = ucs.user_id
    and c.character_id = ucs.character_id
);

-- 메시지만 있고 state 없는 경우
insert into public.conversations (
  user_id,
  character_id,
  title,
  last_message_at,
  updated_at
)
select
  m.user_id,
  m.character_id,
  '기본 대화',
  max(m.created_at),
  max(m.created_at)
from public.messages m
where m.conversation_id is null
group by m.user_id, m.character_id
having not exists (
  select 1
  from public.conversations c
  where c.user_id = m.user_id
    and c.character_id = m.character_id
);

-- 메시지를 해당 캐릭터의 가장 오래된 기본 대화방에 연결
update public.messages m
set conversation_id = c.id
from public.conversations c
where m.conversation_id is null
  and m.user_id = c.user_id
  and m.character_id = c.character_id
  and c.title = '기본 대화';

-- 기본 대화방이 여러 개면 첫 번째만 (edge case)
update public.messages m
set conversation_id = sub.conv_id
from (
  select distinct on (m2.user_id, m2.character_id)
    m2.id as msg_id,
    c.id as conv_id
  from public.messages m2
  join public.conversations c
    on c.user_id = m2.user_id and c.character_id = m2.character_id
  where m2.conversation_id is null
  order by m2.user_id, m2.character_id, c.created_at asc
) sub
where m.id = sub.msg_id and m.conversation_id is null;
