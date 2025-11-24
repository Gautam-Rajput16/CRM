-- Attendance Tracking System Schema
-- This migration creates the attendance_records table with proper RLS policies

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('login', 'logout')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  image_data TEXT, -- Base64 encoded image
  browser_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_attendance_event_type ON attendance_records(event_type);
CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON attendance_records(created_at);

-- Enable Row Level Security
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "allow_users_view_own_attendance" ON attendance_records;
DROP POLICY IF EXISTS "allow_users_insert_own_attendance" ON attendance_records;
DROP POLICY IF EXISTS "allow_admins_view_all_attendance" ON attendance_records;

-- Policy 1: Users can view their own attendance records
CREATE POLICY "allow_users_view_own_attendance"
  ON attendance_records FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Non-admin users can insert their own attendance records
CREATE POLICY "allow_users_insert_own_attendance"
  ON attendance_records FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND 
    user_role != 'admin'
  );

-- Policy 3: Admins and team leaders can view all attendance records
CREATE POLICY "allow_admins_view_all_attendance"
  ON attendance_records FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'team_leader', 'sales_team_leader', 'operations_team_leader')
  );

-- Grant necessary permissions
GRANT ALL ON attendance_records TO authenticated;
GRANT ALL ON attendance_records TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Attendance tracking schema created successfully!';
  RAISE NOTICE 'Table: attendance_records';
  RAISE NOTICE 'Indexes: idx_attendance_user_id, idx_attendance_timestamp, idx_attendance_event_type, idx_attendance_created_at';
  RAISE NOTICE 'RLS Policies: allow_users_view_own_attendance, allow_users_insert_own_attendance, allow_admins_view_all_attendance';
END $$;
