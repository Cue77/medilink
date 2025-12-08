-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- Function to create a verified user directly
create or replace function create_demo_user(
    user_email text,
    user_password text,
    user_role text,
    user_full_name text
) returns void as $$
declare
    new_user_id uuid;
    encrypted_pw text;
begin
    -- Check if user already exists
    if exists (select 1 from auth.users where email = user_email) then
        raise notice 'User % already exists', user_email;
        return;
    end if;

    new_user_id := gen_random_uuid();
    encrypted_pw := crypt(user_password, gen_salt('bf'));

    -- Insert into auth.users
    insert into auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token
    ) values (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        user_email,
        encrypted_pw,
        now(), -- Auto-confirm
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object('role', user_role, 'full_name', user_full_name),
        now(),
        now(),
        '',
        ''
    );

    -- The handle_new_user trigger will automatically create the profile
    raise notice 'Created user: % with role: %', user_email, user_role;
end;
$$ language plpgsql security definer;

-- EXAMPLE USAGE:
-- select create_demo_user('doctor@demo.com', 'password123', 'doctor', 'Dr. Demo');
-- select create_demo_user('patient@demo.com', 'password123', 'patient', 'Patient Demo');
