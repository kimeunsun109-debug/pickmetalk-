# Cursor Cloud / Agent handoff

## Product & MVP (2026-07)

**목표:** 빠른 베타 출시 — 완벽한 기능보다 속도  
**우선순위:** 개발 속도 → 안정성 → 확장성 → 디자인 → 차별화  
**차별화 (베타 이후):** 다국어(i18n), 실사 기반 AI 이미지

| 문서 | 용도 |
|------|------|
| [`docs/MVP_ROADMAP.md`](docs/MVP_ROADMAP.md) | 지금 구현할 것만 (Phase 1–3) |
| [`docs/기획제안.md`](docs/기획제안.md) | **구현하지 말고** 아이디어만 기록 |

**에이전트 규칙**

- UX 개선·경쟁 기능·차별화 아이디어 → `docs/기획제안.md`에 추가만
- `MVP_ROADMAP.md` Phase 1 없는 기능은 사용자 요청 전 구현 금지
- 신규 UI 문자열 → `messages/ko.json` + `t('key')` (`lib/i18n/`)
- 참고 이미지: 로컬 `픽미톡 ai` → `docs/reference/` 동기화 권장

## Repo

- **App:** PickmeTalk AI girlfriend chat (`pickmetalk.com`)
- **Stack:** Next.js 15, Supabase, DeepSeek, Vercel, Stripe (Premium)

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
npm run verify:prod          # pickmetalk.com PR 반영 여부
npm run verify:migrations    # Supabase 003–008 일치
npx tsx scripts/test_daily_patterns.mts
npx supabase db push   # if linked
```

**프로덕션 반영:** feature PR은 `main` 머지 후 Vercel Production 배포가 되어야 `pickmetalk.com`에 나타납니다.

**Premium:** 무료 30회/일 → Stripe → `profiles.is_premium`. See `docs/STRIPE.md`.
