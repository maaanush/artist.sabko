-- Create profiles table linked to auth.users
create table if not exists public.profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	name text,
	phone text,
	updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policy: users can select their own row, admins can select all
drop policy if exists "select_own_or_admin" on public.profiles;
create policy "select_own_or_admin"
	on public.profiles
	for select
	using (
		(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
		or id = auth.uid()
	);

-- Policy: users can update their own row, admin can update all
drop policy if exists "update_own_or_admin" on public.profiles;
create policy "update_own_or_admin"
	on public.profiles
	for update
	using (
		(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
		or id = auth.uid()
	)
	with check (
		(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
		or id = auth.uid()
	);

-- Policy: insert own row only (admin can insert any)
drop policy if exists "insert_own_or_admin" on public.profiles;
create policy "insert_own_or_admin"
	on public.profiles
	for insert
	with check (
		(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
		or id = auth.uid()
	);

-- Optional: prevent deletes except admin
drop policy if exists "delete_admin_only" on public.profiles;
create policy "delete_admin_only"
	on public.profiles
	for delete
	using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Ensure a profile exists for each user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
	insert into public.profiles (id, name, phone)
	values (new.id, coalesce(new.raw_user_meta_data->>'name',''), coalesce(new.raw_user_meta_data->>'phone',''))
	on conflict (id) do nothing;
	return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
	after insert on auth.users
	for each row execute procedure public.handle_new_user();
