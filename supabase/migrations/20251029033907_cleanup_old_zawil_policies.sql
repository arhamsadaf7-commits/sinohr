/*
  # Clean up old Zawil Permit Request policies

  1. Changes
    - Remove duplicate and old policies
    - Keep only the new role-based policies
    
  2. Security
    - Maintain restrictive access based on user roles
*/

-- Drop old duplicate policies
DROP POLICY IF EXISTS "Anyone can submit permit requests" ON zawil_permit_requests;
DROP POLICY IF EXISTS "Authenticated users can create permit requests" ON zawil_permit_requests;
DROP POLICY IF EXISTS "Authenticated users can delete permit requests" ON zawil_permit_requests;
DROP POLICY IF EXISTS "Authenticated users can update permit requests" ON zawil_permit_requests;
DROP POLICY IF EXISTS "Authenticated users can view permit requests" ON zawil_permit_requests;
DROP POLICY IF EXISTS "Public users can view own submissions" ON zawil_permit_requests;

-- Keep only these policies:
-- 1. "Users can read zawil permit requests based on role" (SELECT)
-- 2. "Authenticated users can create permit requests" (INSERT) - will be recreated as it was dropped earlier
-- 3. "Users can update permit requests based on role" (UPDATE)
-- 4. "Admins can delete permit requests" (DELETE)
-- 5. "Public can submit permit requests" (INSERT for anon)
