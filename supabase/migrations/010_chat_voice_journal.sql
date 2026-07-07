-- 앱 채팅 → 말투 실험 저널 (voice AB 분석·주간 로그용)

create table if not exists public.chat_voice_journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete set null,
  character_id text not null,
  user_message text not null,
  assistant_reply text not null,
  time_slot text,
  follow_up text,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_voice_journal_user_created
  on public.chat_voice_journal (user_id, created_at desc);

create index if not exists idx_chat_voice_journal_character
  on public.chat_voice_journal (character_id, created_at desc);

comment on table public.chat_voice_journal is
  '앱 실사용 대화 로그 — 말투 A/B·주간 패턴 분석용 (scripts/export_voice_journal.mts)';

alter table public.chat_voice_journal enable row level security;

create policy "chat_voice_journal_select_own"
  on public.chat_voice_journal for select
  using (auth.uid() = user_id);

create policy "chat_voice_journal_insert_own"
  on public.chat_voice_journal for insert
  with check (auth.uid() = user_id);
