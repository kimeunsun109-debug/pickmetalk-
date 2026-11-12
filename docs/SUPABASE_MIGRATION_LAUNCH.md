# 프로덕션 Supabase 마이그레이션 — 출시 체크

로컬 `supabase/migrations/`와 원격 `schema_migrations`가 일치해야 합니다.

## 필수 마이그레이션 (현재 main)

| 버전 | 파일 | 출시 관련 |
|------|------|-----------|
| 008 | `008_user_profile_signup.sql` | 가입 닉네임·성별·DOB |
| 006 | `006_user_daily_patterns.sql` | 생활 패턴 |
| 009 | `009_premium_subscription.sql` | 프리미엄 (선택) |
| 010–011 | photo push | 사진 푸시 |

## 검증

`.env.local`에 `SUPABASE_ACCESS_TOKEN`(Management API `sbp_...`) + `NEXT_PUBLIC_SUPABASE_URL` 설정 후:

```bash
npx tsx scripts/verify_supabase_migrations.mts
```

- `✅` — 로컬·원격 동기
- 로컬만 있음 → `npx supabase db push` (링크된 프로젝트)
- 원격만 있음 → 로컬 migration 파일 누락; main에서 pull

## 프로덕션 적용 순서

1. Supabase 대시보드 백업(또는 branching preview)
2. `npx supabase link` (이미 링크된 경우 생략)
3. `npx supabase db push`
4. `verify_supabase_migrations.mts` 재실행

Pooler (Seoul): `aws-1-ap-northeast-2.pooler.supabase.com` — AGENTS.md 참고.
