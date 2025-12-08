-- Add file_url column to records table if it doesn't exist
alter table public.records 
add column if not exists file_url text;

-- Reload the schema cache (this is implicit in Supabase usually, but good to know)
notify pgrst, 'reload schema';
