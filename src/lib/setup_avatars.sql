-- 1. Add avatar_url to profiles table
alter table public.profiles 
add column if not exists avatar_url text;

-- 2. Create Avatars Storage Bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 3. Storage RLS Policies for Avatars

-- Allow authenticated users to upload their own avatar
create policy "Authenticated users can upload avatars"
on storage.objects for insert
with check (
  bucket_id = 'avatars' 
  and auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own avatar
create policy "Authenticated users can update avatars"
on storage.objects for update
with check (
  bucket_id = 'avatars' 
  and auth.role() = 'authenticated'
);

-- Allow everyone to view avatars (Public)
create policy "Everyone can view avatars"
on storage.objects for select
using (
  bucket_id = 'avatars'
);
