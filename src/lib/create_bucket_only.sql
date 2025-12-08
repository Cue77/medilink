-- Create the storage bucket 'medical-records' if it doesn't exist
insert into storage.buckets (id, name, public)
values ('medical-records', 'medical-records', true)
on conflict (id) do nothing;

-- Ensure the policy exists for uploads
drop policy if exists "Authenticated users can upload records" on storage.objects;
create policy "Authenticated users can upload records"
on storage.objects for insert
with check (
  bucket_id = 'medical-records' 
  and auth.role() = 'authenticated'
);

-- Ensure the policy exists for viewing
drop policy if exists "Authenticated users can view records" on storage.objects;
create policy "Authenticated users can view records"
on storage.objects for select
using (
  bucket_id = 'medical-records'
  and auth.role() = 'authenticated'
);
