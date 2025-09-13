-- Add address_pincode and remove address_country to align with UI
alter table public.profiles
  add column if not exists address_pincode text;

-- Optionally keep old column for backwards compatibility. If you want to drop it,
-- uncomment the following line after verifying no data loss concerns:
-- alter table public.profiles drop column if exists address_country;


