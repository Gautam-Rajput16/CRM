-- Add DELETE policy for attendance_records table
-- This allows authenticated users to delete attendance records
-- Note: You should add additional checks based on your user role system

-- Option 1: Allow all authenticated users to delete (simplest, but less secure)
CREATE POLICY "allow_authenticated_delete_attendance"
ON attendance_records
FOR DELETE
TO authenticated
USING (true);

-- If you want to restrict to admins only, you'll need to check how your app stores user roles
-- The role might be stored in:
-- 1. auth.users metadata (raw_user_meta_data or user_metadata)
-- 2. A separate profiles/users table
-- 3. The attendance_records table itself (user_role column)

-- Option 2: Only allow deletion of own records (more secure)
-- Uncomment this if you prefer users can only delete their own records:
-- CREATE POLICY "allow_users_delete_own_attendance"
-- ON attendance_records
-- FOR DELETE
-- TO authenticated
-- USING (user_id = auth.uid()::text);

-- Verify the policy was created
DO $$
BEGIN
  RAISE NOTICE 'Added DELETE policy for authenticated users on attendance_records table';
END $$;
