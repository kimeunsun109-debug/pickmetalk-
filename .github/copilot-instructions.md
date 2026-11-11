# PickmeTalk — Copilot instructions

You are working on **pickmetalk-** (Next.js 15, Supabase, DeepSeek). Product: pickmetalk.com.

## Daily mandate

Complete **exactly one** high-value item per calendar day (Asia/Seoul):

1. Open GitHub issue titled `[Daily Dev YYYY-MM-DD] ...` or pick the top unchecked **P0/P1** line in `docs/LAUNCH_BACKLOG.md`.
2. Read `AGENTS.md` before editing.
3. Smallest complete change; no drive-by refactors.
4. Run `npx tsc --noEmit` and `npm run lint`; add/run focused scripts under `scripts/` when relevant.
5. Open a PR titled `[Daily Dev YYYY-MM-DD] <summary>` and update `DAILY_LOG.md`.

## Do not

- Commit `.env`, `.env.local`, or secrets
- Auto-publish blog posts to Naver
- Disable Supabase production services via `config.toml` commits

## Launch priorities

See `docs/LAUNCH_BACKLOG.md`. Prefer P0 until empty.

## Stack notes

- Chat: `app/api/chat/route.ts`, prompts in `prompts/`, context in `services/context.ts`
- Local cloud setup: `bash scripts/cloud_env_setup.sh` then `npm run dev`
