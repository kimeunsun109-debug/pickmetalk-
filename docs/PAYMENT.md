# Payment architecture (Korea beta)

**Current:** Payment interface only — no live checkout.  
**Future:** Korea provider (Toss/PortOne 등) + optional Stripe for global.

## Structure

```
lib/payment/
  types.ts              — PaymentProvider interface
  registry.ts           — resolveMarket() → provider
  providers/
    korea-stub.ts       — KR beta (PAYMENT_KR_ENABLED=true when ready)
    stripe-stub.ts      — GLOBAL (PAYMENT_STRIPE_ENABLED + STRIPE_SECRET_KEY)
app/api/premium/checkout/route.ts
```

## API

`POST /api/premium/checkout`  
Body: `{ planId: "monthly" | "yearly", locale: "ko" }`

Returns `503` with `{ message }` until a provider is enabled.

## Enable later

| Provider | Env |
|----------|-----|
| Korea | `PAYMENT_KR_ENABLED=true` + implement `korea-stub.ts` |
| Stripe | `PAYMENT_STRIPE_ENABLED=true`, `STRIPE_SECRET_KEY`, webhook |

## i18n

UI strings: `messages/ko.json` → `t('premium.*')`  
Future locales: add `messages/en.json`, extend `lib/i18n/config.ts`.

## Free tier

- `FREE_DAILY_MESSAGE_LIMIT = 50` (KST reset)
- Regenerate (`resend`) does **not** count
- Warn banners at 10 and 5 remaining
