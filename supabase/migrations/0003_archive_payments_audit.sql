-- Phase 2: Archive, payments, audit

do $$ begin
  if not exists (select 1 from pg_type where typname = 'archive_reason') then
    create type archive_reason as enum ('swap', 'delete', 'deactivate');
  end if;
end $$;

create table if not exists public.archive_items (
  id bigserial primary key,
  artist_id uuid not null,
  artwork_id uuid not null,
  file_url text not null,
  reason archive_reason not null,
  archived_at timestamptz not null default now(),
  constraint fk_archive_artist
    foreign key (artist_id)
    references public.users(id)
    on delete cascade,
  constraint fk_archive_artwork
    foreign key (artwork_id)
    references public.artworks(id)
    on delete cascade
);

create index if not exists idx_archive_artist_id on public.archive_items (artist_id);

create table if not exists public.payments_bank (
  artist_id uuid primary key,
  account_holder text not null,
  account_number text not null,
  ifsc text not null,
  bank_name text not null,
  account_type text not null,
  pan text not null,
  gstin text null,
  phone text null,
  updated_at timestamptz not null default now(),
  constraint fk_bank_artist
    foreign key (artist_id)
    references public.users(id)
    on delete cascade
);

create table if not exists public.audit_log (
  id bigserial primary key,
  actor_id uuid not null,
  action text not null,
  target_type text null,
  target_id text null,
  metadata jsonb null,
  occurred_at timestamptz not null default now(),
  constraint fk_audit_actor
    foreign key (actor_id)
    references public.users(id)
    on delete set null
);

create index if not exists idx_audit_actor_id on public.audit_log (actor_id);

-- Down migration helper (reference)
-- To revert manually, run in reverse order:
-- drop index if exists idx_audit_actor_id;
-- drop table if exists public.audit_log;
-- drop table if exists public.payments_bank;
-- drop index if exists idx_archive_artist_id;
-- drop table if exists public.archive_items;
-- drop type if exists archive_reason;


