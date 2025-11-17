-- Status Change Logs Table Schema
-- This table tracks every status change made to leads for audit and reporting

CREATE TABLE status_change_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_name TEXT NOT NULL,
    old_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    change_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    change_reason TEXT, -- Optional reason for the status change
    notes TEXT, -- Additional notes about the change
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX idx_status_change_logs_lead_id ON status_change_logs(lead_id);
CREATE INDEX idx_status_change_logs_employee_id ON status_change_logs(employee_id);
CREATE INDEX idx_status_change_logs_timestamp ON status_change_logs(change_timestamp);
CREATE INDEX idx_status_change_logs_new_status ON status_change_logs(new_status);
CREATE INDEX idx_status_change_logs_old_status ON status_change_logs(old_status);

-- Add RLS (Row Level Security) policies
ALTER TABLE status_change_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view status change logs (simplified - let application handle filtering)
CREATE POLICY "Users can view status changes" ON status_change_logs
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policy: Users can insert status change logs
CREATE POLICY "Users can insert status changes" ON status_change_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can update status change logs
CREATE POLICY "Users can update status changes" ON status_change_logs
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Policy: Users can delete status change logs
CREATE POLICY "Users can delete status changes" ON status_change_logs
    FOR DELETE USING (auth.uid() IS NOT NULL);
