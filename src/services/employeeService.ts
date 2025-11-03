import { supabase } from '../lib/supabase';
import type {
  EmployeeNew,
  EmployeeFilters,
  EmployeeSortOptions,
  Department,
  Designation,
  EmployeeDocument,
  EmployeeSkill,
  EmergencyContactNew,
  EmployeeAccessLog,
  DocumentType,
  SkillCategory
} from '../types/employee';

// =====================================================
// EMPLOYEES
// =====================================================

export const fetchEmployees = async (
  filters?: EmployeeFilters,
  sort?: EmployeeSortOptions,
  page: number = 1,
  pageSize: number = 20
) => {
  try {
    let query = supabase
      .from('employees')
      .select(`
        *,
        department:departments(department_id, name_en, name_ar),
        designation:designations(designation_id, title_en, title_ar)
      `, { count: 'exact' });

    // Apply filters
    if (filters?.search) {
      query = query.or(`full_name_en.ilike.%${filters.search}%,full_name_ar.ilike.%${filters.search}%,email.ilike.%${filters.search}%,employee_code.ilike.%${filters.search}%`);
    }

    if (filters?.department_id) {
      query = query.eq('department_id', filters.department_id);
    }

    if (filters?.designation_id) {
      query = query.eq('designation_id', filters.designation_id);
    }

    if (filters?.employment_status) {
      query = query.eq('employment_status', filters.employment_status);
    }

    if (filters?.employment_type) {
      query = query.eq('employment_type', filters.employment_type);
    }

    if (filters?.joining_date_from) {
      query = query.gte('joining_date', filters.joining_date_from);
    }

    if (filters?.joining_date_to) {
      query = query.lte('joining_date', filters.joining_date_to);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    // Apply sorting
    const sortField = sort?.field || 'full_name_en';
    const sortDirection = sort?.direction || 'asc';
    query = query.order(sortField, { ascending: sortDirection === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      employees: data as EmployeeNew[],
      total: count || 0,
      page,
      pageSize,
      totalPages: count ? Math.ceil(count / pageSize) : 0
    };
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

export const fetchEmployeeById = async (employeeId: string) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        department:departments(*),
        designation:designations(*),
        reports_to_employee:employees!reports_to(employee_id, full_name_en, full_name_ar)
      `)
      .eq('employee_id', employeeId)
      .single();

    if (error) throw error;
    return data as EmployeeNew;
  } catch (error) {
    console.error('Error fetching employee:', error);
    throw error;
  }
};

export const createEmployee = async (employee: Partial<EmployeeNew>) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .insert([employee])
      .select()
      .single();

    if (error) throw error;
    return data as EmployeeNew;
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
};

export const updateEmployee = async (employeeId: string, updates: Partial<EmployeeNew>) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('employee_id', employeeId)
      .select()
      .single();

    if (error) throw error;
    return data as EmployeeNew;
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

export const deleteEmployee = async (employeeId: string) => {
  try {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('employee_id', employeeId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
};

// =====================================================
// DEPARTMENTS
// =====================================================

export const fetchDepartments = async (activeOnly: boolean = true) => {
  try {
    let query = supabase
      .from('departments')
      .select('*')
      .order('display_order');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Department[];
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
};

export const createDepartment = async (department: Partial<Department>) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .insert([department])
      .select()
      .single();

    if (error) throw error;
    return data as Department;
  } catch (error) {
    console.error('Error creating department:', error);
    throw error;
  }
};

export const updateDepartment = async (departmentId: string, updates: Partial<Department>) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .update(updates)
      .eq('department_id', departmentId)
      .select()
      .single();

    if (error) throw error;
    return data as Department;
  } catch (error) {
    console.error('Error updating department:', error);
    throw error;
  }
};

export const deleteDepartment = async (departmentId: string) => {
  try {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('department_id', departmentId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting department:', error);
    throw error;
  }
};

// =====================================================
// DESIGNATIONS
// =====================================================

export const fetchDesignations = async (activeOnly: boolean = true, departmentId?: string) => {
  try {
    let query = supabase
      .from('designations')
      .select('*')
      .order('display_order');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Designation[];
  } catch (error) {
    console.error('Error fetching designations:', error);
    throw error;
  }
};

export const createDesignation = async (designation: Partial<Designation>) => {
  try {
    const { data, error } = await supabase
      .from('designations')
      .insert([designation])
      .select()
      .single();

    if (error) throw error;
    return data as Designation;
  } catch (error) {
    console.error('Error creating designation:', error);
    throw error;
  }
};

export const updateDesignation = async (designationId: string, updates: Partial<Designation>) => {
  try {
    const { data, error} = await supabase
      .from('designations')
      .update(updates)
      .eq('designation_id', designationId)
      .select()
      .single();

    if (error) throw error;
    return data as Designation;
  } catch (error) {
    console.error('Error updating designation:', error);
    throw error;
  }
};

export const deleteDesignation = async (designationId: string) => {
  try {
    const { error } = await supabase
      .from('designations')
      .delete()
      .eq('designation_id', designationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting designation:', error);
    throw error;
  }
};

// =====================================================
// EMPLOYEE DOCUMENTS
// =====================================================

export const fetchEmployeeDocuments = async (employeeId: string) => {
  try {
    const { data, error } = await supabase
      .from('employee_documents')
      .select(`
        *,
        document_type:document_types(*)
      `)
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as EmployeeDocument[];
  } catch (error) {
    console.error('Error fetching employee documents:', error);
    throw error;
  }
};

export const createEmployeeDocument = async (document: Partial<EmployeeDocument>) => {
  try {
    const { data, error } = await supabase
      .from('employee_documents')
      .insert([document])
      .select()
      .single();

    if (error) throw error;
    return data as EmployeeDocument;
  } catch (error) {
    console.error('Error creating employee document:', error);
    throw error;
  }
};

export const updateEmployeeDocument = async (documentId: string, updates: Partial<EmployeeDocument>) => {
  try {
    const { data, error } = await supabase
      .from('employee_documents')
      .update(updates)
      .eq('document_id', documentId)
      .select()
      .single();

    if (error) throw error;
    return data as EmployeeDocument;
  } catch (error) {
    console.error('Error updating employee document:', error);
    throw error;
  }
};

export const deleteEmployeeDocument = async (documentId: string) => {
  try {
    const { error } = await supabase
      .from('employee_documents')
      .delete()
      .eq('document_id', documentId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting employee document:', error);
    throw error;
  }
};

// =====================================================
// EMPLOYEE SKILLS
// =====================================================

export const fetchEmployeeSkills = async (employeeId: string) => {
  try {
    const { data, error } = await supabase
      .from('employee_skills')
      .select(`
        *,
        category:skill_categories(*)
      `)
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as EmployeeSkill[];
  } catch (error) {
    console.error('Error fetching employee skills:', error);
    throw error;
  }
};

export const createEmployeeSkill = async (skill: Partial<EmployeeSkill>) => {
  try {
    const { data, error } = await supabase
      .from('employee_skills')
      .insert([skill])
      .select()
      .single();

    if (error) throw error;
    return data as EmployeeSkill;
  } catch (error) {
    console.error('Error creating employee skill:', error);
    throw error;
  }
};

export const updateEmployeeSkill = async (skillId: string, updates: Partial<EmployeeSkill>) => {
  try {
    const { data, error } = await supabase
      .from('employee_skills')
      .update(updates)
      .eq('skill_id', skillId)
      .select()
      .single();

    if (error) throw error;
    return data as EmployeeSkill;
  } catch (error) {
    console.error('Error updating employee skill:', error);
    throw error;
  }
};

export const deleteEmployeeSkill = async (skillId: string) => {
  try {
    const { error } = await supabase
      .from('employee_skills')
      .delete()
      .eq('skill_id', skillId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting employee skill:', error);
    throw error;
  }
};

// =====================================================
// EMERGENCY CONTACTS
// =====================================================

export const fetchEmergencyContacts = async (employeeId: string) => {
  try {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('employee_id', employeeId)
      .order('priority');

    if (error) throw error;
    return data as EmergencyContactNew[];
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    throw error;
  }
};

export const createEmergencyContact = async (contact: Partial<EmergencyContactNew>) => {
  try {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .insert([contact])
      .select()
      .single();

    if (error) throw error;
    return data as EmergencyContactNew;
  } catch (error) {
    console.error('Error creating emergency contact:', error);
    throw error;
  }
};

export const updateEmergencyContact = async (contactId: string, updates: Partial<EmergencyContactNew>) => {
  try {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .update(updates)
      .eq('contact_id', contactId)
      .select()
      .single();

    if (error) throw error;
    return data as EmergencyContactNew;
  } catch (error) {
    console.error('Error updating emergency contact:', error);
    throw error;
  }
};

export const deleteEmergencyContact = async (contactId: string) => {
  try {
    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('contact_id', contactId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    throw error;
  }
};

// =====================================================
// ACCESS LOG
// =====================================================

export const logEmployeeAccess = async (log: Omit<EmployeeAccessLog, 'log_id' | 'accessed_at'>) => {
  try {
    const { data, error } = await supabase
      .from('employee_access_log')
      .insert([log])
      .select()
      .single();

    if (error) throw error;
    return data as EmployeeAccessLog;
  } catch (error) {
    console.error('Error logging employee access:', error);
    throw error;
  }
};

export const fetchEmployeeAccessLog = async (employeeId: string, limit: number = 50) => {
  try {
    const { data, error } = await supabase
      .from('employee_access_log')
      .select('*')
      .eq('employee_id', employeeId)
      .order('accessed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as EmployeeAccessLog[];
  } catch (error) {
    console.error('Error fetching employee access log:', error);
    throw error;
  }
};

// =====================================================
// DOCUMENT TYPES
// =====================================================

export const fetchDocumentTypes = async (activeOnly: boolean = true) => {
  try {
    let query = supabase
      .from('document_types')
      .select('*')
      .order('display_order');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as DocumentType[];
  } catch (error) {
    console.error('Error fetching document types:', error);
    throw error;
  }
};

// =====================================================
// SKILL CATEGORIES
// =====================================================

export const fetchSkillCategories = async (activeOnly: boolean = true) => {
  try {
    let query = supabase
      .from('skill_categories')
      .select('*')
      .order('display_order');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as SkillCategory[];
  } catch (error) {
    console.error('Error fetching skill categories:', error);
    throw error;
  }
};

// =====================================================
// EXPORT FUNCTIONS
// =====================================================

export const exportEmployeesToCSV = async (filters?: EmployeeFilters) => {
  try {
    const { employees } = await fetchEmployees(filters, undefined, 1, 10000);

    const csvRows = [];
    const headers = [
      'Employee Code', 'Full Name (EN)', 'Email', 'Phone', 'Department',
      'Designation', 'Employment Type', 'Employment Status', 'Joining Date'
    ];
    csvRows.push(headers.join(','));

    employees.forEach(emp => {
      const row = [
        emp.employee_code,
        emp.full_name_en || '',
        emp.email || '',
        emp.phone_primary || '',
        emp.department?.name_en || '',
        emp.designation?.title_en || '',
        emp.employment_type || '',
        emp.employment_status || '',
        emp.joining_date || ''
      ];
      csvRows.push(row.map(field => `"${field}"`).join(','));
    });

    return csvRows.join('\n');
  } catch (error) {
    console.error('Error exporting employees to CSV:', error);
    throw error;
  }
};
