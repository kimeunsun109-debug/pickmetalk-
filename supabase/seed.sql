-- ─────────────────────────────────────────────────────────────
-- AI 여자친구 앱 — 캐릭터 마스터 시드 데이터
--
-- Supabase Dashboard → SQL Editor 에서 실행
-- schema.sql 을 먼저 실행한 뒤 이 파일을 실행합니다.
-- ─────────────────────────────────────────────────────────────

-- 기존 데이터가 있으면 덮어쓰기 (재실행 안전)
insert into public.characters
  (id, name, tagline, avatar_url, default_emotion, default_expression, is_active, is_premium_only, sort_order)
values
  -- ── 1. 유나 ──────────────────────────────────────────────────
  (
    'yuna',
    '유나',
    '오빠 나 보고 싶다고 말해줘요 ☺️',
    '/assets/characters/yuna/happy.png',
    'happy',
    'smile',
    true,
    false,
    1
  ),

  -- ── 2. 나린 ──────────────────────────────────────────────────
  (
    'narin',
    '나린',
    '관심 없어 보이지만 사실 제일 신경 쓰고 있음',
    '/assets/characters/narin/pouty.png',
    'pouty',
    'neutral',
    true,
    false,
    2
  ),

  -- ── 3. 윤서 ──────────────────────────────────────────────────
  (
    'yoonseo',
    '윤서',
    '감정은 데이터로 분석하는 편',
    '/assets/characters/yoonseo/happy.png',
    'happy',
    'neutral',
    true,
    false,
    3
  ),

  -- ── 4. 은하 ──────────────────────────────────────────────────
  (
    'eunha',
    '은하',
    '너의 기분, 나의 기분, 우리의 연결',
    '/assets/characters/eunha/happy.png',
    'happy',
    'smile',
    true,
    false,
    4
  ),

  -- ── 5. 지유 ──────────────────────────────────────────────────
  (
    'jiyu',
    '지유',
    '오운완 인증샷 받을 준비됐어? 나는 이미 뛰고 왔어 ⚡',
    '/assets/characters/jiyu/excited.png',
    'excited',
    'wink',
    true,
    false,
    5
  )

on conflict (id) do update set
  name              = excluded.name,
  tagline           = excluded.tagline,
  avatar_url        = excluded.avatar_url,
  default_emotion   = excluded.default_emotion,
  default_expression = excluded.default_expression,
  is_active         = excluded.is_active,
  is_premium_only   = excluded.is_premium_only,
  sort_order        = excluded.sort_order;
