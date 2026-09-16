# Google · Kakao social login (Supabase Auth)

App code uses `signInWithOAuth` → `/api/auth/callback` (PKCE).  
**Provider Client ID / Client Secret are configured only in the Supabase Dashboard** — never in the Next.js client bundle.

## App redirect URLs (Supabase → Auth → URL Configuration)

| Environment | Site URL / Redirect allow list |
|-------------|-------------------------------|
| Production | Site URL: `https://pickmetalk.com` |
| Production | Redirect: `https://pickmetalk.com/**`, `https://www.pickmetalk.com/**` |
| Local | Redirect: `http://localhost:3000/**` |
| Preview | Redirect: `https://*.vercel.app/**` (optional) |

App callback used by the client:  
`{NEXT_PUBLIC_APP_URL or window.origin}/api/auth/callback?next=/characters`

Also mirrored in `supabase/config.toml` (`additional_redirect_urls`).

## Google Cloud Console

1. Create OAuth Client ID (Web application).
2. Authorized redirect URI (Supabase Auth, **not** the Next.js path):

   `https://<PROJECT_REF>.supabase.co/auth/v1/callback`

3. Copy Client ID + Client Secret into Supabase → Authentication → Providers → **Google** → Enable.
4. App requests scopes: `openid email profile` (see `lib/auth/oauth.ts`).

No Google secret belongs in `.env.local` for this flow.

## Kakao Developers

1. Confirm the approved app is shown as a **Biz App**, then enable **Kakao Login**.
2. REST API key = Supabase Kakao **Client ID**.
3. Activate Kakao Login Client Secret = Supabase Kakao **Client Secret**.
4. Kakao Login Redirect URI:

   `https://<PROJECT_REF>.supabase.co/auth/v1/callback`

   Local Supabase (optional): `http://localhost:54321/auth/v1/callback`
5. Kakao Login → Consent items: enable all three scopes requested by the app:
   - Kakao account (email): **`account_email`**
   - Profile nickname: **`profile_nickname`**
   - Profile image: **`profile_image`**
   - For production account creation, set `account_email` to **Required consent**
     after Biz/additional-feature approval. If the console only offers Optional,
     Optional is valid but a user may decline it.
6. Supabase → Authentication → Providers → **Kakao** → Enable + paste credentials.
7. Keep **Allow users without an email** **OFF** when email is Required. Turn it
   ON only if email is Optional and PickMeTalk intentionally supports users who
   decline email consent.

### `KOE205` checklist

Kakao **KOE205 (`invalid_scope`)** means the authorization request contains a
scope that is not enabled in the Kakao app. Biz approval makes email consent
configurable; approval alone does not toggle the consent item.

This app requests `account_email,profile_nickname,profile_image` for Kakao (see
`lib/auth/oauth.ts`). Google independently keeps `openid email profile`.

Checklist when KOE205 appears:

1. In Kakao Developers, verify the production REST API key belongs to the
   approved Biz App.
2. Under Kakao Login → Consent items, verify the three scopes above are enabled
   before testing. The consent-screen preview should show email.
3. Do not add `openid` unless Kakao OpenID Connect is also enabled. This app
   uses Kakao OAuth and does not request `openid`.
4. In Supabase, verify Kakao is enabled and its Client ID is the same REST API
   key whose consent items were configured.
5. Verify Kakao's redirect URI exactly matches the **Callback URL displayed by
   the Supabase Kakao provider**:
   `https://<PROJECT_REF>.supabase.co/auth/v1/callback`.
6. Retry in a private window or revoke the app connection before checking the
   consent screen again.

Do not remove `account_email` to mask KOE205 now that the production app relies
on email identity. Fix the Kakao consent-item mismatch instead.

## Production smoke checklist

- [ ] `/login` shows enabled Google and Kakao buttons.
- [ ] Google account selection returns to `/characters` as an authenticated user.
- [ ] Kakao consent shows email, nickname, and profile image; accepting returns
      to `/characters` as an authenticated user without KOE205.
- [ ] Refreshing `/characters` preserves each provider session.
- [ ] Cancelling either provider returns to `/login` with a readable error.
- [ ] Supabase Authentication → Users shows the expected provider identity and
      an email for the Kakao user.
- [ ] No provider secret appears in Vercel client environment variables, source,
      browser bundles, logs, or the PR.

## Env vars (app)

Already required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` (production: `https://pickmetalk.com`)

No additional client secrets for Google/Kakao in the app.

## Capacitor follow-up (non-blocking)

The Android shell loads the hosted web app via `server.url`. Web OAuth works when redirects stay on `https://pickmetalk.com`.  
Native deep-link return (`com.pickmetalk.app://…` + `@capacitor/browser`) is a follow-up if the system browser is required for Kakao/Google policies on-device.
