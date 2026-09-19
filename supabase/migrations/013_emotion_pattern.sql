-- Migration 013: user emotion pattern column
-- Stores per-user emotional resonance patterns derived from conversation history.
-- Used by services/emotionPattern.ts to make characters emotionally attuned.

alter table public.profiles
  add column if not exists emotion_pattern jsonb default '{}'::jsonb;

comment on column public.profiles.emotion_pattern is
  '감정 공명 패턴 — 유저가 특정 주제를 말할 때 보이는 감정 경향 (services/emotionPattern.ts)';
