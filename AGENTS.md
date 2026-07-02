# PickmeTalk — agent notes

Next.js 15 (App Router) AI companion chat app. Supabase auth/DB, DeepSeek streaming chat.

## Common commands

```bash
npm install
pip install openpyxl   # Excel sync scripts (also in .cursor/environment.json install)
npm run dev            # predev syncs kick lines from 킥문장_마스터DB.xlsx
npm run build
npm run lint
npm run sync:kicklines
```

## Key paths

| Area | Path |
|------|------|
| Chat API | `app/api/chat/route.ts` |
| Prompts | `prompts/` (`base.ts`, `kickLines.ts`, `patternNudges.ts`, `topicGuides.ts`) |
| Characters | `data/characters.json` |
| Kick lines (generated) | `data/kickLines/master.json` |
| Kick lines (source) | `킥문장_마스터DB.xlsx` |
| Dialogue examples (source) | `character_dialogue_examples.xlsx` |
| Daily pattern inference | `services/dailyPatternInference.ts`, `lib/db/dailyPatterns.ts` |
| DB migrations | `supabase/migrations/` |

## Cursor Cloud specific instructions

1. **Secrets** — Add these in [Cursor Cloud Agents dashboard](https://cursor.com/dashboard/cloud-agents) (Secrets tab). Do not commit real keys.
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DEEPSEEK_API_KEY`
   - Optional: `TAVILY_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`

2. **Environment** — This repo includes `.cursor/environment.json` with `npm install && pip install openpyxl`. Cloud agents use it automatically when starting from this repo.

3. **Supabase** — Remote DB already has migration `006_user_daily_patterns`. For a fresh project, run `supabase/schema.sql` or `npx supabase db push --linked`.

4. **Kick lines** — `npm run dev` / `npm run build` auto-run `sync:kicklines`. If the xlsx is missing, existing `data/kickLines/master.json` is used.

5. **Tests / scripts** (manual, need env + network):
   - `npx tsx scripts/test_daily_patterns.mts`
   - `npx tsx scripts/test_character_dialogue.mts`

6. **Do not commit** — `.env.local`, `.next/`, `supabase/.temp/`, `scripts/inspect_out.txt`, `scripts/xlsx_dump.json`.
