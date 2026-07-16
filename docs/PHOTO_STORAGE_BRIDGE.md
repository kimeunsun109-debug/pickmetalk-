# Photo Storage Bridge

Ops (`pickmetalk-ops`, formerly `ai_girlfriend_app`) **generates** photos.  
Product (`pickmetalk`, formerly `app_girl-friend`) **only reads & delivers** them.

```
[Windows Ops]
  MJ Pipeline → Face/Quality → Thumbnail → Catalog
       ↓
  Upload to Supabase Storage (or CDN)
       ↓
  Upsert row into character_photo_assets
       ↓
[Product / Vercel]
  selectCatalogPhoto() → photo push deliver → chat bubble / album / web push
```

## Env (product)

| Variable | Purpose |
|----------|---------|
| `PHOTO_STORAGE_BUCKET` | Default `character-photos` |
| `PHOTO_CDN_BASE_URL` | Optional CDN prefix for public URLs |
| `NEXT_PUBLIC_SUPABASE_URL` | Used to build `/storage/v1/object/public/...` when CDN unset |

## Path convention

```
{character_id}/{category}/{hash}.jpg
```

Examples: `yuna/coffee/a1b2c3.jpg`, `yoonseo/selfie/d4e5f6.webp`

**Slug note:** product character id is `yoonseo` (ops sometimes used `yunseo` — normalize on ingest).

## Catalog row (`character_photo_assets`)

Required for product selection:

- `character_id`, `scenario_id`, `storage_path`
- `category`, `emotion`, `hash_fingerprint`
- `is_active=true`, optional `quality_score`, `public_url`

Migration: `011_photo_storage_bridge.sql`

## Product selectors

- `lib/photoCatalog/selectPhoto.ts` — cron deliver path
- `GET /api/photos/search` — authenticated catalog probe

If catalog is empty, product falls back to `/assets/characters/{id}/{emotion}.png`.

## What product MUST NOT do

- Run Midjourney / watch folders / Windows paths
- Import Prisma / Express / Redis / BullMQ
- Rewrite ops Photo Library on disk
