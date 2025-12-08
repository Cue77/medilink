-- ==============================================================================
-- 1. SETUP PROFILES TABLE
-- Ensure we have a table to store user roles (patient vs doctor)
-- ==============================================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role text default 'patient', -- 'patient' or 'doctor'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- ==============================================================================
-- 2. AUTOMATIC PROFILE CREATION (TRIGGER)
-- Automatically creates a profile row when a user signs up via Supabase Auth
-- ==============================================================================
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
end;
$$ language plpgsql security definer;

-- Bind the trigger to the auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================================================================
-- 3. PROFILES POLICIES
-- Who can see/edit profiles?
-- ==============================================================================

-- Everyone can read profiles (needed for the Doctor Dashboard to see patient names)
create policy "Public profiles are viewable by everyone" 
  on profiles for select 
  using ( true );

-- Users can update their own profile
create policy "Users can update own profile" 
  on profiles for update 
  using ( auth.uid() = id );

-- ==============================================================================
-- 4. APPOINTMENTS POLICIES (THE CORE SECURITY)
-- Shared Clinic Model: Doctors see ALL, Patients see OWN
-- ==============================================================================

-- Enable RLS
alter table public.appointments enable row level security;

-- Policy 1: Patients can see their own appointments
create policy "Patients view own appointments" 
  on appointments for select 
  using ( auth.uid() = user_id );

-- Policy 2: Doctors can see ALL appointments
create policy "Doctors view all appointments" 
  on appointments for select 
  using ( 
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'doctor'
    )
  );

-- Policy 3: Patients can insert (book) their own appointments
create policy "Patients insert own appointments" 
  on appointments for insert 
  with check ( auth.uid() = user_id );

-- Policy 4: Doctors can update appointments (Approve/Cancel)
create policy "Doctors update appointments" 
  on appointments for update 
  using ( 
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'doctor'
    )
  );

-- Policy 5: Patients can delete/cancel their own appointments
create policy "Patients delete own appointments" 
  on appointments for delete 
  using ( auth.uid() = user_id );
