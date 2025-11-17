-- COMPLETE FIX FOR NEW ROLES
-- This script will properly add the new roles to your database
-- Run this in Supabase SQL Editor

-- Step 1: Check current role column type and constraints
-- First, let's see what we're working with
DO $$ 
DECLARE
    constraint_exists boolean;
BEGIN
    -- Check if there's a check constraint on the role column
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.constraint_column_usage 
        WHERE table_name = 'profiles' 
        AND column_name = 'role'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        RAISE NOTICE 'Constraint exists on role column';
    ELSE
        RAISE NOTICE 'No constraint on role column';
    END IF;
END $$;

-- Step 2: Drop ALL existing constraints on the role column
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN 
        SELECT con.conname
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE rel.relname = 'profiles'
        AND att.attname = 'role'
        AND con.contype = 'c'
    LOOP
        EXECUTE format('ALTER TABLE profiles DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Step 3: If role is an ENUM type, we need to handle it differently
-- First, check if user_role enum exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        -- Drop the enum constraint if it exists
        ALTER TABLE profiles ALTER COLUMN role TYPE TEXT;
        RAISE NOTICE 'Converted role column from ENUM to TEXT';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Role column is already TEXT or conversion not needed';
END $$;

-- Step 4: Ensure role column is TEXT type
ALTER TABLE profiles ALTER COLUMN role TYPE TEXT;

-- Step 5: Add new check constraint with ALL roles (including new ones)
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN (
    'user', 
    'admin', 
    'team_leader', 
    'sales_executive', 
    'sales_team_leader', 
    'operations_team_leader', 
    'operations_team'
));

-- Step 6: Update or create the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        name = COALESCE(EXCLUDED.name, profiles.name),
        email = COALESCE(EXCLUDED.email, profiles.email),
        role = COALESCE(EXCLUDED.role, profiles.role);
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Step 7: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Step 8: Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Step 9: Verify the setup
DO $$ 
BEGIN
    RAISE NOTICE '=== SETUP COMPLETE ===';
    RAISE NOTICE 'Profiles table now accepts these roles:';
    RAISE NOTICE '- user';
    RAISE NOTICE '- admin';
    RAISE NOTICE '- team_leader';
    RAISE NOTICE '- sales_executive';
    RAISE NOTICE '- sales_team_leader (NEW)';
    RAISE NOTICE '- operations_team_leader (NEW)';
    RAISE NOTICE '- operations_team (NEW)';
    RAISE NOTICE '======================';
END $$;

-- Step 10: Test query to verify (optional - uncomment to test)
-- SELECT column_name, data_type, character_maximum_length
-- FROM information_schema.columns
-- WHERE table_name = 'profiles' AND column_name = 'role';
