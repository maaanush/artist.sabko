-- Create private bucket for artworks
insert into storage.buckets (id, name, public)
values ('artworks', 'artworks', false)
on conflict (id) do nothing;

-- Policies: users can manage only their own objects under <uid>/...
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can select own artworks'
  ) then
    create policy "Users can select own artworks"
    on storage.objects for select
    using (
      bucket_id = 'artworks'
      and split_part(name, '/', 1) = auth.uid()::text
    );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can insert own artworks'
  ) then
    create policy "Users can insert own artworks"
    on storage.objects for insert
    with check (
      bucket_id = 'artworks'
      and split_part(name, '/', 1) = auth.uid()::text
    );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can update own artworks'
  ) then
    create policy "Users can update own artworks"
    on storage.objects for update
    using (
      bucket_id = 'artworks'
      and split_part(name, '/', 1) = auth.uid()::text
    )
    with check (
      bucket_id = 'artworks'
      and split_part(name, '/', 1) = auth.uid()::text
    );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can delete own artworks'
  ) then
    create policy "Users can delete own artworks"
    on storage.objects for delete
    using (
      bucket_id = 'artworks'
      and split_part(name, '/', 1) = auth.uid()::text
    );
  end if;
end $$;

-- Add column on artworks to store storage path
alter table if exists public.artworks
  add column if not exists image_path text;


