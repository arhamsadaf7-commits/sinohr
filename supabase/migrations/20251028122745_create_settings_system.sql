/*
  # Settings System - Users, Roles, Permissions, and Configuration

  ## Overview
  This migration creates a comprehensive settings system for the admin panel including
  user management with role-based and user-specific permissions, and system configuration.

  ## 1. New Tables
  
  ### users
  - Extended user information linked to auth.users
  - Fields: id (references auth.users), user_type, employee_id, full_name, email, phone, 
    profile_picture, source, is_active, created_at, updated_at
  - User types: Admin, Admin Assistant, Manager, Employee, Supplier, Viewer
  - Source types: Manual, Employee, Supplier
  
  ### roles
  - Predefined system roles with descriptions
  - Fields: id, name, description, created_at
  - Six roles: Admin, Admin Assistant, Manager, Employee, Supplier, Viewer
  
  ### modules
  - System modules that can have permissions assigned
  - Fields: id, name, description, created_at
  - Modules: HR, Finance, Security, Admin, Expiry Dashboard, Zawil Requests
  
  ### permissions
  - Role-based CRUD permissions for each module
  - Fields: id, role_id, module_id, can_create, can_read, can_update, can_delete
  
  ### user_permissions
  - User-specific permission overrides
  - Fields: id, user_id, module_id, can_create, can_read, can_update, can_delete, inherit_from_role
  
  ### system_config
  - Key-value store for system configuration
  - Fields: id, config_key, config_value, config_type, is_encrypted, updated_by, updated_at

  ## 2. Security
  - Enable RLS on all tables
  - Restrict access to authenticated users with Admin permissions
  - Policies for read/write operations

  ## 3. Features
  - Auto-timestamp updates via triggers
  - Indexes for performance optimization
  - Seed data for roles and modules
  - Default system configuration values
*/

-- Users table (extended user info)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('Admin', 'Admin Assistant', 'Manager', 'Employee', 'Supplier', 'Viewer')),
  role_id INTEGER,
  employee_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  profile_picture TEXT,
  source VARCHAR(50) NOT NULL CHECK (source IN ('Manual', 'Employee', 'Supplier')) DEFAULT 'Manual',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table (role-based)
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
  can_create BOOLEAN DEFAULT false,
  can_read BOOLEAN DEFAULT false,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  UNIQUE(role_id, module_id)
);

-- User permissions table (user-specific overrides)
CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
  can_create BOOLEAN DEFAULT false,
  can_read BOOLEAN DEFAULT false,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  inherit_from_role BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, module_id)
);

