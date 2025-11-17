-- Update profiles table to support new roles
-- This migration adds the new role types to your CRM system

-- First, check if the role column exists and what type it is
-- If it's a TEXT column, we just need to ensure the trigger accepts new values
-- If it's an ENUM, we need to add the new values to the enum type

-- Option 1: If role is TEXT (most common in Supabase)
-- No schema change needed, just update any check constraints

-- Drop existing check constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new check constraint with all roles
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'admin', 'team_leader', 'sales_executive', 'sales_team_leader', 'operations_team_leader', 'operations_team'));

-- Option 2: If you're using ENUM type (uncomment if needed)
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sales_team_leader';
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'operations_team_leader';
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'operations_team';

-- Update the handle_new_user trigger function to support new roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
