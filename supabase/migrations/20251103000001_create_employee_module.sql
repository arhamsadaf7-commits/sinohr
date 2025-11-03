/*
  # Employee Module - Complete Database Schema

  ## Overview
  Comprehensive employee management system with:
  - Departments and Designations
  - Employee directory with biodata
  - Documents with expiry tracking
  - Skills and certifications
  - Emergency contacts
  - Custom fields support
  - Bilingual support (Arabic/English)
  - Access control and audit logs

  ## Tables Created
  1. `departments` - Organization departments
  2. `designations` - Job positions/roles
  3. `document_types` - Document categories
  4. `skill_categories` - Skill groupings
  5. `custom_fields` - Dynamic field definitions
  6. `employees` - Core employee records
  7. `employee_documents` - Document management
  8. `employee_skills` - Skills and certifications
  9. `emergency_contacts` - Emergency contact information
  10. `employee_custom_values` - Custom field data
  11. `employee_access_log` - Access tracking
  12. `saved_searches` - User search presets

  ## Security
  - RLS enabled on all tables
  - Role-based access control
  - Audit logging for sensitive operations
*/

-- =====================================================
-- 1. DEPARTMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS departments (
  department_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_code text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_ar text,
  description_en text,
  description_ar text,
  parent_department_id uuid REFERENCES departments(department_id),
  manager_id uuid,
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_department_id);

