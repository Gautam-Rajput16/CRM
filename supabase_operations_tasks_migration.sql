-- Create operations_tasks table for operations team task management
CREATE TABLE IF NOT EXISTS operations_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to_name TEXT,
  assigned_by_name TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[]
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_operations_tasks_assigned_to ON operations_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_operations_tasks_assigned_by ON operations_tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_operations_tasks_status ON operations_tasks(status);
CREATE INDEX IF NOT EXISTS idx_operations_tasks_priority ON operations_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_operations_tasks_due_date ON operations_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_operations_tasks_created_at ON operations_tasks(created_at);

-- Enable Row Level Security
ALTER TABLE operations_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Admin and Operations Team Leader can see all tasks
CREATE POLICY "Admin and Operations TL can view all tasks"
ON operations_tasks FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('admin', 'operations_team_leader')
  )
);

-- Policy: Operations team members can only see their assigned tasks
CREATE POLICY "Operations team can view assigned tasks"
ON operations_tasks FOR SELECT
USING (
  assigned_to = auth.uid() 
  AND auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role = 'operations_team'
  )
);

-- Policy: Admin and Operations Team Leader can create tasks
CREATE POLICY "Admin and Operations TL can create tasks"
ON operations_tasks FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('admin', 'operations_team_leader')
  )
);

-- Policy: Admin and Operations Team Leader can update all tasks
CREATE POLICY "Admin and Operations TL can update all tasks"
ON operations_tasks FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('admin', 'operations_team_leader')
  )
);

-- Policy: Operations team members can update their assigned tasks (status only)
CREATE POLICY "Operations team can update assigned tasks"
ON operations_tasks FOR UPDATE
USING (
  assigned_to = auth.uid() 
  AND auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role = 'operations_team'
  )
);

-- Policy: Admin and Operations Team Leader can delete tasks
CREATE POLICY "Admin and Operations TL can delete tasks"
ON operations_tasks FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('admin', 'operations_team_leader')
  )
);

-- Create a function to automatically update assigned_to_name and assigned_by_name
CREATE OR REPLACE FUNCTION update_operations_task_names()
RETURNS TRIGGER AS $$
BEGIN
  -- Get assigned_to name
  SELECT name INTO NEW.assigned_to_name
  FROM profiles
  WHERE id = NEW.assigned_to;
  
  -- Get assigned_by name
  SELECT name INTO NEW.assigned_by_name
  FROM profiles
  WHERE id = NEW.assigned_by;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update names on insert or update
CREATE TRIGGER trigger_update_operations_task_names
BEFORE INSERT OR UPDATE ON operations_tasks
FOR EACH ROW
EXECUTE FUNCTION update_operations_task_names();

-- Grant necessary permissions
GRANT ALL ON operations_tasks TO authenticated;
