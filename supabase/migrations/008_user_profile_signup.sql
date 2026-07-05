-- Migration 008: Signup profile fields on public.profiles
-- (This app uses `profiles`, not `user_profiles` — extends auth.users via profiles.id)
-- Fields: gender, birth_date, consent timestamps, device session, optional signup meta

alter table public.profiles
  add column if not exists gender text,
  add column if not exists birth_date date,
  add column if not exists mbti text,
  add column if not exists ideal_type text,
  add column if not exists privacy_consent_at timestamptz,
  add column if not exists terms_consent_at timestamptz,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists active_device_session text,
  add column if not exists chat_history_reset_at timestamptz;

comment on column public.profiles.gender is 'User gender from signup (male/female/other)';
comment on column public.profiles.birth_date is 'User date of birth from signup';
comment on column public.profiles.privacy_consent_at is 'Explicit privacy policy consent timestamp';
comment on column public.profiles.terms_consent_at is 'Explicit terms of service consent timestamp';
comment on column public.profiles.active_device_session is
  'Latest device session id — other devices are disconnected when this changes';
comment on column public.profiles.chat_history_reset_at is
  'Set when user deletes all conversations — prompts use fresh-start rules';
