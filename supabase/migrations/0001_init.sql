-- Vestaria — initial cloud backup schema.
-- Mirrors the local SQLite schema in src/db/client.ts. Run this once against
-- a fresh Supabase project (SQL Editor -> paste -> Run), then fill in
-- EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local.
-- See README.md "Cloud backup setup" for the full walkthrough.

create table if not exists garments (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null,
  subcategory text,
  primary_color text not null,
  image_remote_url text,
  thumb_remote_url text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  archived_at timestamptz,
  purchase_price numeric,
  currency text
);

create index if not exists idx_garments_user on garments (user_id);

create table if not exists outfits (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists idx_outfits_user on outfits (user_id);

create table if not exists outfit_items (
  id text primary key,
  outfit_id text not null references outfits (id) on delete cascade,
  garment_id text not null references garments (id) on delete cascade,
  x double precision not null,
  y double precision not null,
  scale double precision not null default 1,
  rotation double precision not null default 0,
  z_index integer not null default 0
);

create index if not exists idx_outfit_items_outfit on outfit_items (outfit_id);

create table if not exists calendar_entries (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  planned_outfit_id text references outfits (id) on delete set null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (user_id, date)
);

create table if not exists wear_events (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  actual_outfit_id text references outfits (id) on delete set null,
  created_at timestamptz not null
);

create index if not exists idx_wear_events_user_date on wear_events (user_id, date);

-- Row Level Security: every table is scoped to its own user_id. outfit_items
-- has no user_id column (matches the local schema); it's scoped indirectly
-- through its parent outfit.

alter table garments enable row level security;
alter table outfits enable row level security;
alter table outfit_items enable row level security;
alter table calendar_entries enable row level security;
alter table wear_events enable row level security;

create policy "own garments" on garments for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own outfits" on outfits for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own outfit_items" on outfit_items for all
  using (exists (select 1 from outfits o where o.id = outfit_items.outfit_id and o.user_id = auth.uid()))
  with check (exists (select 1 from outfits o where o.id = outfit_items.outfit_id and o.user_id = auth.uid()));

create policy "own calendar_entries" on calendar_entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own wear_events" on wear_events for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage: one bucket for garment photos + thumbnails, public-read (photos
-- of your own clothes aren't sensitive) but write-restricted to the owning
-- user's own folder (`<user_id>/<garment_id>/...`).

insert into storage.buckets (id, name, public)
values ('garments', 'garments', true)
on conflict (id) do nothing;

create policy "read own garment photos" on storage.objects for select
  using (bucket_id = 'garments');

create policy "write own garment photos" on storage.objects for insert
  with check (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "update own garment photos" on storage.objects for update
  using (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "delete own garment photos" on storage.objects for delete
  using (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);
