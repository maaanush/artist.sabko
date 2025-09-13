-- Create private bucket for user profile pictures
insert into storage.buckets (id, name, public)
values ('profile_picture', 'profile_picture', false)
on conflict (id) do nothing;

-- Policies: users can manage only their own objects under <uid>/...
-- Use DO blocks to avoid errors on reruns

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can select own profile pictures'
  ) then
    create policy "Users can select own profile pictures"
    on storage.objects for select
    using (
      bucket_id = 'profile_picture'
      and split_part(name, '/', 1) = auth.uid()::text
    );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can insert own profile pictures'
  ) then
    create policy "Users can insert own profile pictures"
    on storage.objects for insert
    with check (
      bucket_id = 'profile_picture'
      and split_part(name, '/', 1) = auth.uid()::text
    );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can update own profile pictures'
  ) then
    create policy "Users can update own profile pictures"
    on storage.objects for update
    using (
      bucket_id = 'profile_picture'
      and split_part(name, '/', 1) = auth.uid()::text
    )
    with check (
      bucket_id = 'profile_picture'
      and split_part(name, '/', 1) = auth.uid()::text
    );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can delete own profile pictures'
  ) then
    create policy "Users can delete own profile pictures"
    on storage.objects for delete
    using (
      bucket_id = 'profile_picture'
      and split_part(name, '/', 1) = auth.uid()::text
    );
  end if;
end $$;


