-- Call Logs Table Schema
-- This table tracks every call made by employees to leads

CREATE TABLE call_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    lead_name TEXT NOT NULL,
    lead_phone TEXT NOT NULL,
    call_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    call_type TEXT DEFAULT 'outbound' CHECK (call_type IN ('outbound', 'inbound')),
    call_duration INTEGER DEFAULT 0, -- Duration in seconds (can be updated later if needed)
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX idx_call_logs_employee_id ON call_logs(employee_id);
CREATE INDEX idx_call_logs_lead_id ON call_logs(lead_id);
CREATE INDEX idx_call_logs_timestamp ON call_logs(call_timestamp);

-- Add RLS (Row Level Security) policies
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view call logs (simplified - let application handle filtering)
CREATE POLICY "Users can view call logs" ON call_logs
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policy: Users can insert call logs
CREATE POLICY "Users can insert call logs" ON call_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can update call logs
CREATE POLICY "Users can update call logs" ON call_logs
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Policy: Users can delete call logs
CREATE POLICY "Users can delete call logs" ON call_logs
    FOR DELETE USING (auth.uid() IS NOT NULL);
