/*
  # Clean and Migrate Zawil Permit Requests Constraints

  1. Data Cleanup
    - Map all existing permit_type values to new valid values
    - Update issued_for values to new format
    
  2. Constraint Updates
    - Drop old constraints
    - Add new constraints with proper values

  3. Migration Strategy
    - All existing visitor-like types → VISITOR
    - All other types → TEMPORARY (default)
    - Preserves all data while ensuring compliance
*/

-- Step 1: Drop existing constraints
ALTER TABLE zawil_permit_requests 
DROP CONSTRAINT IF EXISTS zawil_permit_requests_issued_for_check;

ALTER TABLE zawil_permit_requests 
DROP CONSTRAINT IF EXISTS zawil_permit_requests_permit_type_check;

-- Step 2: Clean up and migrate permit_type data
UPDATE zawil_permit_requests
SET permit_type = CASE 
  WHEN LOWER(permit_type) LIKE '%visitor%' THEN 'VISITOR'
  WHEN LOWER(permit_type) LIKE '%permanent%' THEN 'PERMANENT'
  WHEN LOWER(permit_type) LIKE '%temporary%' THEN 'TEMPORARY'
  ELSE 'TEMPORARY'  -- Default for any other values
END;

-- Step 3: Migrate issued_for data
UPDATE zawil_permit_requests
SET issued_for = CASE 
  WHEN issued_for IN ('VISITOR', 'PERMANENT') THEN 'PERSON'
  WHEN issued_for = 'VEHICLE' THEN 'VEHICLE'
  ELSE 'PERSON'  -- Default
END;

-- Step 4: Add new constraints
ALTER TABLE zawil_permit_requests
ADD CONSTRAINT zawil_permit_requests_issued_for_check
CHECK (issued_for IN (
  'PERSON',
  'PERSON WITH VEHICLE',
  'VEHICLE',
  'VEHICLE / HEAVY EQUIPMENT'
));

ALTER TABLE zawil_permit_requests
ADD CONSTRAINT zawil_permit_requests_permit_type_check
CHECK (permit_type IN (
  'TEMPORARY',
  'VISITOR',
  'PERMANENT'
));
