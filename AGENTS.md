# Cursor Cloud / Agent handoff

## Repo

- **App:** PickmeTalk (`pickmetalk.com`)
- **GitHub / local folder:** `pickmetalk` (formerly `app_girl-friend`)
- **Ops companion:** `pickmetalk-ops` (formerly `ai_girlfriend_app`) — do not merge
- **Stack:** Next.js 15, Supabase, DeepSeek, Vercel

## Start (Cloud)

```bash
npm install
pip install openpyxl
bash scripts/cloud_env_setup.sh   # Docker + 로컬 Supabase + .env.local + 테스트 계정 자동 구성
npm run dev
```

`scripts/cloud_env_setup.sh` (아이덤포턴트, `.cursor/environment.json`에서 자동 실행):

- `.env.local` 생성 — 로컬 Supabase 데모 키 + `DEEPSEEK_API_KEY` 주입
- Docker 설치·기동 (vfs 스토리지 드라이버 — 중첩 VM이라 overlayfs 불가) + `iptables-legacy -P FORWARD ACCEPT` (없으면 컨테이너 간 통신이 막혀 supabase start가 timeout)
- 로컬 Supabase 기동: `schema.sql`을 `migrations/000_schema.sql`로 선적용(로컬 한정, gitignore 처리)하고 realtime/studio/storage를 config.toml에 로컬 한정 비활성(start 후 자동 원복 — **이 블록 커밋 금지**, `supabase config push` 시 프로덕션 서비스가 꺼짐)
- `anon`/`authenticated` 역할 테이블 GRANT (schema.sql은 대시보드 실행 기준이라 GRANT가 없음)
- 테스트 계정: `tester@pickme.local` / `test1234!`

Required secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DEEPSEEK_API_KEY` 
Optional: `TAVILY_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`

**시크릿 이름 주의**: 대시보드 시크릿에 `딥시크 api`, `OAuth 클라이언트 ID`처럼 한글·공백 이름이 있으면
유효한 env 변수명이 아니라 앱이 읽지 못한다. `DEEPSEEK_API_KEY`, `TAVILY_API_KEY` 등 표준 이름으로
바꾸는 것이 정석이며, 바꾸기 전까지는 `cloud_env_setup.sh`가 `딥시크 api` → `DEEPSEEK_API_KEY`,
`타빌리 API 플랫폼` → `TAVILY_API_KEY`로 자동 매핑한다.
또한 한글 이름 시크릿은 커밋 시 시크릿 스캔 훅을 `invalid variable name`으로 죽인다. 커밋이 그 오류로
실패하면 아래처럼 유효한 이름만 걸러서 커밋:

```bash
VALID=$(echo "$CLOUD_AGENT_INJECTED_SECRET_NAMES" | tr ',' '\n' | grep -E '^[A-Za-z_][A-Za-z0-9_]*$' | paste -sd, -)
CLOUD_AGENT_INJECTED_SECRET_NAMES="$VALID" git commit -m "..."
```

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
- **Supabase** (external/hosted, or local): required for auth and persistence (messages,
 characters, affection/relationship). Cloud에서는 `bash scripts/cloud_env_setup.sh` 한 번으로
 로컬 Supabase(Docker)가 구성된다 — 직접 `npx supabase start` 하지 말 것 (schema 선적용·GRANT·
 config 오버라이드가 빠져 실패한다).
- **DeepSeek API** (external): required for `/api/chat`. No local mock; throws if
 `DEEPSEEK_API_KEY` is missing. Cloud egress는 허용되어 실제 호출 가능.

Android/Capacitor, PWA (`ENABLE_PWA=true`), and Telegram vars are optional.

### Environment variables

Copy `.env.example` → `.env.local`. Required: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DEEPSEEK_API_KEY` (server-only — never `NEXT_PUBLIC_`).
Optional: `SUPABASE_SERVICE_ROLE_KEY`, `DEEPSEEK_BASE_URL`, `TAVILY_API_KEY`.

### Non-obvious gotchas

- **Placeholder Supabase**: if the URL contains `YOUR_PROJECT`/`your_project` or the anon key
  contains `your_anon`, middleware skips session refresh and redirects protected routes to
  `/login`. Use placeholder patterns or real credentials — fake-looking URLs can stall SSR.
- **DeepSeek env is re-read per request**, so editing `DEEPSEEK_API_KEY` in `.env.local` does
  not require a dev-server restart for `/api/chat`.
- **Network egress in Cursor Cloud**: outbound to `api.deepseek.com`, `*.supabase.co`, and
  Docker registries may be blocked by default. `npx supabase start` and live API calls need
  allowlist entries. Lint, build, and the dev server work offline.
- **Supabase** `ap-northeast-2` (Seoul) — Vercel Functions는 `vercel.json` `icn1` 사용.
  미설정 시 Supabase RTT 300–600ms 가능. `docs/VERCEL_DEPLOY.md`, `scripts/check_regions.mts`.

### Hello-world flow (when creds + egress are available)

`/login` → `/characters` (pick 유나·나린·윤서·은하·지유) → `/chat` (streaming DeepSeek reply;
affection +1 per round trip).

### UX batch (2026-07)

- Character taglines + `data/characters-public.json` (client-safe; full prompts in `lib/characters/full.ts`)
- Signup: nickname/gender/DOB required; migration `008_user_profile_signup.sql` — run `npx supabase db push` when linked
- **Migration sync:** `npx tsx scripts/verify_supabase_migrations.mts` — local `007_`/`008_` files must match remote `schema_migrations`. Remote pooler: `aws-1-ap-northeast-2.pooler.supabase.com`. CLI `db push` needs legacy `sbp_0102...` token + DB password; Cloud may use Management API instead.
- Chat: onboarding prologue, assistant action bar, delete-all conversations (`DELETE /api/conversations?all=true`)
- Single-device session: `DeviceSessionGuard` + `profiles.active_device_session`

## Do not

- Auto-publish Naver blog posts (draft only)
- Commit `.env`, `.env.local`, `supabase/.temp/`
- Delete user OneDrive files without permission

## Commands

```bash
npm run build
npm run lint
npx tsx scripts/test_daily_patterns.mts
npx supabase db push   # if linked
```
