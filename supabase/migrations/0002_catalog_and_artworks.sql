-- Phase 2: Catalog and artworks

-- Tables: categories, artist_margins, artworks, artwork_category_toggle

create table if not exists public.categories (
  id bigserial primary key,
  label text not null unique,
  base_price numeric(10,2) not null check (base_price >= 0),
  default_margin numeric(10,2) not null default 0 check (default_margin >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artworks (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null,
  title text not null,
  notes_internal text null,
  file_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_artworks_artist
    foreign key (artist_id)
    references public.users(id)
    on delete cascade
);

create index if not exists idx_artworks_artist_id on public.artworks (artist_id);

create table if not exists public.artist_margins (
  artist_id uuid not null,
  category_id bigint not null,
  margin_value numeric(10,2) not null default 0 check (margin_value >= 0),
  is_custom boolean not null default false,
  primary key (artist_id, category_id),
  constraint fk_margins_artist
    foreign key (artist_id)
    references public.users(id)
    on delete cascade,
  constraint fk_margins_category
    foreign key (category_id)
    references public.categories(id)
    on delete cascade
);

create index if not exists idx_artist_margins_category_id on public.artist_margins (category_id);

create table if not exists public.artwork_category_toggle (
  artwork_id uuid not null,
  category_id bigint not null,
  is_enabled boolean not null default true,
  primary key (artwork_id, category_id),
  constraint fk_toggle_artwork
    foreign key (artwork_id)
    references public.artworks(id)
    on delete cascade,
  constraint fk_toggle_category
    foreign key (category_id)
    references public.categories(id)
    on delete cascade
);

create index if not exists idx_toggle_category_id on public.artwork_category_toggle (category_id);

-- Down migration helper (reference)
-- To revert manually, run in reverse order:
-- drop index if exists idx_toggle_category_id;
-- drop table if exists public.artwork_category_toggle;
-- drop index if exists idx_artist_margins_category_id;
-- drop table if exists public.artist_margins;
-- drop index if exists idx_artworks_artist_id;
-- drop table if exists public.artworks;
-- drop table if exists public.categories;


