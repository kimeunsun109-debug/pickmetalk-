# Chat unlimited whitelist (no Stripe)

Free users are limited to **50 messages per KST day** (`FREE_DAILY_MESSAGE_LIMIT` in `lib/constants.ts`). Paid premium uses `profiles.is_premium` (set when checkout completes — not wired in beta).

For owners, testers, or staff, you can grant **unlimited chat** without payment by setting server env vars. No DB migration and no Stripe code.

## Env vars

| Variable | Example | Match |
|----------|---------|-------|
| `CHAT_UNLIMITED_USER_IDS` | `uuid-1,uuid-2` | Supabase Auth user UUID (`auth.users.id` / `profiles.id`) |
| `CHAT_UNLIMITED_EMAILS` | `owner@example.com` | Login email (case-insensitive) |

Either list is enough. Both can be used together.

```bash
# .env.local or Vercel → Settings → Environment Variables
CHAT_UNLIMITED_USER_IDS=
CHAT_UNLIMITED_EMAILS=eunsun@example.com
```

Restart the dev server or redeploy after changes.

## Where enforcement lives

| Layer | Role |
|-------|------|
| `app/api/chat/route.ts` | **Authoritative** — blocks send + reserves daily slot |
| `services/dailyMessageLimit.ts` | Count, KST reset, slot reservation |
| `services/chatPremiumAccess.ts` | `is_premium` OR whitelist |
| `lib/chatUnlimitedWhitelist.ts` | Parses env lists |
| `app/api/profile/usage/route.ts` | UI quota (`remaining`, banners) |
| `contexts/ChatProvider.tsx` | Client pre-check (usage API) |
| Supabase RLS | **No** quota rules — app-only |

Stripe (`app/api/premium/checkout`, `lib/payment/*`) is unrelated to this bypass.

## Add 은선 (owner) later

1. Sign in once on PickmeTalk (or Supabase Dashboard → Authentication → Users).
2. Copy **User UID** and/or **Email**.
3. Set on the deployment host:

   ```bash
   CHAT_UNLIMITED_USER_IDS=<paste-uuid-here>
   # and/or
   CHAT_UNLIMITED_EMAILS=<paste-email-here>
   ```

4. Redeploy (or restart `npm run dev` locally).

Settings → “오늘 대화” should show **무제한**; chat should not return `429` / `DAILY_LIMIT_REACHED`.

## Verify locally

```bash
CHAT_UNLIMITED_EMAILS=tester@pickme.local npx tsx scripts/test_chat_unlimited_whitelist.mts
```
