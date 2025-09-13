-- Invites table: created by admin only
create table if not exists public.invites (
	id uuid primary key default gen_random_uuid(),
	email text not null,
	created_by uuid references auth.users(id) on delete set null,
	created_at timestamptz not null default now(),
	used_at timestamptz,
	status text not null default 'pending' check (status in ('pending','used','revoked'))
);

-- Ensure case-insensitive uniqueness on email
create unique index if not exists invites_email_unique_ci on public.invites (lower(email));

alter table public.invites enable row level security;

-- Admins can select all invites
create policy "invites_select_admin" on public.invites for select using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
-- Admins can insert
create policy "invites_insert_admin" on public.invites for insert with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
-- Admins can update
create policy "invites_update_admin" on public.invites for update using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
-- Admins can delete
create policy "invites_delete_admin" on public.invites for delete using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Attempted signups (lead capture for non-invited users)
create table if not exists public.attempted_signups (
	id uuid primary key default gen_random_uuid(),
	email text not null,
	name text,
	phone text,
	created_at timestamptz not null default now()
);

alter table public.attempted_signups enable row level security;

-- Only admin can view attempted signups
create policy "attempted_signups_select_admin" on public.attempted_signups for select using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
-- Anyone can insert their attempt (no auth), use public anon role
create policy "attempted_signups_insert_public" on public.attempted_signups for insert with check (true);
