-- Minimal dev seed data
-- Admin and Artist users, profiles, an invite, categories

with admin_user as (
  insert into public.users (name, email, role, status)
  values ('Admin User', 'admin@example.com', 'admin', 'active')
  on conflict (email) do update set name = excluded.name
  returning id
),
artist_user as (
  insert into public.users (name, email, role, status)
  values ('Demo Artist', 'artist@example.com', 'artist', 'active')
  on conflict (email) do update set name = excluded.name
  returning id
)
insert into public.artist_profile (user_id, artwork_cap)
select id, 15 from artist_user
on conflict (user_id) do nothing;

-- Admin profile (optional)
insert into public.artist_profile (user_id, artwork_cap)
select id, 15 from admin_user
on conflict (user_id) do nothing;

-- Invite a new artist (whitelisted email)
insert into public.invites (email, invited_by_admin_id)
select 'new-artist@example.com', id from admin_user
on conflict (email) do nothing;

-- Terms acceptance for demo artist
insert into public.terms_acceptance_audit (user_id, terms_version, ip_address)
select id, 'v1', '127.0.0.1'::inet from artist_user;

-- Categories
insert into public.categories (label, base_price, default_margin, is_active)
values 
  ('T-Shirt', 299.00, 100.00, true),
  ('Hoodie', 799.00, 200.00, true),
  ('Sticker', 49.00, 20.00, true)
on conflict (label) do update set 
  base_price = excluded.base_price,
  default_margin = excluded.default_margin,
  is_active = excluded.is_active,
  updated_at = now();


