-- Add profile fields for onboarding step 2
alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists location text,
  add column if not exists bio text,
  add column if not exists pronoun text;


