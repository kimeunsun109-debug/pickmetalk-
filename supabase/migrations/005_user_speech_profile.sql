-- 사용자 말투 프로필 (영구 병합) + 세션 스냅샷
alter table public.profiles
  add column if not exists speech_profile jsonb default '{}'::jsonb;

alter table public.profiles
  add column if not exists speech_profile_session jsonb default '{}'::jsonb;

comment on column public.profiles.speech_profile is
  '사용자 말투 패턴 — avgLength, emojiUsage, honorific 등 (services/speechStyle.ts)';

comment on column public.profiles.speech_profile_session is
  '현재 브라우저 세션 말투 스냅샷 (선택적)';
