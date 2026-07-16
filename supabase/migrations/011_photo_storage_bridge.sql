-- Additive: Storage bridge fields + album + Web Push readiness
-- Does NOT drop or rewrite existing photo_push / character_photo_assets tables.

alter table public.character_photo_assets
  add column if not exists public_url text,
  add column if not exists category text,
  add column if not exists is_active boolean not null default true,
  add column if not exists quality_score numeric(4,2);

create index if not exists idx_character_photo_assets_active_cat
  on public.character_photo_assets (character_id, category, is_active)
  where is_active = true;

create index if not exists idx_character_photo_assets_active_emotion
  on public.character_photo_assets (character_id, emotion, is_active)
  where is_active = true;

comment on column public.character_photo_assets.public_url is
  'CDN or signed public URL published by ops Storage upload';
comment on column public.character_photo_assets.category is
  'Ops category slug (coffee, selfie, rain, …) for product selection';
comment on column public.character_photo_assets.is_active is
  'false = soft-hidden from product selectors (ops quality gate)';

-- Memory album derived from delivered photos (product-facing)
create table if not exists public.memory_album_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  character_id text not null,
  delivery_id uuid references public.photo_push_deliveries(id) on delete set null,
  media_url text not null,
  caption text,
  category text not null default 'selfie',
  album_label text not null default '추억',
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_memory_album_user_char
  on public.memory_album_items (user_id, character_id, sent_at desc);

alter table public.memory_album_items enable row level security;

create policy "memory_album_own"
  on public.memory_album_items
  for select using (auth.uid() = user_id);

-- Expand push_subscriptions for VAPID keys shape already stored in jsonb
comment on table public.push_subscriptions is
  'Web / native push endpoints. keys jsonb: {p256dh, auth} for web.';
