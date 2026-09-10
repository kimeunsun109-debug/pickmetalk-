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

1. Create an app → enable **Kakao Login**.
2. REST API key = Supabase Kakao **Client ID**.
3. Activate Kakao Login Client Secret = Supabase Kakao **Client Secret**.
4. Kakao Login Redirect URI:

   `https://<PROJECT_REF>.supabase.co/auth/v1/callback`

   Local Supabase (optional): `http://localhost:54321/auth/v1/callback`
5. Consent items: enable **`profile_nickname`** and **`profile_image` only**.
   - Leave **`account_email` disabled** unless the app is a Kakao **Biz App**.
6. Supabase → Authentication → Providers → **Kakao** → Enable + paste credentials.
7. Turn **Allow users without an email** **ON** (required when email consent is unavailable).

### Kakao without email / KOE205

Kakao **KOE205** means the authorize request asked for a consent item that is not enabled — almost always `account_email` on a non–Biz App.

This app’s Kakao `signInWithOAuth` scopes are **profile only** (`profile_nickname,profile_image`) and **do not** request `account_email` / email (see `lib/auth/oauth.ts`). Google still uses `openid email profile`.

Checklist when KOE205 appears:

1. Kakao Developers → Consent: `account_email` off; nickname/image on.
2. Supabase Kakao provider: **Allow users without an email** ON.
3. Confirm the app is not passing `account_email` in `scopes` (this repo does not).
4. If KOE205 persists after (1)–(3), hosted GoTrue may still inject `account_email` by default until Supabase Auth omits it when email is optional ([auth#2574](https://github.com/supabase/auth/issues/2574) / [auth#2579](https://github.com/supabase/auth/pull/2579)). Workarounds then: Kakao Biz App (or “Register as Individual”) to enable `account_email`, or wait for that Auth fix.

## Env vars (app)

Already required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` (production: `https://pickmetalk.com`)

No additional client secrets for Google/Kakao in the app.

## Capacitor follow-up (non-blocking)

The Android shell loads the hosted web app via `server.url`. Web OAuth works when redirects stay on `https://pickmetalk.com`.  
Native deep-link return (`com.pickmetalk.app://…` + `@capacitor/browser`) is a follow-up if the system browser is required for Kakao/Google policies on-device.
