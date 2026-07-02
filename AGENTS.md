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

### Blog automation (local path — not in this repo)

Blog scripts live on the user's machine:

`C:\Users\user\OneDrive\Desktop\blog`

Key files:

- `scripts/blog_daily_run.py` — daily 7AM workflow
- `scripts/selenium_blog_post.py` — Selenium headless post
- `scripts/blog_generate_post.py` + `blog_image.py` — post + AI images
- `scripts/naver_blog_automation.py` — Playwright CDP (port 9222)
- `.env` — NAVER credentials (never commit)

To bring blog into this repo later: copy `blog/` folder and add `blog/.env` to gitignore.

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
