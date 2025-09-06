-- Phase 2: Initial schema (part 1)
-- Enums
do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin', 'artist');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_status') then
    create type user_status as enum ('invited', 'active', 'deactivated');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'invite_status') then
    create type invite_status as enum ('invited', 'revoked', 'used');
  end if;
end $$;

-- Tables (part 1)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role user_role not null default 'artist',
  status user_status not null default 'invited',
  created_at timestamptz not null default now()
);

create table if not exists public.invites (
  email text primary key,
  invited_by_admin_id uuid not null,
  status invite_status not null default 'invited',
  created_at timestamptz not null default now(),
  used_at timestamptz null,
  constraint fk_invited_by_admin
    foreign key (invited_by_admin_id)
    references public.users(id)
    on delete restrict
);

create index if not exists idx_invites_status on public.invites (status);

create table if not exists public.artist_profile (
  user_id uuid primary key,
  pronouns text null,
  location text null,
  phone text null,
  profile_picture_url text null,
  artwork_cap integer not null default 15,
  constraint fk_artist_profile_user
    foreign key (user_id)
    references public.users(id)
    on delete cascade
);

create table if not exists public.terms_acceptance_audit (
  id bigserial primary key,
  user_id uuid not null,
  terms_version text not null,
  accepted_at timestamptz not null default now(),
  ip_address inet null,
  constraint fk_terms_user
    foreign key (user_id)
    references public.users(id)
    on delete cascade
);

create index if not exists idx_terms_user_id on public.terms_acceptance_audit (user_id);

-- Down migration helper (wrap in transaction when using a migration tool that supports down)
-- NOTE: Supabase CLI does diffs; explicit down is optional. Provided here for reference.
-- To revert manually, run the following in reverse order:
-- drop index if exists idx_terms_user_id;
-- drop table if exists public.terms_acceptance_audit;
-- drop table if exists public.artist_profile;
-- drop index if exists idx_invites_status;
-- drop table if exists public.invites;
-- drop table if exists public.users;
-- drop type if exists invite_status;
-- drop type if exists user_status;
-- drop type if exists user_role;


