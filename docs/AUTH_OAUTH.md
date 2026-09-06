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
4. Scopes: `openid`, `email`, `profile` (defaults are fine).

No Google secret belongs in `.env.local` for this flow.

## Kakao Developers

1. Create an app → enable **Kakao Login**.
2. REST API key = Supabase Kakao **Client ID**.
3. Activate Kakao Login Client Secret = Supabase Kakao **Client Secret**.
4. Kakao Login Redirect URI:

   `https://<PROJECT_REF>.supabase.co/auth/v1/callback`

   Local Supabase (optional): `http://localhost:54321/auth/v1/callback`
5. Consent items: `profile_nickname`, `profile_image`; `account_email` if Biz App (or enable “Allow users without an email” in Supabase Kakao settings).
6. Supabase → Authentication → Providers → **Kakao** → Enable + paste credentials.

## Env vars (app)

Already required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` (production: `https://pickmetalk.com`)

No additional client secrets for Google/Kakao in the app.

## Capacitor follow-up (non-blocking)

The Android shell loads the hosted web app via `server.url`. Web OAuth works when redirects stay on `https://pickmetalk.com`.  
Native deep-link return (`com.pickmetalk.app://…` + `@capacitor/browser`) is a follow-up if the system browser is required for Kakao/Google policies on-device.
