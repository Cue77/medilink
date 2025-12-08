-- Add missing columns to profiles table
alter table profiles 
add column if not exists phone_number text,
add column if not exists address text;

-- Update the handle_new_user function to include these fields if they are passed in metadata
-- Note: The trigger usually copies from raw_user_meta_data. 
-- We need to ensure the trigger function maps these correctly.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role, clinic_name, clinic_address, nhs_number, phone_number, address)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    new.raw_user_meta_data->>'clinic_name',
    new.raw_user_meta_data->>'clinic_address',
    new.raw_user_meta_data->>'nhs_number',
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'address'
  );
  return new;
end;
$$;
