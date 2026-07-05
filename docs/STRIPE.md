# Stripe Premium (베타)

**한 가지 결제 이유:** 무료 30회/일 → Premium **무제한 대화**

## 1. Stripe Dashboard

1. [Stripe](https://dashboard.stripe.com) → Products
2. **Premium Monthly** — recurring price (예: ₩9,900/월) → Price ID 복사
3. **Premium Yearly** — recurring price (예: ₩79,000/년) → Price ID 복사

## 2. 환경 변수 (Vercel + `.env.local`)

| 변수 | 설명 |
|------|------|
| `STRIPE_SECRET_KEY` | sk_live_… 또는 sk_test_… |
| `STRIPE_WEBHOOK_SECRET` | whsec_… |
| `STRIPE_PRICE_MONTHLY_ID` | price_… |
| `STRIPE_PRICE_YEARLY_ID` | price_… |

## 3. Webhook

Endpoint: `https://pickmetalk.com/api/stripe/webhook`

Events:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

→ `profiles.is_premium = true`, `subscription_status = active`

## 4. API

| Route | 설명 |
|-------|------|
| `POST /api/stripe/create-checkout` | `{ plan: "monthly" \| "yearly" }` → `{ url }` |
| `POST /api/stripe/webhook` | Stripe 서명 검증 후 DB 갱신 |
| `GET /api/profile/usage` | 오늘 사용량·잔여 횟수 |

## 5. DB 마이그레이션

`supabase/migrations/009_stripe_subscription.sql` — 원격에 적용:

```bash
npm run verify:migrations
# 또는 Management API / SQL Editor
```

## 6. 일일 한도

- `profiles.daily_message_count` — KST 자정 기준 자동 리셋
- 30회 초과 시 `429` + Premium 모달

## 7. 캐릭터 실사 프로필

고화질 사진 경로 (webp 권장):

```
public/characters/{yuna|narin|yoonseo|eunha|jiyu}/profile.webp
```

참고: 로컬 `docs/픽미톡 ai 이미지예시/구현예시.png` — 준비되면 위 경로에 배치.