-- =====================================================
-- 2. DESIGNATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS designations (
  designation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  designation_code text UNIQUE NOT NULL,
  title_en text NOT NULL,
  title_ar text,
  description_en text,
  description_ar text,
  level int DEFAULT 0,
  department_id uuid REFERENCES departments(department_id),
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_designations_active ON designations(is_active);
CREATE INDEX IF NOT EXISTS idx_designations_dept ON designations(department_id);

-- =====================================================
-- 3. DOCUMENT TYPES
-- =====================================================
CREATE TABLE IF NOT EXISTS document_types (
  document_type_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_code text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_ar text,
  description_en text,
  description_ar text,
  requires_expiry boolean DEFAULT false,
  requires_permit_number boolean DEFAULT false,
  allowed_file_types text[] DEFAULT ARRAY['pdf', 'jpg', 'jpeg', 'png'],
  max_file_size_mb int DEFAULT 10,
  is_mandatory boolean DEFAULT false,
  is_active boolean DEFAULT true,
  notify_before_days int DEFAULT 30,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_types_active ON document_types(is_active);

-- =====================================================
-- 4. SKILL CATEGORIES
-- =====================================================
CREATE TABLE IF NOT EXISTS skill_categories (
  category_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_ar text,
  description_en text,
  description_ar text,
  icon text,
  color text,
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skill_categories_active ON skill_categories(is_active);

-- =====================================================
-- 5. CUSTOM FIELDS
-- =====================================================
CREATE TABLE IF NOT EXISTS custom_fields (
  field_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_code text UNIQUE NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'dropdown', 'multiselect', 'boolean', 'file', 'tags', 'textarea', 'email', 'phone', 'url')),
  label_en text NOT NULL,
  label_ar text,
  placeholder_en text,
  placeholder_ar text,
  help_text_en text,
  help_text_ar text,
  options jsonb,
  validation_rules jsonb,
  is_required boolean DEFAULT false,
  is_visible boolean DEFAULT true,
  is_searchable boolean DEFAULT false,
  section text DEFAULT 'personal',
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_fields_visible ON custom_fields(is_visible);
CREATE INDEX IF NOT EXISTS idx_custom_fields_section ON custom_fields(section);

-- =====================================================
-- 6. EMPLOYEES (Core Table)
-- =====================================================
CREATE TABLE IF NOT EXISTS employees (
  employee_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code text UNIQUE NOT NULL,

  -- Personal Information
  first_name_en text NOT NULL,
  first_name_ar text,
  middle_name_en text,
  middle_name_ar text,
  last_name_en text NOT NULL,
  last_name_ar text,
  full_name_en text GENERATED ALWAYS AS (
    first_name_en || ' ' || COALESCE(middle_name_en || ' ', '') || last_name_en
  ) STORED,
  full_name_ar text GENERATED ALWAYS AS (
    COALESCE(first_name_ar, '') || ' ' || COALESCE(middle_name_ar || ' ', '') || COALESCE(last_name_ar, '')
  ) STORED,

  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  nationality text,
  national_id text,
  passport_number text,
  marital_status text CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),

  -- Contact Information
  email text UNIQUE,
  phone_primary text,
  phone_secondary text,
  address_en text,
  address_ar text,
  city text,
  state text,
  postal_code text,
  country text DEFAULT 'Saudi Arabia',

  -- Job Information
  department_id uuid REFERENCES departments(department_id),
  designation_id uuid REFERENCES designations(designation_id),
  reports_to uuid REFERENCES employees(employee_id),
  employment_type text CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'intern', 'consultant')),
  employment_status text DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'on-leave', 'terminated', 'resigned')),
  joining_date date,
  confirmation_date date,
  termination_date date,
  work_location text,

  -- System Fields
  user_id uuid REFERENCES auth.users(id),
  photo_url text,
  bio_en text,
  bio_ar text,

  -- Metadata
  is_active boolean DEFAULT true,
  last_access_at timestamptz,
  tags text[],
  notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_desig ON employees(designation_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_employees_joining ON employees(joining_date);
CREATE INDEX IF NOT EXISTS idx_employees_name_en ON employees(full_name_en);
CREATE INDEX IF NOT EXISTS idx_employees_name_ar ON employees(full_name_ar);
CREATE INDEX IF NOT EXISTS idx_employees_tags ON employees USING gin(tags);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_employees_search_en ON employees USING gin(
  to_tsvector('english',
    COALESCE(full_name_en, '') || ' ' ||
    COALESCE(email, '') || ' ' ||
    COALESCE(employee_code, '')
  )
);

-- =====================================================
-- 7. EMPLOYEE DOCUMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_documents (
  document_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
  document_type_id uuid NOT NULL REFERENCES document_types(document_type_id),

  title_en text NOT NULL,
  title_ar text,
  description_en text,
  description_ar text,

  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size_bytes bigint,
  file_type text,

  permit_number text,
  issue_date date,
  expiry_date date,
  is_expired boolean GENERATED ALWAYS AS (expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE) STORED,
  days_until_expiry int GENERATED ALWAYS AS (
    CASE WHEN expiry_date IS NOT NULL
    THEN (expiry_date - CURRENT_DATE)
    ELSE NULL END
  ) STORED,

  language text DEFAULT 'en' CHECK (language IN ('en', 'ar', 'both')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'archived', 'pending')),

  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_employee_docs_employee ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_docs_type ON employee_documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_employee_docs_expiry ON employee_documents(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employee_docs_status ON employee_documents(status);

-- =====================================================
-- 8. EMPLOYEE SKILLS
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_skills (
  skill_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
  category_id uuid REFERENCES skill_categories(category_id),

  skill_name_en text NOT NULL,
  skill_name_ar text,
  description_en text,
  description_ar text,

  proficiency_level text CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_of_experience numeric(4,1),

  certification_name text,
  certification_number text,
  certification_date date,
  certification_expiry date,
  certifying_body text,

  is_verified boolean DEFAULT false,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_skills_employee ON employee_skills(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_skills_category ON employee_skills(category_id);
CREATE INDEX IF NOT EXISTS idx_employee_skills_proficiency ON employee_skills(proficiency_level);

-- =====================================================
-- 9. EMERGENCY CONTACTS
-- =====================================================
CREATE TABLE IF NOT EXISTS emergency_contacts (
  contact_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,

  contact_name_en text NOT NULL,
  contact_name_ar text,
  relationship text NOT NULL,
  priority text DEFAULT 'secondary' CHECK (priority IN ('primary', 'secondary')),

  phone_primary text NOT NULL,
  phone_secondary text,
  email text,

  address_en text,
  address_ar text,
  city text,
  country text,

  notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_employee ON emergency_contacts(employee_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_priority ON emergency_contacts(priority);

-- =====================================================
-- 10. EMPLOYEE CUSTOM VALUES
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_custom_values (
  value_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES custom_fields(field_id) ON DELETE CASCADE,

  value_text text,
  value_number numeric,
  value_date date,
  value_boolean boolean,
  value_json jsonb,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(employee_id, field_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_values_employee ON employee_custom_values(employee_id);
CREATE INDEX IF NOT EXISTS idx_custom_values_field ON employee_custom_values(field_id);

-- =====================================================
-- 11. EMPLOYEE ACCESS LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_access_log (
  log_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
  accessed_by uuid NOT NULL REFERENCES auth.users(id),

  action text NOT NULL CHECK (action IN ('view', 'edit', 'delete', 'export', 'print')),
  section text,
  ip_address text,
  user_agent text,

  accessed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_log_employee ON employee_access_log(employee_id);
CREATE INDEX IF NOT EXISTS idx_access_log_user ON employee_access_log(accessed_by);
CREATE INDEX IF NOT EXISTS idx_access_log_action ON employee_access_log(action);
CREATE INDEX IF NOT EXISTS idx_access_log_date ON employee_access_log(accessed_at);

-- =====================================================
-- 12. SAVED SEARCHES
-- =====================================================
CREATE TABLE IF NOT EXISTS saved_searches (
  search_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  search_name text NOT NULL,
  search_filters jsonb NOT NULL,
  is_default boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_custom_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Departments: Authenticated users can read, admins can modify
CREATE POLICY "Authenticated users can view departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage departments"
  ON departments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_name IN ('admin', 'hr_manager')
    )
  );

-- Designations: Same as departments
CREATE POLICY "Authenticated users can view designations"
  ON designations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage designations"
  ON designations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_name IN ('admin', 'hr_manager')
    )
  );

-- Document Types: All authenticated can read
CREATE POLICY "Authenticated users can view document types"
  ON document_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage document types"
  ON document_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_name IN ('admin', 'hr_manager')
    )
  );

-- Skill Categories: All authenticated can read
CREATE POLICY "Authenticated users can view skill categories"
  ON skill_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage skill categories"
  ON skill_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_name IN ('admin', 'hr_manager')
    )
  );

-- Custom Fields: Admins only
CREATE POLICY "Admins can manage custom fields"
  ON custom_fields FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_name IN ('admin', 'hr_manager')
    )
  );

