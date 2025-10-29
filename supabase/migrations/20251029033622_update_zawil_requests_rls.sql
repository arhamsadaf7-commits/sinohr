/*
  # Update Zawil Permit Requests for Role-Based Access

  1. Changes
    - Add `created_by_user_id` column to track which user created the request
    - Update RLS policies to restrict Supplier users to only their own requests
    - Admin users can see all requests
    
  2. Security
    - Drop existing overly permissive policies
    - Create new restrictive policies based on user role
    - Suppliers can only view/update their own requests
    - Admins and HR can view/update all requests
*/

-- Add created_by_user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'zawil_permit_requests' 
    AND column_name = 'created_by_user_id'
  ) THEN
    ALTER TABLE zawil_permit_requests 
    ADD COLUMN created_by_user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Update existing records to set created_by_user_id from submitted_by email
-- This is a one-time migration to populate existing data
DO $$
BEGIN
  UPDATE zawil_permit_requests zpr
  SET created_by_user_id = u.id
  FROM users u
  WHERE zpr.submitted_by = u.email
  AND zpr.created_by_user_id IS NULL;
END $$;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can read zawil permit requests" ON zawil_permit_requests;
DROP POLICY IF EXISTS "Users can insert zawil permit requests" ON zawil_permit_requests;
DROP POLICY IF EXISTS "Users can update zawil permit requests" ON zawil_permit_requests;
DROP POLICY IF EXISTS "Public can insert permit requests" ON zawil_permit_requests;
DROP POLICY IF EXISTS "Public can read own permit requests" ON zawil_permit_requests;

-- Create new restrictive policies

-- SELECT: Suppliers see only their own, Admins/HR see all
CREATE POLICY "Users can read zawil permit requests based on role"
  ON zawil_permit_requests
  FOR SELECT
  TO authenticated
  USING (
    -- Check if user is Admin or has HR permissions
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND (
        r.name IN ('Admin', 'Admin Assistant', 'Manager')
        OR EXISTS (
          SELECT 1 FROM permissions p
          JOIN modules m ON p.module_id = m.id
          WHERE p.role_id = r.id
          AND m.name IN ('HR', 'Admin', 'Zawil Requests')
          AND p.can_read = true
        )
      )
    )
    OR
    -- Suppliers can only see their own requests
    (
      created_by_user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.user_type = 'Supplier'
      )
    )
  );

-- INSERT: All authenticated users can create requests
CREATE POLICY "Authenticated users can create permit requests"
  ON zawil_permit_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()
  );

-- UPDATE: Suppliers can update their own, Admins/HR can update all
CREATE POLICY "Users can update permit requests based on role"
  ON zawil_permit_requests
  FOR UPDATE
  TO authenticated
  USING (
    -- Admins and HR can update any request
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND (
        r.name IN ('Admin', 'Admin Assistant', 'Manager')
        OR EXISTS (
          SELECT 1 FROM permissions p
          JOIN modules m ON p.module_id = m.id
          WHERE p.role_id = r.id
          AND m.name IN ('HR', 'Admin', 'Zawil Requests')
          AND p.can_update = true
        )
      )
    )
    OR
    -- Suppliers can only update their own requests (only if status is PENDING)
    (
      created_by_user_id = auth.uid()
      AND status = 'PENDING'
      AND EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.user_type = 'Supplier'
      )
    )
  )
  WITH CHECK (
    -- Admins can update to any status
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND (
        r.name IN ('Admin', 'Admin Assistant', 'Manager')
        OR EXISTS (
          SELECT 1 FROM permissions p
          JOIN modules m ON p.module_id = m.id
          WHERE p.role_id = r.id
          AND m.name IN ('HR', 'Admin', 'Zawil Requests')
          AND p.can_update = true
        )
      )
    )
    OR
    -- Suppliers can only update their own pending requests
    (
      created_by_user_id = auth.uid()
      AND status = 'PENDING'
    )
  );

-- DELETE: Only Admins can delete
CREATE POLICY "Admins can delete permit requests"
  ON zawil_permit_requests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND (
        r.name IN ('Admin', 'Admin Assistant')
        OR EXISTS (
          SELECT 1 FROM permissions p
          JOIN modules m ON p.module_id = m.id
          WHERE p.role_id = r.id
          AND m.name IN ('Admin', 'Zawil Requests')
          AND p.can_delete = true
        )
      )
    )
  );

-- Public access for public submission form (anonymous users)
CREATE POLICY "Public can submit permit requests"
  ON zawil_permit_requests
  FOR INSERT
  TO anon
  WITH CHECK (
    is_public_submission = true
    AND created_by_user_id IS NULL
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_zawil_permit_requests_created_by 
  ON zawil_permit_requests(created_by_user_id);
