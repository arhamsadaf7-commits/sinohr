export interface Company {
  id: string;
  name: string;
  branch: string;
  department: string;
  workLocation: string;
  supervisor: string;
}

export interface Employee {
  id: string;
  companyId: string;
  fullName: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  nationality: string;
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  contactNumber: string;
  email: string;
  address: string;
}

export interface JobInfo {
  employeeId: string;
  jobTitle: string;
  employeeType: 'Permanent' | 'Contract' | 'Intern';
  joiningDate: string;
  workLocation: string;
  reportingManager: string;
  grade: string;
  salary: string;
}

export interface OfficialDocuments {
  employeeId: string;
  passportNumber: string;
  passportExpiryDate: string;
  iqamaNumber: string;
  iqamaIssueDate: string;
  iqamaExpiryDate: string;
  visaNumber: string;
  insurancePolicyNumber: string;
  bankAccount: string;
}

export interface EmergencyContact {
  employeeId: string;
  name: string;
  relation: string;
  contactNumber: string;
  address: string;
}

export interface SkillsExperience {
  employeeId: string;
  skills: string;
  previousExperience: string;
  trainingCourses: string;
  remarks: string;
}

export interface EmployeeProfile extends Employee {
  company?: Company;
  jobInfo?: JobInfo;
  documents?: OfficialDocuments;
  emergencyContact?: EmergencyContact;
  skillsExperience?: SkillsExperience;
}

// =====================================================
// NEW EMPLOYEE MODULE TYPES
// =====================================================

export interface Department {
  department_id: string;
  department_code: string;
  name_en: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  parent_department_id?: string;
  manager_id?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Designation {
  designation_id: string;
  designation_code: string;
  title_en: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  level: number;
  department_id?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentType {
  document_type_id: string;
  type_code: string;
  name_en: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  requires_expiry: boolean;
  requires_permit_number: boolean;
  allowed_file_types: string[];
  max_file_size_mb: number;
  is_mandatory: boolean;
  is_active: boolean;
  notify_before_days: number;
  display_order: number;
}

export interface SkillCategory {
  category_id: string;
  category_code: string;
  name_en: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  icon?: string;
  color?: string;
  is_active: boolean;
  display_order: number;
}

export interface CustomField {
  field_id: string;
  field_code: string;
  field_type: 'text' | 'number' | 'date' | 'dropdown' | 'multiselect' | 'boolean' | 'file' | 'tags' | 'textarea' | 'email' | 'phone' | 'url';
  label_en: string;
  label_ar?: string;
  placeholder_en?: string;
  placeholder_ar?: string;
  help_text_en?: string;
  help_text_ar?: string;
  options?: any;
  validation_rules?: any;
  is_required: boolean;
  is_visible: boolean;
  is_searchable: boolean;
  section: string;
  display_order: number;
}

export interface EmployeeNew {
  employee_id: string;
  employee_code: string;

  // Personal Information
  first_name_en: string;
  first_name_ar?: string;
  middle_name_en?: string;
  middle_name_ar?: string;
  last_name_en: string;
  last_name_ar?: string;
  full_name_en?: string;
  full_name_ar?: string;

  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  nationality?: string;
  national_id?: string;
  passport_number?: string;
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';

  // Contact Information
  email?: string;
  phone_primary?: string;
  phone_secondary?: string;
  address_en?: string;
  address_ar?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;

  // Job Information
  department_id?: string;
  department?: Department;
  designation_id?: string;
  designation?: Designation;
  reports_to?: string;
  employment_type?: 'full-time' | 'part-time' | 'contract' | 'intern' | 'consultant';
  employment_status?: 'active' | 'inactive' | 'on-leave' | 'terminated' | 'resigned';
  joining_date?: string;
  confirmation_date?: string;
  termination_date?: string;
  work_location?: string;

  // System Fields
  user_id?: string;
  photo_url?: string;
  bio_en?: string;
  bio_ar?: string;

  // Metadata
  is_active: boolean;
  last_access_at?: string;
  tags?: string[];
  notes?: string;

  created_at: string;
  updated_at: string;
}

export interface EmployeeDocument {
  document_id: string;
  employee_id: string;
  document_type_id: string;
  document_type?: DocumentType;

  title_en: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;

  file_name: string;
  file_path: string;
  file_size_bytes?: number;
  file_type?: string;

  permit_number?: string;
  issue_date?: string;
  expiry_date?: string;
  is_expired?: boolean;
  days_until_expiry?: number;

  language: 'en' | 'ar' | 'both';
  status: 'active' | 'expired' | 'archived' | 'pending';

  verified_by?: string;
  verified_at?: string;

  created_at: string;
  updated_at: string;
}

export interface EmployeeSkill {
  skill_id: string;
  employee_id: string;
  category_id?: string;
  category?: SkillCategory;

  skill_name_en: string;
  skill_name_ar?: string;
  description_en?: string;
  description_ar?: string;

  proficiency_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_of_experience?: number;

  certification_name?: string;
  certification_number?: string;
  certification_date?: string;
  certification_expiry?: string;
  certifying_body?: string;

  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;

  created_at: string;
  updated_at: string;
}

export interface EmergencyContactNew {
  contact_id: string;
  employee_id: string;

  contact_name_en: string;
  contact_name_ar?: string;
  relationship: string;
  priority: 'primary' | 'secondary';

  phone_primary: string;
  phone_secondary?: string;
  email?: string;

  address_en?: string;
  address_ar?: string;
  city?: string;
  country?: string;

  notes?: string;

  created_at: string;
  updated_at: string;
}

export interface EmployeeAccessLog {
  log_id: string;
  employee_id: string;
  accessed_by: string;
  action: 'view' | 'edit' | 'delete' | 'export' | 'print';
  section?: string;
  ip_address?: string;
  user_agent?: string;
  accessed_at: string;
}

export interface SavedSearch {
  search_id: string;
  user_id: string;
  search_name: string;
  search_filters: any;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeFilters {
  search?: string;
  department_id?: string;
  designation_id?: string;
  employment_status?: string;
  employment_type?: string;
  joining_date_from?: string;
  joining_date_to?: string;
  tags?: string[];
  is_active?: boolean;
}

export interface EmployeeSortOptions {
  field: 'full_name_en' | 'full_name_ar' | 'joining_date' | 'last_access_at' | 'employee_code';
  direction: 'asc' | 'desc';
}