-- ROLLBACK SCRIPT - Restore Database to Original State
-- This will undo all changes made by fix_roles_final.sql
-- Run this in Supabase SQL Editor

-- Step 1: Drop the new check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Drop ALL current RLS policies on profiles
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

-- Step 3: Restore ORIGINAL RLS policies for profiles (with only 4 original roles)
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
        AND profiles.role IN ('admin', 'team_leader')
    )
);

-- Policy: Enable insert for service role
CREATE POLICY "Enable insert for service role"
ON profiles FOR INSERT
WITH CHECK (true);

-- Step 4: Add back the ORIGINAL check constraint (only 4 roles)
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'admin', 'team_leader', 'sales_executive'));

-- Step 5: Restore ORIGINAL handle_new_user function
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

-- Step 6: Restore ORIGINAL task policies (only admin and team_leader)
DROP POLICY IF EXISTS "Users can view their assigned tasks" ON tasks;
CREATE POLICY "Users can view their assigned tasks"
ON tasks FOR SELECT
USING (
    assigned_to = auth.uid()
    OR assigned_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'team_leader')
    )
);

DROP POLICY IF EXISTS "Admins and team leaders can create tasks" ON tasks;
CREATE POLICY "Admins and team leaders can create tasks"
ON tasks FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'team_leader')
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
        AND profiles.role IN ('admin', 'team_leader')
    )
);

DROP POLICY IF EXISTS "Admins and team leaders can delete tasks" ON tasks;
CREATE POLICY "Admins and team leaders can delete tasks"
ON tasks FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'team_leader')
    )
);

-- Step 7: Drop operations_tasks table if it was created
DROP TABLE IF EXISTS operations_tasks CASCADE;

-- Step 8: Delete any users with new roles (OPTIONAL - uncomment if needed)
-- WARNING: This will delete users with the new roles!
-- DELETE FROM auth.users 
-- WHERE id IN (
--     SELECT id FROM profiles 
--     WHERE role IN ('sales_team_leader', 'operations_team_leader', 'operations_team')
-- );

-- DELETE FROM profiles 
-- WHERE role IN ('sales_team_leader', 'operations_team_leader', 'operations_team');

-- Step 9: Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ ROLLBACK COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database restored to original state with:';
    RAISE NOTICE '  1. user';
    RAISE NOTICE '  2. admin';
    RAISE NOTICE '  3. team_leader';
    RAISE NOTICE '  4. sales_executive';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'New roles have been removed';
    RAISE NOTICE 'All policies restored to original';
    RAISE NOTICE '========================================';
END $$;
