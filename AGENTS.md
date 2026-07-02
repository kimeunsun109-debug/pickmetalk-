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
- **Network egress in Cursor Cloud**: outbound to `api.deepseek.com`, `*.supabase.co`, and
  Docker registries may be blocked by default. `npx supabase start` and live API calls need
  allowlist entries. Lint, build, and the dev server work offline.

### Hello-world flow (when creds + egress are available)

`/login` → `/characters` (pick 유나·나린·윤서·은하·지유) → `/chat` (streaming DeepSeek reply;
affection +1 per round trip).

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
