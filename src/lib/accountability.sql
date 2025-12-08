-- ==============================================================================
-- ACCOUNTABILITY & LOCKING SYSTEM
-- 1. Add doctor_id to track who owns the appointment.
-- 2. Update RLS to prevent "Rogue Doctors" from messing with others' patients.
-- ==============================================================================

-- 1. Add the doctor_id column (Audit Trail)
alter table public.appointments 
add column if not exists doctor_id uuid references public.profiles(id);

-- 2. Update RLS Policies for "Locking"

-- Drop old update policy
drop policy if exists "Doctors update appointments" on appointments;

-- Create new "Smart Locking" Policy
-- A doctor can UPDATE an appointment IF:
-- 1. They are a doctor AND
-- 2. (The appointment is 'pending' -> Anyone can claim it)
--    OR
--    (The appointment is ALREADY theirs -> doctor_id = auth.uid())
create policy "Doctors update appointments" 
  on appointments for update 
  using ( 
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'doctor'
    )
    and (
      status = 'pending'  -- Free for all
      or
      doctor_id = auth.uid() -- Locked to owner
    )
  );

-- Note: We don't need to change SELECT policies (Doctors can still SEE everything).
