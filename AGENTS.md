# AGENTS.md

## Cursor Cloud specific instructions

PickmeTalk (픽미톡) is a single Next.js 15 (App Router) + TypeScript web app. Backend is
Next.js API routes; persistence/auth is Supabase; chat replies come from the DeepSeek API.
Standard commands live in `package.json` and setup steps in `README.md` — use those; only
the non-obvious notes below are repeated here.

### Services

- **Next.js dev server** (the only local service): `npm run dev` → http://localhost:3000.
  `npm run build` then `npm start` runs the production build. Lint: `npm run lint`.
- **Supabase** (external/hosted, or local via `npx supabase start`): required for
  signup/login and all persistence (messages, characters, affection/relationship).
- **DeepSeek API** (external SaaS): required for `/api/chat` replies. No local mock exists;
  `streamDeepSeekChat` throws if `DEEPSEEK_API_KEY` is missing/invalid.

Android/Capacitor, PWA (`ENABLE_PWA=true`), and Telegram vars are optional and not needed
for core web development.

### Environment variables

Copy `.env.example` → `.env.local`. Required for the full chat flow:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase),
`DEEPSEEK_API_KEY` (server-only — never use a `NEXT_PUBLIC_` prefix).
Optional: `SUPABASE_SERVICE_ROLE_KEY` (full account deletion in `/api/account/delete`),
`DEEPSEEK_BASE_URL`.

### Non-obvious gotchas

- **Graceful placeholder behavior**: if the Supabase URL contains `YOUR_PROJECT`/`your_project`
  or the anon key contains `your_anon`, middleware skips session refresh and redirects
  protected routes (`/chat`, `/characters`, `/conversations`, `/settings`, `/gifts`) to
  `/login` instead of hanging on a fake host. This is why the app can boot without real
  Supabase creds — but signup/login/chat will not actually work until real values are set.
  Do NOT put a real-looking-but-fake Supabase URL in `.env.local`; SSR `getUser()` will stall
  on the dead host. Either use the placeholder patterns above or real credentials.
- **DeepSeek env is re-read per request** (`createDeepSeekClient()`), so editing
  `DEEPSEEK_API_KEY` in `.env.local` does NOT require a dev-server restart for `/api/chat`.
  Note Next.js still typically needs a restart to pick up other `.env.local` changes.
- **Network egress is restricted in Cursor Cloud**: outbound to `api.deepseek.com`,
  `*.supabase.co`/`supabase.com`, and Docker image registries (S3-backed blobs) is blocked by
  default. As a result, `npx supabase start` (pulls Docker images) and live Supabase/DeepSeek
  calls fail unless those domains are added to the network allowlist. Lint, build, and the dev
  server itself work fully offline.

### Hello-world flow (when creds + egress are available)

`/login` (email signup/login) → `/characters` (pick 유나·나린·윤서·은하·지유) → `/chat`
(send a message, get a streaming DeepSeek reply; affection +1 per round trip).
