-- ==============================================================================
-- FIX SCRIPT: ROBUST PROFILE CREATION
-- This script fixes the "Database error" by adding error handling to the trigger
-- and ensuring the profiles table structure is correct.
-- ==============================================================================

-- 1. Drop the trigger temporarily to unblock signups
drop trigger if exists on_auth_user_created on auth.users;

-- 2. Ensure the profiles table exists and has the right columns
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role text default 'patient',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Safely ensure columns exist (idempotent)
do $$
begin
    alter table public.profiles add column if not exists email text;
    alter table public.profiles add column if not exists full_name text;
    alter table public.profiles add column if not exists role text default 'patient';
exception
    when others then null;
end $$;

-- 3. Re-create the function with ERROR HANDLING (Graceful Degradation)
-- If profile creation fails, we log a warning but DO NOT block the user signup.
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'patient')
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

-- 4. Re-bind the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
