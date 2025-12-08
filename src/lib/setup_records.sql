-- 1. Create Records Table
create table if not exists public.records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  type text not null, -- 'Results', 'Letters', 'Scans'
  doctor text not null,
  diagnosis text,
  date timestamptz default now(),
  file_url text,
  created_at timestamptz default now()
);

-- 2. Enable RLS
alter table public.records enable row level security;

-- 3. RLS Policies
create policy "Users can view their own records"
  on public.records for select
  using (auth.uid() = user_id);

create policy "Users can insert their own records"
  on public.records for insert
  with check (auth.uid() = user_id);

-- 4. Create Storage Bucket
insert into storage.buckets (id, name, public)
values ('medical-records', 'medical-records', true)
on conflict (id) do nothing;

-- 5. Storage Policies
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
