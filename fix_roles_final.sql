-- FINAL FIX FOR NEW ROLES - Handles RLS Policies
-- This script properly handles all dependencies before modifying the role column
-- Run this in Supabase SQL Editor

-- Step 1: Drop ALL RLS policies on profiles table that reference the role column
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Step 2: Drop ALL check constraints on the role column
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

-- Step 3: Now safely alter the column to TEXT (if it's not already)
DO $$ 
BEGIN
    ALTER TABLE profiles ALTER COLUMN role TYPE TEXT;
    RAISE NOTICE 'Role column is now TEXT type';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Role column already TEXT or no conversion needed: %', SQLERRM;
END $$;

-- Step 4: Add the new check constraint with ALL 7 roles
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

-- Step 5: Recreate essential RLS policies for profiles table
-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Policy: Admins and team leaders can view all profiles
CREATE POLICY "Admins and team leaders can view all profiles"
ON profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'team_leader', 'sales_team_leader', 'operations_team_leader')
    )
);

-- Policy: Enable insert for service role (for user creation)
CREATE POLICY "Enable insert for service role"
ON profiles FOR INSERT
WITH CHECK (true);

-- Step 6: Update the handle_new_user function
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

-- Step 7: Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Step 8: Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO anon;

-- Step 9: Update RLS policies for tasks table to include new roles
DROP POLICY IF EXISTS "Users can view their assigned tasks" ON tasks;
CREATE POLICY "Users can view their assigned tasks"
ON tasks FOR SELECT
USING (
    assigned_to = auth.uid()
    OR assigned_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'team_leader', 'sales_team_leader')
    )
);

DROP POLICY IF EXISTS "Admins and team leaders can create tasks" ON tasks;
CREATE POLICY "Admins and team leaders can create tasks"
ON tasks FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'team_leader', 'sales_team_leader')
    )
);

DROP POLICY IF EXISTS "Users can update their tasks" ON tasks;
CREATE POLICY "Users can update their tasks"
ON tasks FOR UPDATE
USING (
    assigned_to = auth.uid()
    OR assigned_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'team_leader', 'sales_team_leader')
    )
);

DROP POLICY IF EXISTS "Admins and team leaders can delete tasks" ON tasks;
CREATE POLICY "Admins and team leaders can delete tasks"
ON tasks FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'team_leader', 'sales_team_leader')
    )
);

-- Step 10: Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ SETUP COMPLETE - NEW ROLES ENABLED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Available roles:';
    RAISE NOTICE '  1. user';
    RAISE NOTICE '  2. admin';
    RAISE NOTICE '  3. team_leader';
    RAISE NOTICE '  4. sales_executive';
    RAISE NOTICE '  5. sales_team_leader (NEW)';
    RAISE NOTICE '  6. operations_team_leader (NEW)';
    RAISE NOTICE '  7. operations_team (NEW)';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'You can now create users with new roles!';
    RAISE NOTICE '========================================';
END $$;
