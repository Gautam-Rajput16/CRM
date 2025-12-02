-- Add DELETE policies for activity tracking tables
-- This allows only ADMIN users to delete call logs and status change logs

-- DELETE policy for call_logs table (admin only)
CREATE POLICY "allow_admins_delete_call_logs"
ON call_logs
FOR DELETE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  OR
  (auth.jwt() -> 'raw_user_meta_data' ->> 'role') = 'admin'
);

-- DELETE policy for status_change_logs table (admin only)
CREATE POLICY "allow_admins_delete_status_logs"
ON status_change_logs
FOR DELETE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  OR
  (auth.jwt() -> 'raw_user_meta_data' ->> 'role') = 'admin'
);

-- Verify the policies were created
DO $$
BEGIN
  RAISE NOTICE 'Added DELETE policies for admins only on call_logs and status_change_logs tables';
END $$;
