# Cursor Cloud / Agent handoff

## Repo

- **App:** PickmeTalk AI girlfriend chat (`pickmetalk.com`)
- **Stack:** Next.js 15, Supabase, DeepSeek, Vercel

## Start (Cloud)

```bash
npm install
pip install openpyxl
cp .env.example .env.local
# Fill secrets in Cursor Cloud dashboard Secrets tab
npm run dev
```

Required secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DEEPSEEK_API_KEY`  
Optional: `TAVILY_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`

See also `docs/CURSOR_CLOUD.md`.

## Recent work (continue here)

### App

- Daily pattern inference + chat route enrichment
- `services/dailyPatternInference.ts`, `patternAlertPlanner.ts`, `responsePostProcess.ts`
- `lib/db/dailyPatterns.ts`, migration `006_user_daily_patterns.sql`
- Prompt updates: `prompts/base.ts`, `patternNudges.ts`, `topicGuides.ts`
- Kick lines: `킥문장_마스터DB.xlsx` → `data/kickLines/master.json` via `npm run sync:kicklines` (auto on dev/build)

### Blog automation (`blog/`)

Blog scripts are in this repo under `blog/`. Local OneDrive copy may also exist at
`C:\Users\user\OneDrive\Desktop\blog` — treat repo `blog/` as source of truth for Cloud.

Key files:

- `blog/scripts/blog_daily_run.py` — daily 7AM workflow
- `blog/scripts/selenium_blog_post.py` — Selenium headless post
- `blog/scripts/blog_generate_post.py` + `blog_image.py` — post + AI images
- `blog/scripts/naver_blog_automation.py` — Playwright CDP (port 9222)
- `blog/.env` — NAVER credentials (copy from `blog/.env.example`, never commit)

Cloud: Selenium/CDP/Windows scheduler need a local Windows machine; Cloud can edit scripts and HTML posts.

## Cursor Cloud specific instructions

PickmeTalk is a single Next.js 15 (App Router) + TypeScript web app. Backend is Next.js API
routes; persistence/auth is Supabase; chat replies come from the DeepSeek API. Standard commands
live in `package.json` and setup steps in `README.md`.

### Services

- **Next.js dev server**: `npm run dev` → http://localhost:3000. `npm run build` then
  `npm start` for production. Lint: `npm run lint`.
- **Supabase** (external/hosted, or local via `npx supabase start`): required for auth and
  persistence (messages, characters, affection/relationship).
- **DeepSeek API** (external): required for `/api/chat`. No local mock; throws if
  `DEEPSEEK_API_KEY` is missing.

Android/Capacitor, PWA (`ENABLE_PWA=true`), and Telegram vars are optional.

### Environment variables

Copy `.env.example` → `.env.local`. Required: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DEEPSEEK_API_KEY` (server-only — never `NEXT_PUBLIC_`).
Optional: `SUPABASE_SERVICE_ROLE_KEY`, `DEEPSEEK_BASE_URL`, `TAVILY_API_KEY`.

### Non-obvious gotchas

- **`python` must be on PATH**: `predev`/`prebuild` run `sync:kicklines` which calls `python`
 (not `python3`). The base image only ships `python3`, so a `python` shim is required or
 `npm run dev`/`npm run build` fail at the pre-step. The Cursor Cloud startup/update script
 creates it (`sudo ln -sf /usr/bin/python3 /usr/local/bin/python`); if you hit
 `sh: 1: python: not found`, recreate it manually. `openpyxl` must be installed for the script
 to run (falls back to the committed `data/kickLines/master.json` only when the source `.xlsx`
 is absent).
- **No committed `.cursor/environment.json`**: this repo intentionally has no committed
 environment file so Cloud Agents use the snapshot-managed team environment (update script:
 python shim + `npm install` + `pip install openpyxl`). A committed `environment.json` here
 previously caused `Failed to sync environment: 400` because it overrode/expired the team
 snapshot — do not re-add it unless you deliberately want a repo-pinned environment.
