-- Enable RLS
alter table public.messages enable row level security;

-- Drop old policies to be safe
drop policy if exists "Users can view own messages" on messages;
drop policy if exists "Users can insert own messages" on messages;
drop policy if exists "Doctors can view messages" on messages;
drop policy if exists "Doctors can reply" on messages;

-- 1. Standard User Policy (Patients)
-- Can see/insert if the message belongs to them
create policy "Users can view own messages"
on messages for select
using ( auth.uid() = user_id );

create policy "Users can insert own messages"
on messages for insert
with check ( auth.uid() = user_id );

-- 2. Doctor Policy
-- Doctors can see/insert if the contact_name matches their OWN name
-- This relies on the frontend sending the correct contact_name
create policy "Doctors can view messages"
on messages for select
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'doctor'
    and profiles.full_name = messages.contact_name
  )
);

create policy "Doctors can reply"
on messages for insert
with check (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'doctor'
    and profiles.full_name = messages.contact_name
  )
);
