-- Add ip_address column to attendance_records table
ALTER TABLE attendance_records 
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Create index for ip_address
CREATE INDEX IF NOT EXISTS idx_attendance_ip_address ON attendance_records(ip_address);

DO $$
BEGIN
  RAISE NOTICE 'Added ip_address column to attendance_records table';
END $$;
