-- Ensure emails stored lowercase
update public.invites set email = lower(email);

-- Drop case-insensitive index; replace with unique constraint
drop index if exists invites_email_unique_ci;

-- Add unique constraint on email
alter table public.invites add constraint invites_email_unique unique (email);
