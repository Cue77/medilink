-- ==============================================================================
-- FIX RELATIONSHIPS (PGRST200 Error)
-- The error "Could not find a relationship" means Supabase doesn't know that
-- appointments.user_id is related to the profiles table.
-- We need to explicitly add a Foreign Key constraint.
-- ==============================================================================

-- 1. Add the Foreign Key Constraint
-- This tells Supabase: "The user_id in appointments points to the id in profiles"
alter table public.appointments
  drop constraint if exists appointments_user_id_fkey, -- Drop old one if it points to auth.users
  add constraint appointments_user_id_fkey
  foreign key (user_id)
  references public.profiles (id)
  on delete cascade;

-- 2. Comment on the constraint (Optional, but helps PostgREST sometimes)
comment on constraint appointments_user_id_fkey on public.appointments is 
  'Links an appointment to a user profile.';
