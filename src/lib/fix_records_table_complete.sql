-- Ensure all required columns exist in the records table
alter table public.records 
add column if not exists type text default 'Scans',
add column if not exists doctor text default 'Unknown',
add column if not exists diagnosis text,
add column if not exists date timestamptz default now(),
add column if not exists file_url text;

-- Force a schema cache reload to ensure Supabase API picks up the changes
notify pgrst, 'reload schema';
