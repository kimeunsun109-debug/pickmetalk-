# PickMeTalk Architecture — Product ↔ Ops

## Roles (do not merge repos)

| Repo / folder | Role |
|---------------|------|
| **`pickmetalk`** (was `app_girl-friend`) | Product — chat, auth, relationship, photo **delivery**, Vercel |
| **`pickmetalk-ops`** (was `ai_girlfriend_app`) | Ops — Midjourney production, Photo Library, QC, Windows automation |

Local Windows paths (recommended):

- Product: `C:\Users\user\pickmetalk`
- Ops: `C:\Users\user\pickmetalk-ops`

```
Ops produces content → Storage/CDN → Product consumes & pushes to users
```

## Selectively ported into product (this integration)

| Feature | Location |
|---------|----------|
| Photo Push (planner/deliver/followup/cron) | `services/photoPush/*`, PR #15 base |
| Storage catalog select | `lib/photoCatalog/*` |
| Photo viewer + album | `PhotoMessageBubble`, `/album`, `/api/album` |
| Web Push (VAPID) | `lib/push/webPush.ts`, `/api/push/*` |
| Natural Conversation polish | `lib/conversation/*` → `responsePostProcess` |
| Stage dialogue (5 levels) | `lib/conversation/stageDialogue.ts` |

## Must stay in ops only

Midjourney Production, Prompt Catalog builder, Watch Folder, Face Verification,
Quality Score pipelines, Windows paths (`D:\PickMeTalk_PhotoLibrary`), Redis/BullMQ,
Express API, Prisma schema, batch dashboards.

## Migrations (additive only)

- `010_photo_push_system.sql` — push tables + message media columns
- `011_photo_storage_bridge.sql` — catalog fields + `memory_album_items`

Never drop existing product schema.

## Cron (Vercel)

- Hobby plan: **once per day** — `0 9 * * *` (09:00 UTC ≈ 18:00 KST) in `vercel.json`
- Pro plan: can restore `*/15 * * * *` for tighter photo-push timing

## Recommended next steps

1. Rename GitHub repos + local folders per `docs/RENAME_PICKMETALK.md`
2. Apply migrations `010` + `011` on Supabase (if not already)
3. Ops: publish first catalog batch to Storage + `character_photo_assets`
4. Set `VAPID_*` + `CRON_SECRET` on Vercel
5. Later: deeper Adaptive Personality DNA (optional) — product already has emotion/memory
