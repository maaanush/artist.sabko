-- Products, Artworks, and Artwork-Product settings
-- This migration creates global products (admin-managed), user artworks, and per-artwork product pricing.

-- Enable pgcrypto for gen_random_uuid if not already
create extension if not exists pgcrypto;

-- PRODUCTS
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  base_price numeric(10,2) not null check (base_price >= 0),
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

-- Anyone authenticated can read products
create policy "Products are readable by authenticated users" on public.products
  for select using (auth.role() = 'authenticated');

-- Only admins (based on JWT user_metadata.role) or service_role can write
create policy "Only admins can manage products" on public.products
  for all
  using (
    auth.role() = 'service_role' OR (
      coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), (auth.jwt() -> 'app_metadata' ->> 'role')) = 'admin'
    )
  )
  with check (
    auth.role() = 'service_role' OR (
      coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), (auth.jwt() -> 'app_metadata' ->> 'role')) = 'admin'
    )
  );

-- ARTWORKS
create table if not exists public.artworks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  original_file_name text not null,
  created_at timestamptz not null default now()
);

alter table public.artworks enable row level security;

-- Artwork owner can manage their artworks
create policy "Users can manage own artworks" on public.artworks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ARTWORK-PRODUCT SETTINGS
create table if not exists public.artwork_products (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references public.artworks(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  enabled boolean not null default true,
  margin numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (artwork_id, product_id)
);

create index if not exists artwork_products_artwork_idx on public.artwork_products(artwork_id);
create index if not exists artwork_products_product_idx on public.artwork_products(product_id);

alter table public.artwork_products enable row level security;

-- Only the owner of the artwork can manage associated product rows
create policy "Users can manage their artwork_products" on public.artwork_products
  for all
  using (
    exists (
      select 1 from public.artworks a
      where a.id = artwork_products.artwork_id and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.artworks a
      where a.id = artwork_products.artwork_id and a.user_id = auth.uid()
    )
  );


