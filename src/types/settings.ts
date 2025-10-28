export interface Role {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface Module {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface RolePermission {
  id: number;
  role_id: number;
  module_id: number;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export interface UserPermission {
  id: number;
  user_id: string;
  module_id: number;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
  inherit_from_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemUser {
  id: string;
  user_type: 'Admin' | 'Admin Assistant' | 'Manager' | 'Employee' | 'Supplier' | 'Viewer';
  role_id: number;
  employee_id?: number;
  full_name: string;
  email: string;
  phone?: string;
  profile_picture?: string;
  source: 'Manual' | 'Employee' | 'Supplier';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role?: Role;
  employee?: {
    employee_id: number;
    english_name: string;
    arabic_name?: string;
    moi_number: string;
  };
}

export interface SystemConfig {
  id: number;
  config_key: string;
  config_value: string;
  config_type: 'string' | 'number' | 'boolean' | 'json' | 'file';
  is_encrypted: boolean;
  updated_by?: string;
  updated_at: string;
}

export interface CreateUserFormData {
  source: 'Manual' | 'Employee' | 'Supplier';
  employee_id?: number;
  supplier_user_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  password?: string;
  user_type: 'Admin' | 'Admin Assistant' | 'Manager' | 'Employee' | 'Supplier' | 'Viewer';
  role_id: number;
  is_active: boolean;
}

export interface UserFilter {
  search?: string;
  user_type?: string;
  role_id?: number;
  source?: string;
  is_active?: boolean;
}

export interface PermissionMatrix {
  [moduleId: number]: {
    module: Module;
    can_create: boolean;
    can_read: boolean;
    can_update: boolean;
    can_delete: boolean;
  };
}

export interface SystemConfigSection {
  site: {
    site_name: string;
    site_logo: string;
    site_favicon: string;
  };
  email: {
    smtp_host: string;
    smtp_port: number;
    smtp_username: string;
    smtp_password: string;
    smtp_encryption: 'None' | 'SSL' | 'TLS';
    smtp_from_email: string;
    smtp_from_name: string;
  };
  regional: {
    timezone: string;
    language: string;
    date_format: string;
  };
  application: {
    session_timeout: number;
    pagination_default: number;
    file_upload_max_size: number;
  };
}

export interface EmployeeSelectOption {
  employee_id: number;
  english_name: string;
  arabic_name?: string;
  moi_number: string;
  passport_number?: string;
  nationality?: string;
}

export interface MergedPermissions {
  [moduleId: number]: {
    module: Module;
    can_create: boolean;
    can_read: boolean;
    can_update: boolean;
    can_delete: boolean;
    is_override: boolean;
  };
}