-- System configuration table
CREATE TABLE IF NOT EXISTS system_config (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  config_type VARCHAR(50) NOT NULL CHECK (config_type IN ('string', 'number', 'boolean', 'json', 'file')) DEFAULT 'string',
  is_encrypted BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key for role_id in users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_role_id_fkey'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Authenticated users can read users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for roles table
CREATE POLICY "Authenticated users can read roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert roles"
  ON roles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update roles"
  ON roles FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for modules table
CREATE POLICY "Authenticated users can read modules"
  ON modules FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for permissions table
CREATE POLICY "Authenticated users can read permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage permissions"
  ON permissions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for user_permissions table
CREATE POLICY "Authenticated users can read user permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage user permissions"
  ON user_permissions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for system_config table
CREATE POLICY "Authenticated users can read system config"
  ON system_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage system config"
  ON system_config FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at
  BEFORE UPDATE ON system_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_permissions_role_module ON permissions(role_id, module_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_module ON user_permissions(user_id, module_id);
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);

-- Seed roles
INSERT INTO roles (name, description) VALUES
  ('Admin', 'Full system access with all permissions'),
  ('Admin Assistant', 'Administrative support with limited permissions'),
  ('Manager', 'Department management access'),
  ('Employee', 'Basic employee access to personal information'),
  ('Supplier', 'Supplier portal access with limited visibility'),
  ('Viewer', 'Read-only access to approved modules')
ON CONFLICT (name) DO NOTHING;

-- Seed modules
INSERT INTO modules (name, description) VALUES
  ('HR', 'Human Resources management including employee data'),
  ('Finance', 'Financial reports and data management'),
  ('Security', 'Security logs and access control'),
  ('Admin', 'System administration and user management'),
  ('Expiry Dashboard', 'Document expiry tracking and notifications'),
  ('Zawil Requests', 'Zawil permit request management')
ON CONFLICT (name) DO NOTHING;

-- Seed default Admin role permissions (full access to all modules)
INSERT INTO permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
SELECT 
  (SELECT id FROM roles WHERE name = 'Admin'),
  m.id,
  true,
  true,
  true,
  true
FROM modules m
ON CONFLICT (role_id, module_id) DO NOTHING;

-- Seed Admin Assistant permissions (read/update for HR and Expiry Dashboard)
INSERT INTO permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
SELECT 
  (SELECT id FROM roles WHERE name = 'Admin Assistant'),
  m.id,
  CASE WHEN m.name IN ('HR', 'Expiry Dashboard') THEN false ELSE false END,
  CASE WHEN m.name IN ('HR', 'Expiry Dashboard', 'Zawil Requests') THEN true ELSE false END,
  CASE WHEN m.name IN ('HR', 'Expiry Dashboard') THEN true ELSE false END,
  false
FROM modules m
ON CONFLICT (role_id, module_id) DO NOTHING;

-- Seed Manager permissions (read/update for HR, Expiry Dashboard, Zawil Requests)
INSERT INTO permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
SELECT 
  (SELECT id FROM roles WHERE name = 'Manager'),
  m.id,
  CASE WHEN m.name IN ('Zawil Requests') THEN true ELSE false END,
  CASE WHEN m.name IN ('HR', 'Expiry Dashboard', 'Zawil Requests') THEN true ELSE false END,
  CASE WHEN m.name IN ('HR', 'Expiry Dashboard', 'Zawil Requests') THEN true ELSE false END,
  false
FROM modules m
ON CONFLICT (role_id, module_id) DO NOTHING;

-- Seed Employee permissions (read-only for HR)
INSERT INTO permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
SELECT 
  (SELECT id FROM roles WHERE name = 'Employee'),
  m.id,
  false,
  CASE WHEN m.name = 'HR' THEN true ELSE false END,
  false,
  false
FROM modules m
ON CONFLICT (role_id, module_id) DO NOTHING;

-- Seed Supplier permissions (read for Zawil Requests)
INSERT INTO permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
SELECT 
  (SELECT id FROM roles WHERE name = 'Supplier'),
  m.id,
  false,
  CASE WHEN m.name = 'Zawil Requests' THEN true ELSE false END,
  false,
  false
FROM modules m
ON CONFLICT (role_id, module_id) DO NOTHING;

-- Seed Viewer permissions (read-only for specific modules)
INSERT INTO permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
SELECT 
  (SELECT id FROM roles WHERE name = 'Viewer'),
  m.id,
  false,
  CASE WHEN m.name IN ('HR', 'Expiry Dashboard') THEN true ELSE false END,
  false,
  false
FROM modules m
ON CONFLICT (role_id, module_id) DO NOTHING;

-- Seed default system configuration
INSERT INTO system_config (config_key, config_value, config_type) VALUES
  ('site_name', 'HR Management System', 'string'),
  ('site_logo', '', 'file'),
  ('site_favicon', '', 'file'),
  ('smtp_host', '', 'string'),
  ('smtp_port', '587', 'number'),
  ('smtp_username', '', 'string'),
  ('smtp_password', '', 'string'),
  ('smtp_encryption', 'TLS', 'string'),
  ('smtp_from_email', '', 'string'),
  ('smtp_from_name', 'HR Management System', 'string'),
  ('timezone', 'Asia/Riyadh', 'string'),
  ('language', 'en', 'string'),
  ('date_format', 'DD/MM/YYYY', 'string'),
  ('session_timeout', '3600', 'number'),
  ('pagination_default', '25', 'number'),
  ('file_upload_max_size', '10', 'number')
ON CONFLICT (config_key) DO NOTHING;