- **Placeholder Supabase**: if the URL contains `YOUR_PROJECT`/`your_project` or the anon key
  contains `your_anon`, middleware skips session refresh and redirects protected routes to
  `/login`. Use placeholder patterns or real credentials — fake-looking URLs can stall SSR.
- **DeepSeek env is re-read per request**, so editing `DEEPSEEK_API_KEY` in `.env.local` does
 not require a dev-server restart for `/api/chat`.
- **`NEXT_PUBLIC_*` needs a dev restart**: unlike the server-only DeepSeek key, the client-side
 `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` are inlined into the bundle at
 `next dev` startup. If you fill in real Supabase creds after `npm run dev` is already running,
 the login page keeps showing "Supabase가 아직 설정되지 않았습니다" until you restart the dev server.
- **No-email-confirm test account**: to get a working login without SMTP, create a confirmed
 user via the Supabase Admin API with the service-role key
 (`POST $NEXT_PUBLIC_SUPABASE_URL/auth/v1/admin/users` with `{"email_confirm": true}`); the
 `handle_new_user` trigger auto-creates the `profiles` row. Characters are code-defined
 (`data/characters.json`), so the optional `public.characters` table is not required for the
 login → select → chat flow.
- **Network egress in Cursor Cloud**: outbound to `api.deepseek.com`, `*.supabase.co`, and
  Docker registries may be blocked by default. `npx supabase start` and live API calls need
  allowlist entries. Lint, build, and the dev server work offline.

### Hello-world flow (when creds + egress are available)

`/login` → `/characters` (pick 유나·나린·윤서·은하·지유) → `/chat` (streaming DeepSeek reply;
affection +1 per round trip).

CLI 검증 (쿠키 세션 — Bearer 토큰은 API에서 동작하지 않음):

```bash
npx tsx scripts/hello_world_cookie.mts --port 3001
```

데모 계정: `demo.tester@pickmetalk.dev` / `DemoPass123!` (또는 `.env.local`의 `TEST_USER_*`).

- **`npm run build` 후 dev 서버가 500/`Cannot find module`이면** `.next` 삭제 후 dev 재시작:
  `rm -rf .next && npm run dev -- -p 3001`
- 포트 3000이 점유 중이면 `-- -p 3001` 사용.

### 대화 데이터셋 (로컬·Cloud, DeepSeek만 필요)

```bash
npm run dataset:daily                    # 아침·점심·저녁 × 10턴 → dataset/
npm run dataset:daily -- --date YYYY-MM-DD --turns 10
```

산출물: `dataset/daily_logs/`, `dataset/best_lines.json`, `dataset/statistics/score.json`.
자세한 규칙은 `dataset/README.md`.

### Supabase 마이그레이션 (007 chat_voice_journal)

Cloud VM에 `SUPABASE_ACCESS_TOKEN` 또는 `SUPABASE_DB_PASSWORD`가 없으면 CLI push가 불가하다.

**대안 (Secrets 없이):** Supabase 대시보드 → SQL Editor →
`supabase/migrations/007_chat_voice_journal.sql` 내용 붙여넣기 후 Run.

CLI로 할 때:

```bash
npm run supabase:db-push   # .env.local에 TOKEN 또는 DB_PASSWORD 필요
```

저널 테이블이 없어도 채팅은 동작한다. insert만 조용히 스킵된다 (`lib/db/chatVoiceJournal.ts`).

### 센스·받아치기 테스트

```bash
npx tsx scripts/test_wit_unit.mts
npx tsx scripts/test_wit_recovery.mts
```

## Do not

- Auto-publish Naver blog posts (draft only)
- Commit `.env`, `.env.local`, `supabase/.temp/`
- Delete user OneDrive files without permission

## Commands

```bash
npm run build
npm run lint
npm run dataset:daily
npm run supabase:db-push   # optional; or SQL Editor에 007 마이그레이션
npx tsx scripts/test_daily_patterns.mts
npx tsx scripts/test_wit_recovery.mts
```
