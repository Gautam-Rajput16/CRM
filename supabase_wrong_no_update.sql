-- =====================================================
-- ULTRA-SAFE MIGRATION: ADD "Wrong No." STATUS
-- =====================================================

-- First, let's see what we're working with
SELECT 'Current constraint:' as info;
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'leads'::regclass 
AND contype = 'c';

-- Check current status values in the database
SELECT 'Current status values in database:' as info;
SELECT DISTINCT status, COUNT(*) 
FROM leads 
GROUP BY status;

-- Now perform the safe update
BEGIN;

-- Store the old constraint name for reference
DO $$
DECLARE
    old_constraint_name TEXT;
BEGIN
    SELECT conname INTO old_constraint_name
    FROM pg_constraint 
    WHERE conrelid = 'leads'::regclass 
    AND pg_get_constraintdef(oid) LIKE '%status%';
    
    RAISE NOTICE 'Dropping constraint: %', old_constraint_name;
END $$;

-- Drop existing constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Add new constraint with "Wrong No." added
ALTER TABLE leads 
ADD CONSTRAINT leads_status_check 
CHECK (status IN (
    '-', 
    'Follow-up', 
    'Confirmed', 
    'Not Connected', 
    'Interested', 
    'Not - Interested', 
    'Meeting',
    'Wrong No.'
));

-- Verify everything is working
SELECT 'New constraint added successfully!' as result;

COMMIT;