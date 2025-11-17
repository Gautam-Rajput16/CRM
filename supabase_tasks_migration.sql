-- Task Management System Migration
-- This SQL script creates the tasks table for the CRM task management feature

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to_name TEXT NOT NULL,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by_name TEXT NOT NULL,
  due_date DATE NOT NULL,
  due_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  related_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  related_lead_name TEXT,
  notes TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_related_lead_id ON tasks(related_lead_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on task updates
DROP TRIGGER IF EXISTS tasks_updated_at_trigger ON tasks;
CREATE TRIGGER tasks_updated_at_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Policy: Users can view tasks assigned to them
CREATE POLICY "Users can view their assigned tasks"
  ON tasks
  FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR assigned_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'team_leader')
    )
  );

-- Policy: Admins and team leaders can insert tasks
CREATE POLICY "Admins and team leaders can create tasks"
  ON tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'team_leader')
    )
  );

-- Policy: Admins, team leaders, and assigned users can update tasks
CREATE POLICY "Users can update their tasks"
  ON tasks
  FOR UPDATE
  USING (
    assigned_to = auth.uid()
    OR assigned_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'team_leader')
    )
  );

-- Policy: Admins and team leaders can delete tasks
CREATE POLICY "Admins and team leaders can delete tasks"
  ON tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'team_leader')
    )
  );

-- Grant necessary permissions
GRANT ALL ON tasks TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE tasks IS 'Task management system for CRM - stores tasks assigned to employees';
COMMENT ON COLUMN tasks.id IS 'Unique identifier for the task';
COMMENT ON COLUMN tasks.title IS 'Task title/summary';
COMMENT ON COLUMN tasks.description IS 'Detailed description of the task';
COMMENT ON COLUMN tasks.priority IS 'Task priority: low, medium, high, urgent';
COMMENT ON COLUMN tasks.status IS 'Task status: pending, in_progress, completed, cancelled';
COMMENT ON COLUMN tasks.assigned_to IS 'User ID of the employee assigned to this task';
COMMENT ON COLUMN tasks.assigned_by IS 'User ID of the admin/team leader who created the task';
COMMENT ON COLUMN tasks.due_date IS 'Date when the task is due';
COMMENT ON COLUMN tasks.due_time IS 'Optional time when the task is due';
COMMENT ON COLUMN tasks.tags IS 'Array of tags for categorizing tasks';
COMMENT ON COLUMN tasks.related_lead_id IS 'Optional reference to a related lead';
COMMENT ON COLUMN tasks.notes IS 'Additional notes or updates on the task';
