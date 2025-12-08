-- ==============================================================================
-- ADD CLINIC DETAILS
-- Adds clinic_name and clinic_address to profiles and updates the trigger.
-- ==============================================================================

-- 1. Add Columns (Idempotent)
do $$
begin
    alter table public.profiles add column if not exists clinic_name text;
    alter table public.profiles add column if not exists clinic_address text;
exception
    when others then null;
end $$;

-- 2. Update Trigger Function to handle new fields
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, clinic_name, clinic_address)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    new.raw_user_meta_data->>'clinic_name',
    new.raw_user_meta_data->>'clinic_address'
  );
  return new;
exception
  when others then
    -- Log the error to Supabase/Postgres logs for debugging
    raise warning 'Profile creation failed for user %: %', new.id, SQLERRM;
    -- Return new to allow the auth user to be created regardless
    return new;
end;
$$ language plpgsql security definer;
