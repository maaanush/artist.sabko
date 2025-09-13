-- Add simplified address fields to profiles (3 fields total)
alter table public.profiles
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists address_country text;


