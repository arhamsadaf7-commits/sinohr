/*
  # Fix Zawil Permit Requests - Admin-Only Approval
  
  1. Changes
    - Update RLS policies to ensure ONLY Admin/Admin Assistant can approve/reject requests
    - Suppliers can only update their own PENDING requests (not change status)
    - Ensure list filtering: Admins see all, others see only their own
    
  2. Security
    - Drop existing policies
    - Create new restrictive policies
    - Only Admin role can change status to APPROVED/REJECTED
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read zawil permit requests based on role" ON zawil_permit_requests;
DROP POLICY IF EXISTS "Users can update permit requests based on role" ON zawil_permit_requests;
DROP POLICY IF EXISTS "Authenticated users can create permit requests" ON zawil_permit_requests;
DROP POLICY IF EXISTS "Admins can delete permit requests" ON zawil_permit_requests;
DROP POLICY IF EXISTS "Public can submit permit requests" ON zawil_permit_requests;

-- SELECT: Admins see all, others see only their own
CREATE POLICY "Users can read zawil permit requests"
  ON zawil_permit_requests
  FOR SELECT
  TO authenticated
  USING (
    -- Admins can see all requests
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.name IN ('Admin', 'Admin Assistant')
    )
    OR
    -- Non-admins can only see their own requests
    (created_by_user_id = auth.uid())
  );

-- INSERT: Authenticated users can create requests
CREATE POLICY "Authenticated users can create permit requests"
  ON zawil_permit_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()
  );

-- UPDATE: Only Admins can approve/reject, Suppliers can update their own PENDING requests
CREATE POLICY "Users can update permit requests"
  ON zawil_permit_requests
  FOR UPDATE
  TO authenticated
  USING (
    -- Admins can update any request
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.name IN ('Admin', 'Admin Assistant')
    )
    OR
    -- Non-admins can only update their own PENDING requests
    (
      created_by_user_id = auth.uid()
      AND status = 'PENDING'
    )
  )
  WITH CHECK (
    -- Admins can set any status
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.name IN ('Admin', 'Admin Assistant')
    )
    OR
    -- Non-admins can only keep status as PENDING on their own requests
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
      AND r.name IN ('Admin', 'Admin Assistant')
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
