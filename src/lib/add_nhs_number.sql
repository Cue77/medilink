-- ==============================================================================
-- ADD NHS NUMBER
-- Adds nhs_number to profiles and updates the trigger.
-- ==============================================================================

-- 1. Add Column (Idempotent)
do $$
begin
    alter table public.profiles add column if not exists nhs_number text;
exception
    when others then null;
end $$;

-- 2. Update Trigger Function to handle new fields (including NHS number if we wanted to capture it at signup, but for now just preserving existing logic + new column support)
-- Actually, we just need the column. The update logic in Profile.tsx handles the rest.
-- But let's keep the handle_new_user consistent just in case we add it to signup later.

create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, clinic_name, clinic_address, nhs_number)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    new.raw_user_meta_data->>'clinic_name',
    new.raw_user_meta_data->>'clinic_address',
    new.raw_user_meta_data->>'nhs_number'
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
