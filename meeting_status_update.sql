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
