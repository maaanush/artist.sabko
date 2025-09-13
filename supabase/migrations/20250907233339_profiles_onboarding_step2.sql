alter table public.profiles add column if not exists onboarding_step2_done boolean not null default false;
create index if not exists profiles_onb2_idx on public.profiles (onboarding_step2_done);
