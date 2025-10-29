/*
  # Fix Zawil Permit Requests Insert Policy

  1. Changes
    - Update INSERT policy for authenticated users to allow requests with or without created_by_user_id
    - Ensure authenticated users can create their own permit requests
    - Maintain security by checking authentication status

  2. Security
    - Authenticated users can insert with their user_id
    - Policy validates user is authenticated
    - Maintains existing admin and public policies
*/

-- Drop existing authenticated user insert policy
DROP POLICY IF EXISTS "Authenticated users can create permit requests" ON zawil_permit_requests;

-- Create new flexible insert policy for authenticated users
CREATE POLICY "Authenticated users can create permit requests"
  ON zawil_permit_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be authenticated and either:
    -- 1. The created_by_user_id matches their auth.uid(), OR
    -- 2. The created_by_user_id is NULL (for backward compatibility)
    (created_by_user_id = auth.uid() OR created_by_user_id IS NULL)
  );
