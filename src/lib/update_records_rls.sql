-- Drop existing policies
drop policy if exists "Users can view their own records" on public.records;
drop policy if exists "Users can insert their own records" on public.records;
drop policy if exists "Authenticated users can upload records" on storage.objects;
drop policy if exists "Authenticated users can view records" on storage.objects;

-- Create new policies for RECORDS table
create policy "Users can view own records or doctors can view all"
  on public.records for select
  using (
    auth.uid() = user_id 
    or 
    exists (select 1 from public.profiles where id = auth.uid() and role = 'doctor')
  );

create policy "Users can insert own records or doctors can insert for others"
  on public.records for insert
  with check (
    auth.uid() = user_id 
    or 
    exists (select 1 from public.profiles where id = auth.uid() and role = 'doctor')
  );

-- Create new policies for STORAGE (medical-records bucket)
create policy "Authenticated users can upload records"
on storage.objects for insert
with check (
  bucket_id = 'medical-records' 
  and auth.role() = 'authenticated'
);

create policy "Authenticated users can view records"
on storage.objects for select
using (
  bucket_id = 'medical-records'
  and auth.role() = 'authenticated'
);
