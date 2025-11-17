-- RLS Policies for Task Assignment by Team Leaders
-- This file contains the necessary RLS policies to allow:
-- 1. Operations Team Leaders to assign tasks to Operations Team members
-- 2. Sales Team Leaders to assign tasks to Sales Executive members

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "task_insert_policy" ON tasks;
DROP POLICY IF EXISTS "task_select_policy" ON tasks;
DROP POLICY IF EXISTS "task_update_policy" ON tasks;
DROP POLICY IF EXISTS "task_delete_policy" ON tasks;

-- Enable RLS on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 1. INSERT Policy: Allow task creation for team leaders only
CREATE POLICY "task_insert_policy" ON tasks
FOR INSERT
WITH CHECK (
  -- Allow operations_team_leader to assign tasks to operations_team members
  (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'operations_team_leader'
    )
    AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = assigned_to 
      AND profiles.role IN ('operations_team', 'operations_team_leader')
    )
  )
  OR
  -- Allow sales_team_leader to assign tasks to sales_executive members
  (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'sales_team_leader'
    )
    AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = assigned_to 
      AND profiles.role IN ('sales_executive', 'sales_team_leader')
    )
  )
  OR
  -- Allow users to create tasks for themselves
  (assigned_to = auth.uid())
);

-- 2. SELECT Policy: Allow viewing tasks for team leaders only
CREATE POLICY "task_select_policy" ON tasks
FOR SELECT
USING (
  -- Allow operations_team_leader to see tasks assigned to operations team
  (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'operations_team_leader'
    )
    AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = assigned_to 
      AND profiles.role IN ('operations_team', 'operations_team_leader')
    )
  )
  OR
  -- Allow sales_team_leader to see tasks assigned to sales team
  (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'sales_team_leader'
    )
    AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = assigned_to 
      AND profiles.role IN ('sales_executive', 'sales_team_leader')
    )
  )
  OR
  -- Allow users to see their own assigned tasks
  (assigned_to = auth.uid())
  OR
  -- Allow users to see tasks they created
  (assigned_by = auth.uid())
);

-- 3. UPDATE Policy: Allow updating tasks for team leaders only
CREATE POLICY "task_update_policy" ON tasks
FOR UPDATE
USING (
  -- Allow operations_team_leader to update tasks assigned to operations team
  (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'operations_team_leader'
    )
    AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = assigned_to 
      AND profiles.role IN ('operations_team', 'operations_team_leader')
    )
  )
  OR
  -- Allow sales_team_leader to update tasks assigned to sales team
  (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'sales_team_leader'
    )
    AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = assigned_to 
      AND profiles.role IN ('sales_executive', 'sales_team_leader')
    )
  )
  OR
  -- Allow users to update their own assigned tasks (status changes)
  (assigned_to = auth.uid())
  OR
  -- Allow users to update tasks they created
  (assigned_by = auth.uid())
);

-- 4. DELETE Policy: Allow deleting tasks for team leaders only
CREATE POLICY "task_delete_policy" ON tasks
FOR DELETE
USING (
  -- Allow operations_team_leader to delete tasks assigned to operations team
  (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'operations_team_leader'
    )
    AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = assigned_to 
      AND profiles.role IN ('operations_team', 'operations_team_leader')
    )
  )
  OR
  -- Allow sales_team_leader to delete tasks assigned to sales team
  (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'sales_team_leader'
    )
    AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = assigned_to 
      AND profiles.role IN ('sales_executive', 'sales_team_leader')
    )
  )
  OR
  -- Allow users to delete tasks they created
  (assigned_by = auth.uid())
);

-- Additional policy for profiles table to ensure team leaders can read team member profiles
-- This is needed for the task assignment dropdowns to work properly

-- Drop existing profile policies if they exist
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;

-- Create new profiles select policy for team leaders only
CREATE POLICY "profiles_select_policy" ON profiles
FOR SELECT
USING (
  -- Allow operations_team_leader to see operations team profiles
  (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'operations_team_leader'
    )
    AND
    role IN ('operations_team', 'operations_team_leader')
  )
  OR
  -- Allow sales_team_leader to see sales team profiles
  (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'sales_team_leader'
    )
    AND
    role IN ('sales_executive', 'sales_team_leader')
  )
  OR
  -- Allow users to see their own profile
  (id = auth.uid())
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;
GRANT SELECT ON profiles TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
