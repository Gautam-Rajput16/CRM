-- Cleanup script to drop existing activity tracking tables
-- Run this BEFORE running the main schema files

-- Drop tables if they exist (this will also drop all policies and indexes)
DROP TABLE IF EXISTS call_logs CASCADE;
DROP TABLE IF EXISTS status_change_logs CASCADE;

-- Note: CASCADE will automatically drop all dependent objects like:
-- - RLS policies
-- - Indexes  
-- - Foreign key constraints
