/*
  # Zawil Permit Management System

  1. New Tables
    - `employees` - Employee master data
    - `zawil_permits` - Zawil permit records with employee linkage
    - `upload_log` - Audit trail for Excel uploads
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
  
  3. Features
    - Auto employee creation from Zawil uploads
    - Duplicate prevention via MOI Number + Issue Date
    - Status tracking and expiry calculation
    - Complete audit logging
*/

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
  employee_id SERIAL PRIMARY KEY,
  arabic_name VARCHAR(255),
  english_name VARCHAR(255) NOT NULL,
  moi_number VARCHAR(100) UNIQUE NOT NULL,
  passport_number VARCHAR(100),
  nationality VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Zawil Permits Table
CREATE TABLE IF NOT EXISTS zawil_permits (
  permit_id SERIAL PRIMARY KEY,
  zawil_permit_id VARCHAR(100) UNIQUE NOT NULL,
  permit_type VARCHAR(100) NOT NULL,
  issued_for VARCHAR(255) NOT NULL,
  arabic_name VARCHAR(255),
  english_name VARCHAR(255) NOT NULL,
  moi_number VARCHAR(100) NOT NULL,
  passport_number VARCHAR(100) NOT NULL,
  nationality VARCHAR(100) NOT NULL,
  plate_number VARCHAR(100),
  port_name VARCHAR(100) NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  employee_id INTEGER REFERENCES employees(employee_id),
  status VARCHAR(20) DEFAULT 'Valid' CHECK (status IN ('Valid', 'Expiring Soon', 'Expired', 'Done')),
  days_remaining INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(moi_number, issue_date)
);

-- Upload Log Table
CREATE TABLE IF NOT EXISTS upload_log (
  upload_id SERIAL PRIMARY KEY,
  uploader_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  rows_inserted INTEGER DEFAULT 0,
  rows_skipped INTEGER DEFAULT 0,
  total_rows INTEGER DEFAULT 0,
  upload_status VARCHAR(50) DEFAULT 'Completed'
);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE zawil_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_log ENABLE ROW LEVEL SECURITY;

-- Policies for employees
CREATE POLICY "Users can read employees"
  ON employees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert employees"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update employees"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policies for zawil_permits
CREATE POLICY "Users can read zawil permits"
  ON zawil_permits
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert zawil permits"
  ON zawil_permits
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update zawil permits"
  ON zawil_permits
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policies for upload_log
CREATE POLICY "Users can read upload log"
  ON upload_log
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert upload log"
  ON upload_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to calculate days remaining and update status
CREATE OR REPLACE FUNCTION update_zawil_permit_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate days remaining
  NEW.days_remaining := NEW.expiry_date - CURRENT_DATE;
  
  -- Update status based on days remaining (only if not manually set to 'Done')
  IF NEW.status != 'Done' THEN
    IF NEW.days_remaining < 0 THEN
      NEW.status := 'Expired';
    ELSIF NEW.days_remaining <= 30 THEN
      NEW.status := 'Expiring Soon';
    ELSE
      NEW.status := 'Valid';
    END IF;
  END IF;
  
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update status on insert/update
CREATE TRIGGER zawil_permit_status_trigger
  BEFORE INSERT OR UPDATE ON zawil_permits
  FOR EACH ROW
  EXECUTE FUNCTION update_zawil_permit_status();

-- Function to update employee updated_at timestamp
CREATE OR REPLACE FUNCTION update_employee_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for employee updates
CREATE TRIGGER employee_update_trigger
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_timestamp();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_moi_number ON employees(moi_number);
CREATE INDEX IF NOT EXISTS idx_zawil_permits_moi_issue ON zawil_permits(moi_number, issue_date);
CREATE INDEX IF NOT EXISTS idx_zawil_permits_employee_id ON zawil_permits(employee_id);
CREATE INDEX IF NOT EXISTS idx_zawil_permits_status ON zawil_permits(status);
CREATE INDEX IF NOT EXISTS idx_zawil_permits_expiry_date ON zawil_permits(expiry_date);
CREATE INDEX IF NOT EXISTS idx_upload_log_date ON upload_log(upload_date);