-- Employees: Read for authenticated, modify with permissions
CREATE POLICY "Authenticated users can view employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own employee record"
  ON employees FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "HR and admins can manage employees"
  ON employees FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_name IN ('admin', 'hr_manager', 'hr_staff')
    )
  );

-- Employee Documents: Employees can view own, HR can manage all
CREATE POLICY "Users can view own documents"
  ON employee_documents FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM employees WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_name IN ('admin', 'hr_manager', 'hr_staff')
    )
  );

CREATE POLICY "HR can manage employee documents"
  ON employee_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_name IN ('admin', 'hr_manager', 'hr_staff')
    )
  );

-- Employee Skills: Similar to documents
CREATE POLICY "Users can view own skills"
  ON employee_skills FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM employees WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_name IN ('admin', 'hr_manager', 'hr_staff')
    )
  );

CREATE POLICY "Users can manage own skills"
  ON employee_skills FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT employee_id FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "HR can manage employee skills"
  ON employee_skills FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_name IN ('admin', 'hr_manager', 'hr_staff')
    )
  );

-- Emergency Contacts: Employees and HR can manage
CREATE POLICY "Users can view own emergency contacts"
  ON emergency_contacts FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM employees WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_name IN ('admin', 'hr_manager', 'hr_staff')
    )
  );

CREATE POLICY "Users can manage own emergency contacts"
  ON emergency_contacts FOR ALL
  TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM employees WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_name IN ('admin', 'hr_manager', 'hr_staff')
    )
  );

-- Custom Values: Follow employee permissions
CREATE POLICY "Users can view own custom values"
  ON employee_custom_values FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM employees WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_name IN ('admin', 'hr_manager', 'hr_staff')
    )
  );

CREATE POLICY "HR can manage custom values"
  ON employee_custom_values FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_name IN ('admin', 'hr_manager', 'hr_staff')
    )
  );

-- Access Log: Insert for all, read for admins
CREATE POLICY "Users can create access logs"
  ON employee_access_log FOR INSERT
  TO authenticated
  WITH CHECK (accessed_by = auth.uid());

CREATE POLICY "Admins can view access logs"
  ON employee_access_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_name IN ('admin', 'hr_manager')
    )
  );

-- Saved Searches: Users manage own
CREATE POLICY "Users can manage own saved searches"
  ON saved_searches FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update employee last access
CREATE OR REPLACE FUNCTION update_employee_last_access()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE employees
  SET last_access_at = now()
  WHERE employee_id = NEW.employee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for access log
CREATE TRIGGER trigger_update_employee_access
  AFTER INSERT ON employee_access_log
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_last_access();

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_designations_updated_at BEFORE UPDATE ON designations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_documents_updated_at BEFORE UPDATE ON employee_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_skills_updated_at BEFORE UPDATE ON employee_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA
-- =====================================================

-- Default Document Types
INSERT INTO document_types (type_code, name_en, name_ar, requires_expiry, requires_permit_number, is_mandatory) VALUES
('passport', 'Passport', 'جواز السفر', true, true, true),
('visa', 'Visa', 'تأشيرة', true, true, false),
('iqama', 'Iqama (Residence Permit)', 'الإقامة', true, true, true),
('national_id', 'National ID', 'الهوية الوطنية', true, false, true),
('driving_license', 'Driving License', 'رخصة القيادة', true, true, false),
('contract', 'Employment Contract', 'عقد العمل', false, false, true),
('certificate', 'Educational Certificate', 'الشهادة التعليمية', false, false, false),
('medical', 'Medical Certificate', 'الشهادة الطبية', true, false, false)
ON CONFLICT (type_code) DO NOTHING;

-- Default Skill Categories
INSERT INTO skill_categories (category_code, name_en, name_ar, icon, color) VALUES
('technical', 'Technical Skills', 'المهارات التقنية', 'Code', 'blue'),
('language', 'Languages', 'اللغات', 'Globe', 'green'),
('management', 'Management', 'الإدارة', 'Users', 'purple'),
('communication', 'Communication', 'التواصل', 'MessageSquare', 'orange'),
('software', 'Software', 'البرمجيات', 'Monitor', 'cyan')
ON CONFLICT (category_code) DO NOTHING;
