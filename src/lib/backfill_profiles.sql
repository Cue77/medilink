-- ==============================================================================
-- BACKFILL PROFILES & FIX RELATIONSHIPS
-- The error "Key (user_id)=... is not present in table profiles" means we have
-- users who signed up BEFORE the profiles table/trigger was working.
-- We need to manually create profile rows for them.
-- ==============================================================================

-- 1. Backfill missing profiles from auth.users
-- This grabs every user from the system and ensures they have a row in 'profiles'
insert into public.profiles (id, email, full_name, role)
select 
  id, 
  email, 
  coalesce(raw_user_meta_data->>'full_name', 'Unknown User'),
  coalesce(raw_user_meta_data->>'role', 'patient')
from auth.users
on conflict (id) do nothing;

-- 2. NOW we can safely add the Foreign Key Constraint
alter table public.appointments
  drop constraint if exists appointments_user_id_fkey,
  add constraint appointments_user_id_fkey
  foreign key (user_id)
  references public.profiles (id)
  on delete cascade;

-- 3. Comment on the constraint
comment on constraint appointments_user_id_fkey on public.appointments is 
  'Links an appointment to a user profile.';
