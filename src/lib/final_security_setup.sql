-- ==============================================================================
-- FINAL SECURITY SETUP
-- Run this script to apply all necessary permissions for the Doctor Dashboard.
-- ==============================================================================

-- 1. ENABLE RLS (Safe to run multiple times)
alter table public.profiles enable row level security;
alter table public.appointments enable row level security;

-- 2. RESET POLICIES (Drop old ones to avoid conflicts)
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Patients view own appointments" on appointments;
drop policy if exists "Doctors view all appointments" on appointments;
drop policy if exists "Patients insert own appointments" on appointments;
drop policy if exists "Doctors update appointments" on appointments;
drop policy if exists "Patients delete own appointments" on appointments;

-- 3. APPLY PROFILE POLICIES
-- Essential for the Doctor Dashboard to see patient names
create policy "Public profiles are viewable by everyone" 
  on profiles for select 
  using ( true );

create policy "Users can update own profile" 
  on profiles for update 
  using ( auth.uid() = id );

-- 4. APPLY APPOINTMENT POLICIES
-- Essential for loading the appointment list

-- Doctors can see ALL appointments
create policy "Doctors view all appointments" 
  on appointments for select 
  using ( 
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'doctor'
    )
  );

-- Patients can see ONLY their own
create policy "Patients view own appointments" 
  on appointments for select 
  using ( auth.uid() = user_id );

-- Patients can book appointments
create policy "Patients insert own appointments" 
  on appointments for insert 
  with check ( auth.uid() = user_id );

-- Doctors can update status (Approve/Cancel)
create policy "Doctors update appointments" 
  on appointments for update 
  using ( 
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'doctor'
    )
  );

-- Patients can cancel their own
create policy "Patients delete own appointments" 
  on appointments for delete 
  using ( auth.uid() = user_id );
