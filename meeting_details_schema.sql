-- Add meeting_date column
ALTER TABLE leads 
ADD COLUMN meeting_date DATE;

-- Add meeting_time column
ALTER TABLE leads 
ADD COLUMN meeting_time TIME;

-- Add meeting_location column
ALTER TABLE leads 
ADD COLUMN meeting_location TEXT;

-- Add meeting_description column
ALTER TABLE leads 
ADD COLUMN meeting_description TEXT;

-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Meeting details visible to all authorized users" ON leads;
DROP POLICY IF EXISTS "Meeting details editable by authorized users" ON leads;
DROP POLICY IF EXISTS "Leads with meeting details insertable by authorized users" ON leads;
DROP POLICY IF EXISTS "Leads deletable by admin and team leaders" ON leads;
DROP POLICY IF EXISTS "Admins and team leaders view all meeting details" ON leads;
DROP POLICY IF EXISTS "Sales executives view assigned meeting details" ON leads;
DROP POLICY IF EXISTS "Users view own meeting details" ON leads;
DROP POLICY IF EXISTS "Meeting details updatable by authorized users" ON leads;

-- Policy for SELECT (viewing meeting details) - Everyone can view
CREATE POLICY "Meeting details visible to all authorized users" ON leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'team_leader', 'sales_executive', 'user')
  )
);

-- Policy for UPDATE (editing meeting details) - ONLY admin and team_leader and Sales_executive
CREATE POLICY "Meeting details editable by admin and team leader only" ON leads
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'team_leader', 'sales_executive')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'team_leader', 'sales_executive')
  )
);

-- Policy for INSERT (creating leads with meeting details) - Everyone can create
CREATE POLICY "Leads with meeting details insertable by authorized users" ON leads
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'team_leader', 'sales_executive', 'user')
  )
);

-- Policy for DELETE - ONLY admin and team_leader
CREATE POLICY "Leads deletable by admin and team leaders only" ON leads
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'team_leader')
  )
);
