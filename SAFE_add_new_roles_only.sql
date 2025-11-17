-- SAFE SOLUTION: Only add new roles without touching RLS policies
-- This script ONLY modifies the role constraint, nothing else
-- Run this in Supabase SQL Editor

-- Step 1: Check current constraint name
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    -- Find the exact name of the role constraint
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    INNER JOIN pg_class rel ON rel.oid = con.conrelid
    INNER JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
    WHERE rel.relname = 'profiles'
    AND att.attname = 'role'
    AND con.contype = 'c'
    LIMIT 1;
    
    IF constraint_name IS NOT NULL THEN
        RAISE NOTICE 'Found constraint: %', constraint_name;
        
        -- Drop the existing constraint
        EXECUTE format('ALTER TABLE profiles DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
        
        -- Add new constraint with all 7 roles
        ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IN (
            'user', 
            'admin', 
            'team_leader', 
            'sales_executive', 
            'sales_team_leader', 
            'operations_team_leader', 
            'operations_team'
        ));
        
        RAISE NOTICE 'Added new constraint with all 7 roles';
    ELSE
        RAISE NOTICE 'No role constraint found - adding new one';
        
        -- Just add the constraint
        ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IN (
            'user', 
            'admin', 
            'team_leader', 
            'sales_executive', 
            'sales_team_leader', 
            'operations_team_leader', 
            'operations_team'
        ));
        
        RAISE NOTICE 'Added constraint with all 7 roles';
    END IF;
END $$;

-- Step 2: Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ NEW ROLES ADDED SAFELY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Available roles:';
    RAISE NOTICE '  1. user';
    RAISE NOTICE '  2. admin';
    RAISE NOTICE '  3. team_leader';
    RAISE NOTICE '  4. sales_executive';
    RAISE NOTICE '  5. sales_team_leader (NEW)';
    RAISE NOTICE '  6. operations_team_leader (NEW)';
    RAISE NOTICE '  7. operations_team (NEW)';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'NO RLS policies were modified';
    RAISE NOTICE 'Your existing dashboard access is preserved';
    RAISE NOTICE '========================================';
END $$;
