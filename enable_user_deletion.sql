-- ENABLE USER DELETION FROM CLIENT SIDE
-- This creates a database trigger that automatically deletes auth users
-- when their profile is deleted, allowing client-side deletion to work
-- Run this in Supabase SQL Editor

-- Step 1: Create a function to delete auth user when profile is deleted
CREATE OR REPLACE FUNCTION delete_auth_user_on_profile_delete()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete the user from auth.users
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the profile deletion
    RAISE WARNING 'Could not delete auth user: %', SQLERRM;
    RETURN OLD;
END;
$$;

-- Step 2: Create trigger on profiles table
DROP TRIGGER IF EXISTS trigger_delete_auth_user ON profiles;
CREATE TRIGGER trigger_delete_auth_user
  AFTER DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION delete_auth_user_on_profile_delete();

-- Step 3: Grant necessary permissions for the function
GRANT EXECUTE ON FUNCTION delete_auth_user_on_profile_delete() TO authenticated;

-- Step 4: Update RLS policy to allow admins to delete profiles
DROP POLICY IF EXISTS "allow_admin_delete_profiles" ON profiles;
CREATE POLICY "allow_admin_delete_profiles"
ON profiles FOR DELETE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Step 5: Also need to handle cascade deletes for related tables
-- Update tasks to handle user deletion
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;
ALTER TABLE tasks ADD CONSTRAINT tasks_assigned_to_fkey 
  FOREIGN KEY (assigned_to) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assigned_by_fkey;
ALTER TABLE tasks ADD CONSTRAINT tasks_assigned_by_fkey 
  FOREIGN KEY (assigned_by) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

-- Update operations_tasks if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operations_tasks') THEN
    ALTER TABLE operations_tasks DROP CONSTRAINT IF EXISTS operations_tasks_assigned_to_fkey;
    ALTER TABLE operations_tasks ADD CONSTRAINT operations_tasks_assigned_to_fkey 
      FOREIGN KEY (assigned_to) 
      REFERENCES auth.users(id) 
      ON DELETE CASCADE;

    ALTER TABLE operations_tasks DROP CONSTRAINT IF EXISTS operations_tasks_assigned_by_fkey;
    ALTER TABLE operations_tasks ADD CONSTRAINT operations_tasks_assigned_by_fkey 
      FOREIGN KEY (assigned_by) 
      REFERENCES auth.users(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- Step 6: Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ USER DELETION ENABLED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Admins can now delete users from the client';
    RAISE NOTICE 'Auth users will be automatically deleted';
    RAISE NOTICE 'when their profile is deleted';
    RAISE NOTICE '========================================';
END $$;
