-- FIX INFINITE RECURSION ERROR IN RLS POLICIES
-- This fixes the circular reference in profiles table policies
-- Run this in Supabase SQL Editor

-- Step 1: Disable RLS temporarily to fix the issue
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on profiles table
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

-- Step 3: Create SIMPLE, NON-RECURSIVE policies

-- Policy 1: Allow users to read their own profile
CREATE POLICY "allow_read_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Allow users to update their own profile
CREATE POLICY "allow_update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Allow service role to do everything (for user creation)
CREATE POLICY "allow_service_role_all"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 4: Allow authenticated users to read all profiles
-- This is needed for admin/team leader checks in OTHER tables
CREATE POLICY "allow_read_all_profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Policy 5: Allow insert for new user creation
CREATE POLICY "allow_insert_profiles"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (true);

-- Step 4: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify the handle_new_user function is correct
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
END;
$$;

-- Step 6: Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Fix tasks table policies (remove recursive profile checks)
DROP POLICY IF EXISTS "Users can view their assigned tasks" ON tasks;
CREATE POLICY "Users can view their assigned tasks"
ON tasks FOR SELECT
TO authenticated
USING (
    assigned_to = auth.uid()
    OR assigned_by = auth.uid()
);

DROP POLICY IF EXISTS "Admins and team leaders can view all tasks" ON tasks;
CREATE POLICY "Admins and team leaders can view all tasks"
ON tasks FOR SELECT
TO authenticated
USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'team_leader')
);

DROP POLICY IF EXISTS "Admins and team leaders can create tasks" ON tasks;
CREATE POLICY "Admins and team leaders can create tasks"
ON tasks FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'team_leader')
);

DROP POLICY IF EXISTS "Users can update their tasks" ON tasks;
CREATE POLICY "Users can update their tasks"
ON tasks FOR UPDATE
TO authenticated
USING (
    assigned_to = auth.uid()
    OR assigned_by = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'team_leader')
);

DROP POLICY IF EXISTS "Admins and team leaders can delete tasks" ON tasks;
CREATE POLICY "Admins and team leaders can delete tasks"
ON tasks FOR DELETE
TO authenticated
USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'team_leader')
);

-- Step 8: Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO anon;

-- Step 9: Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ INFINITE RECURSION FIXED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS policies have been recreated without recursion';
    RAISE NOTICE 'Your application should work now';
    RAISE NOTICE '========================================';
END $$;
