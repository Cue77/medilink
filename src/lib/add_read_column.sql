-- Add read column to messages table
alter table public.messages 
add column if not exists read boolean default false;

-- Mark existing messages as read so the user starts fresh (optional, but good for UX)
update public.messages set read = true;

notify pgrst, 'reload schema';
