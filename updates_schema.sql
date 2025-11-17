-- =====================================================
-- MEETING ASSIGNMENT FEATURE - DATABASE UPDATES
-- Only the NEW/CHANGED queries for existing CRM database
-- Date: October 2025
-- =====================================================

-- =====================================================
-- 1. ADD NEW COLUMNS FOR MEETING ASSIGNMENTS
-- =====================================================

-- Add new columns for meeting assignment (separate from lead assignment)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS meeting_assigned_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS meeting_assigned_user_name TEXT;

-- =====================================================
-- 2. UPDATE STATUS CONSTRAINT (if needed)
-- =====================================================

-- Update the status constraint to include 'Special Follow-up' if not already included
ALTER TABLE leads 
DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE leads 
ADD CONSTRAINT leads_status_check 
CHECK (status IN ('-', 'Follow-up', 'Special Follow-up', 'Confirmed', 'Not Connected', 'Interested', 'Not - Interested', 'Meeting'));

-- =====================================================
-- 3. UPDATE RLS POLICIES FOR MEETING ASSIGNMENTS
-- =====================================================

-- Drop existing policies to update them
DROP POLICY IF EXISTS "Users can view their own leads" ON leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON leads;
DROP POLICY IF EXISTS "Users can view updates for their leads" ON follow_up_updates;
DROP POLICY IF EXISTS "Users can insert updates for their leads" ON follow_up_updates;

-- UPDATED: Users can view leads they own, are assigned to, OR have meetings assigned to them
CREATE POLICY "Users can view their own leads" ON leads
    FOR SELECT USING (
        user_id = auth.uid() 
        OR assigned_user_id = auth.uid() 
        OR meeting_assigned_user_id = auth.uid()
    );

-- UPDATED: Users can update leads they own, are assigned to, OR have meetings assigned to them
CREATE POLICY "Users can update their own leads" ON leads
    FOR UPDATE USING (
        user_id = auth.uid() 
        OR assigned_user_id = auth.uid() 
        OR meeting_assigned_user_id = auth.uid()
    );

-- UPDATED: Users can view updates for their leads (including meeting assignments)
CREATE POLICY "Users can view updates for their leads" ON follow_up_updates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM leads
            WHERE leads.id = follow_up_updates.lead_id
            AND (
                leads.assigned_user_id = auth.uid() 
                OR leads.user_id = auth.uid()
                OR leads.meeting_assigned_user_id = auth.uid()
            )
        )
    );

-- UPDATED: Users can insert updates for their leads (including meeting assignments)
CREATE POLICY "Users can insert updates for their leads" ON follow_up_updates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM leads
            WHERE leads.id = follow_up_updates.lead_id
            AND (
                leads.assigned_user_id = auth.uid() 
                OR leads.user_id = auth.uid()
                OR leads.meeting_assigned_user_id = auth.uid()
            )
        )
    );

-- =====================================================
-- 4. ADD NEW INDEXES FOR PERFORMANCE
-- =====================================================

-- Add index for the new meeting assignment column
CREATE INDEX IF NOT EXISTS idx_leads_meeting_assigned_user_id ON leads(meeting_assigned_user_id);

-- =====================================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

-- Add comments for the new columns
COMMENT ON COLUMN leads.meeting_assigned_user_id IS 'User assigned to handle meetings for this lead (separate from lead owner)';
COMMENT ON COLUMN leads.meeting_assigned_user_name IS 'Name of user assigned to handle meetings';

-- =====================================================
-- 6. VERIFICATION QUERIES
-- =====================================================

-- Verify the new columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name IN ('meeting_assigned_user_id', 'meeting_assigned_user_name');

-- Verify the updated RLS policies
SELECT policyname, permissive, cmd, qual 
FROM pg_policies 
WHERE tablename = 'leads' 
AND policyname IN ('Users can view their own leads', 'Users can update their own leads')
ORDER BY policyname;

-- Check if the new index was created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'leads' 
AND indexname = 'idx_leads_meeting_assigned_user_id';

-- =====================================================
-- END OF MEETING ASSIGNMENT UPDATES
-- =====================================================

-- =====================================================
-- MEETING STATUS FEATURE - DATABASE UPDATE
-- Add meeting status tracking for conducted/not conducted meetings
-- Date: October 2025
-- =====================================================

-- Add meeting_status column to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS meeting_status TEXT CHECK (meeting_status IN ('pending', 'conducted', 'not_conducted')) DEFAULT 'pending';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_leads_meeting_status ON leads(meeting_status);

-- Add comment for documentation
COMMENT ON COLUMN leads.meeting_status IS 'Status of the meeting: pending, conducted, or not_conducted';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name = 'meeting_status';

-- =====================================================
-- END OF MEETING STATUS UPDATE
-- =====================================================
