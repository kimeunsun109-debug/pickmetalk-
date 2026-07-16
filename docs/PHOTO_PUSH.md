# Photo Push System

자연스러운 “연인이 사진을 보낸 것 같은” 푸시·인앱 메시지 시스템.

## 목표

- 광고 푸시가 아닌 **사진 도착 + 답장을 기다리는** 감정 설계
- 하루 **0~2회** (특별한 날 +1), **랜덤 시간**, **월 1~2회 의도적 미발송**
- 반응 기반 빈도·톤 조절, **중복 사진/멘트/시간** 방지
- 답장 없을 때 **30분·2시간·다음날** 후속 멘트

## Architecture

```
data/photoPush/scenarios.ko.json   — 상황별 캡션·후속 시나리오
services/photoPush/
  planner.ts      — 일일 계획, skip day, 특별일 보너스
  engagement.ts   — CTR·답장률 기반 점수
  deliver.ts      — 채팅 메시지(사진) 삽입 + delivery 로그
  followup.ts     — 무응답 후속 멘트
  runner.ts       — cron 진입점
app/api/cron/photo-push/route.ts
app/api/photo-push/[deliveryId]/track/route.ts
```

## 발송 규칙 (구현)

| 규칙 | 상수/로직 |
|------|-----------|
| 일일 최대 | `PHOTO_PUSH_MAX_PER_DAY = 2` |
| 특별일 보너스 | 생일·100일 → `+1` (최대 1) |
| Skip day | `isScheduledSkipDay()` — 월 1~2일 |
| 랜덤 시각 | 시나리오 timeWindow + 비정각 분 |
| Engagement | score ≥65 → 2회 확률↑, ≤35 → 0~1회·쿨다운 |

## Analytics (`photo_push_deliveries`)

- `sent_at`, `push_clicked_at`, `photo_viewed_at`, `replied_at`, `reply_latency_sec`
- `session_logs`: `photo_push_opened`, `photo_push_viewed`, `photo_push_replied`

## Deep link

푸시 탭 시 (Web Push 연동 후):

```
/chat/{characterId}?conversationId={uuid}&photoPush={deliveryId}
```

## Cron (Vercel)

- `vercel.json` → `0 9 * * *` (Hobby: once/day, 09:00 UTC ≈ 18:00 KST). Pro can use `*/15 * * * *`.
- Env: `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`

## 사진 에셋 (~1000장/캐릭터)

**Storage bridge:** see [`PHOTO_STORAGE_BRIDGE.md`](./PHOTO_STORAGE_BRIDGE.md)

1. Ops uploads ready images to Supabase Storage / CDN
2. Ops upserts `character_photo_assets` (`is_active`, `category`, `hash_fingerprint`, …)
3. Product `selectCatalogPhoto()` prefers catalog; else emotion PNG placeholder

Migration: `011_photo_storage_bridge.sql`

## Web Push

- Tables: `push_subscriptions`
- APIs: `GET /api/push/vapid-public-key`, `POST/DELETE /api/push/web-subscription`
- Settings → “사진 알림 켜기”
- Env: `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

Without keys, deliver still works in-app; OS notification is mocked/skipped.

## Album / Viewer

- Chat: tap photo → full-screen viewer
- `/album` + `GET /api/album` — grouped memory photos

## i18n

캡션·후속 멘트: `data/photoPush/scenarios.ko.json`  
`{name}` 플레이스홀더 → `personalizeCaption()` + natural conversation polish

## 마이그레이션

- `supabase/migrations/010_photo_push_system.sql`
- `supabase/migrations/011_photo_storage_bridge.sql`
