-- Task Daily Updates Schema
-- This table stores daily progress updates from employees on their assigned tasks

CREATE TABLE IF NOT EXISTS task_daily_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  update_date DATE NOT NULL DEFAULT CURRENT_DATE,
  progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  status_update TEXT,
  work_completed TEXT NOT NULL,
  challenges_faced TEXT,
  next_day_plan TEXT,
  hours_worked DECIMAL(4,2) CHECK (hours_worked >= 0 AND hours_worked <= 24),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_task_daily_updates_task_id ON task_daily_updates(task_id);
CREATE INDEX IF NOT EXISTS idx_task_daily_updates_user_id ON task_daily_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_task_daily_updates_date ON task_daily_updates(update_date);
CREATE INDEX IF NOT EXISTS idx_task_daily_updates_task_user_date ON task_daily_updates(task_id, user_id, update_date);

-- Create unique constraint to prevent multiple updates per day per task per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_daily_update ON task_daily_updates(task_id, user_id, update_date);

-- Enable RLS (Row Level Security)
ALTER TABLE task_daily_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see and modify their own updates
CREATE POLICY "Users can view their own task updates" ON task_daily_updates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task updates" ON task_daily_updates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task updates" ON task_daily_updates
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins and team leaders can view all updates
CREATE POLICY "Admins can view all task updates" ON task_daily_updates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'team_leader', 'sales_team_leader', 'operations_team_leader')
    )
  );

-- Trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_task_daily_updates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_daily_updates_updated_at
  BEFORE UPDATE ON task_daily_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_task_daily_updates_updated_at();

-- Comments for documentation
COMMENT ON TABLE task_daily_updates IS 'Daily progress updates from employees on their assigned tasks';
COMMENT ON COLUMN task_daily_updates.task_id IS 'Reference to the task being updated';
COMMENT ON COLUMN task_daily_updates.user_id IS 'User who submitted the update';
COMMENT ON COLUMN task_daily_updates.user_name IS 'Name of the user for display purposes';
COMMENT ON COLUMN task_daily_updates.update_date IS 'Date of the update (one per day per task)';
COMMENT ON COLUMN task_daily_updates.progress_percentage IS 'Overall progress percentage (0-100)';
COMMENT ON COLUMN task_daily_updates.status_update IS 'Current status or milestone reached';
COMMENT ON COLUMN task_daily_updates.work_completed IS 'Description of work completed today';
COMMENT ON COLUMN task_daily_updates.challenges_faced IS 'Any challenges or blockers encountered';
COMMENT ON COLUMN task_daily_updates.next_day_plan IS 'Plan for the next working day';
COMMENT ON COLUMN task_daily_updates.hours_worked IS 'Number of hours worked on this task today';
