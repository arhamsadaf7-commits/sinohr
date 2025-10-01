import { supabase } from '../lib/supabase';
import { Employee, ZawilPermit, UploadLog, ZawilUploadRecord, ZawilUploadResult } from '../types/zawil';

// Check if we're in demo mode (mock authentication)
const isDemoMode = () => {
  const token = localStorage.getItem('auth_token');
  return token?.startsWith('demo-token-');
};

// Mock data for demo mode
const mockZawilPermits: ZawilPermit[] = [];
const mockUploadHistory: UploadLog[] = [];
let mockPermitIdCounter = 1;
let mockUploadIdCounter = 1;

export class ZawilService {
  // Check if employee exists by MOI number
  static async findEmployeeByMOI(moiNumber: string): Promise<Employee | null> {
    if (isDemoMode()) {
      // Return mock employee for demo
      return {
        employee_id: 1,
        english_name: 'Demo Employee',
        moi_number: moiNumber,
        passport_number: 'A12345678',
        nationality: 'Saudi Arabia',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('moi_number', moiNumber)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error finding employee:', error);
      return null;
    }
  }

  // Create new employee
  static async createEmployee(employeeData: Partial<Employee>): Promise<Employee> {
    if (isDemoMode()) {
      // Return mock employee for demo
      return {
        employee_id: Date.now(),
        arabic_name: employeeData.arabic_name,
        english_name: employeeData.english_name || 'Demo Employee',
        moi_number: employeeData.moi_number || '1234567890',
        passport_number: employeeData.passport_number,
        nationality: employeeData.nationality,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    const { data, error } = await supabase
      .from('employees')
      .insert([{
        arabic_name: employeeData.arabic_name,
        english_name: employeeData.english_name,
        moi_number: employeeData.moi_number,
        passport_number: employeeData.passport_number,
        nationality: employeeData.nationality
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create employee: ${error.message}`);
    }

    return data;
  }

  // Check for duplicate permit
  static async checkDuplicatePermit(moiNumber: string, issueDate: string): Promise<boolean> {
    if (isDemoMode()) {
      // Check mock data for duplicates
      return mockZawilPermits.some(permit => 
        permit.moi_number === moiNumber && permit.issue_date === issueDate
      );
    }

    try {
      const { data, error } = await supabase
        .from('zawil_permits')
        .select('permit_id')
        .eq('moi_number', moiNumber)
        .eq('issue_date', issueDate)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return false;
    }
  }

  // Insert Zawil permit
  static async insertZawilPermit(permitData: Partial<ZawilPermit>): Promise<ZawilPermit> {
    if (isDemoMode()) {
      // Create mock permit for demo
      const mockPermit: ZawilPermit = {
        permit_id: mockPermitIdCounter++,
        zawil_permit_id: permitData.zawil_permit_id || `ZWL${Date.now()}`,
        permit_type: permitData.permit_type || 'Work Permit',
        issued_for: permitData.issued_for || 'Individual',
        arabic_name: permitData.arabic_name,
        english_name: permitData.english_name || 'Demo Employee',
        moi_number: permitData.moi_number || '1234567890',
        passport_number: permitData.passport_number || 'A12345678',
        nationality: permitData.nationality || 'Saudi Arabia',
        plate_number: permitData.plate_number,
        port_name: permitData.port_name || 'Demo Port',
        issue_date: permitData.issue_date || new Date().toISOString().split('T')[0],
        expiry_date: permitData.expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        employee_id: 1,
        status: 'Valid',
        days_remaining: Math.ceil((new Date(permitData.expiry_date || '').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        employee: {
          employee_id: 1,
          english_name: 'Demo Employee',
          moi_number: permitData.moi_number || '1234567890',
          passport_number: 'A12345678',
          nationality: 'Saudi Arabia',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
      
      mockZawilPermits.push(mockPermit);
      return mockPermit;
    }

    const { data, error } = await supabase
      .from('zawil_permits')
      .insert([permitData])
      .select(`
        *,
        employee:employees(*)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to insert permit: ${error.message}`);
    }

    return data;
  }

  // Process Excel upload with employee auto-creation
  static async processZawilUpload(
    records: ZawilUploadRecord[],
    uploaderName: string,
    fileName: string
  ): Promise<ZawilUploadResult> {
    if (isDemoMode()) {
      // Process upload in demo mode
      let insertedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      // Create mock upload log
      const mockUploadLog = {
        upload_id: mockUploadIdCounter++,
        uploader_name: uploaderName,
        file_name: fileName,
        upload_date: new Date().toISOString(),
        rows_inserted: 0,
        rows_skipped: 0,
        total_rows: records.length,
        upload_status: 'Processing'
      };
      mockUploadHistory.push(mockUploadLog);

      // Process each valid record
      for (const record of records) {
        if (record.status === 'error') {
          skippedCount++;
          errors.push(`Row ${record.rowNumber}: ${record.errors.join(', ')}`);
          continue;
        }

        try {
          // Check for duplicate in mock data
          const isDuplicate = mockZawilPermits.some(permit => 
            permit.moi_number === record.moiNumber && permit.issue_date === record.issueDate
          );
          
          if (isDuplicate) {
            skippedCount++;
            errors.push(`Row ${record.rowNumber}: Duplicate permit (MOI: ${record.moiNumber}, Issue Date: ${record.issueDate})`);
            continue;
          }

          // Create mock permit
          await this.insertZawilPermit({
            zawil_permit_id: record.zawilPermitId,
            permit_type: record.permitType,
            issued_for: record.issuedFor,
            arabic_name: record.arabicName,
            english_name: record.englishName,
            moi_number: record.moiNumber,
            passport_number: record.passportNumber,
            nationality: record.nationality,
            plate_number: record.plateNumber,
            port_name: record.portName,
            issue_date: record.issueDate,
            expiry_date: record.expiryDate,
            employee_id: 1
          });

          insertedCount++;
        } catch (error) {
          skippedCount++;
          errors.push(`Row ${record.rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Update mock upload log
      mockUploadLog.rows_inserted = insertedCount;
      mockUploadLog.rows_skipped = skippedCount;
      mockUploadLog.upload_status = 'Completed';

      return {
        success: true,
        message: `Demo upload completed: ${insertedCount} inserted, ${skippedCount} skipped`,
        insertedCount,
        skippedCount,
        errors,
        uploadLogId: mockUploadLog.upload_id
      };
    }

    let insertedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    try {
      // Create upload log entry
      const { data: uploadLog, error: logError } = await supabase
        .from('upload_log')
        .insert([{
          uploader_name: uploaderName,
          file_name: fileName,
          total_rows: records.length,
          upload_status: 'Processing'
        }])
        .select()
        .single();

      if (logError) {
        throw new Error(`Failed to create upload log: ${logError.message}`);
      }

      // Process each valid record
      for (const record of records) {
        if (record.status === 'error') {
          skippedCount++;
          errors.push(`Row ${record.rowNumber}: ${record.errors.join(', ')}`);
          continue;
        }

        try {
          // Check for duplicate
          const isDuplicate = await this.checkDuplicatePermit(record.moiNumber, record.issueDate);
          if (isDuplicate) {
            skippedCount++;
            errors.push(`Row ${record.rowNumber}: Duplicate permit (MOI: ${record.moiNumber}, Issue Date: ${record.issueDate})`);
            continue;
          }

          // Find or create employee
          let employee = await this.findEmployeeByMOI(record.moiNumber);
          
          if (!employee) {
            // Auto-create employee
            employee = await this.createEmployee({
              arabic_name: record.arabicName,
              english_name: record.englishName,
              moi_number: record.moiNumber,
              passport_number: record.passportNumber,
              nationality: record.nationality
            });
          }

          // Insert Zawil permit
          await this.insertZawilPermit({
            zawil_permit_id: record.zawilPermitId,
            permit_type: record.permitType,
            issued_for: record.issuedFor,
            arabic_name: record.arabicName,
            english_name: record.englishName,
            moi_number: record.moiNumber,
            passport_number: record.passportNumber,
            nationality: record.nationality,
            plate_number: record.plateNumber,
            port_name: record.portName,
            issue_date: record.issueDate,
            expiry_date: record.expiryDate,
            employee_id: employee.employee_id
          });

          insertedCount++;

        } catch (error) {
          skippedCount++;
          errors.push(`Row ${record.rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Update upload log
      await supabase
        .from('upload_log')
        .update({
          rows_inserted: insertedCount,
          rows_skipped: skippedCount,
          upload_status: 'Completed'
        })
        .eq('upload_id', uploadLog.upload_id);

      return {
        success: true,
        message: `Upload completed: ${insertedCount} inserted, ${skippedCount} skipped`,
        insertedCount,
        skippedCount,
        errors,
        uploadLogId: uploadLog.upload_id
      };

    } catch (error) {
      return {
        success: false,
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        insertedCount,
        skippedCount,
        errors: [...errors, error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  // Get all Zawil permits with employee data
  static async getZawilPermits(): Promise<ZawilPermit[]> {
    if (isDemoMode()) {
      return mockZawilPermits;
    }

    const { data, error } = await supabase
      .from('zawil_permits')
      .select(`
        *,
        employee:employees(*)
      `)
      .order('expiry_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch permits: ${error.message}`);
    }

    return data || [];
  }

  // Update permit status
  static async updatePermitStatus(permitId: number, status: string): Promise<void> {
    if (isDemoMode()) {
      const permit = mockZawilPermits.find(p => p.permit_id === permitId);
      if (permit) {
        permit.status = status as any;
        permit.updated_at = new Date().toISOString();
      }
      return;
    }

    const { error } = await supabase
      .from('zawil_permits')
      .update({ status })
      .eq('permit_id', permitId);

    if (error) {
      throw new Error(`Failed to update status: ${error.message}`);
    }
  }

  // Update permit details
  static async updatePermit(permitId: number, updates: Partial<ZawilPermit>): Promise<ZawilPermit> {
    if (isDemoMode()) {
      const permitIndex = mockZawilPermits.findIndex(p => p.permit_id === permitId);
      if (permitIndex !== -1) {
        mockZawilPermits[permitIndex] = { ...mockZawilPermits[permitIndex], ...updates, updated_at: new Date().toISOString() };
        return mockZawilPermits[permitIndex];
      }
      throw new Error('Permit not found');
    }

    const { data, error } = await supabase
      .from('zawil_permits')
      .update(updates)
      .eq('permit_id', permitId)
      .select(`
        *,
        employee:employees(*)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update permit: ${error.message}`);
    }

    return data;
  }

  // Get upload history
  static async getUploadHistory(): Promise<UploadLog[]> {
    if (isDemoMode()) {
      return mockUploadHistory;
    }

    const { data, error } = await supabase
      .from('upload_log')
      .select('*')
      .order('upload_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch upload history: ${error.message}`);
    }

    return data || [];
  }

  // Get dashboard statistics
  static async getDashboardStats() {
    if (isDemoMode()) {
      const stats = {
        total: mockZawilPermits.length,
        expired: mockZawilPermits.filter(p => p.status === 'Expired').length,
        expiringSoon: mockZawilPermits.filter(p => p.status === 'Expiring Soon').length,
        valid: mockZawilPermits.filter(p => p.status === 'Valid').length,
        done: mockZawilPermits.filter(p => p.status === 'Done').length
      };
      return stats;
    }

    const { data, error } = await supabase
      .from('zawil_permits')
      .select('status');

    if (error) {
      throw new Error(`Failed to fetch stats: ${error.message}`);
    }

    const stats = {
      total: data?.length || 0,
      expired: data?.filter(p => p.status === 'Expired').length || 0,
      expiringSoon: data?.filter(p => p.status === 'Expiring Soon').length || 0,
      valid: data?.filter(p => p.status === 'Valid').length || 0,
      done: data?.filter(p => p.status === 'Done').length || 0
    };

    return stats;
  }

  // Bulk update status
  static async bulkUpdateStatus(permitIds: number[], status: string): Promise<void> {
    if (isDemoMode()) {
      mockZawilPermits.forEach(permit => {
        if (permitIds.includes(permit.permit_id)) {
          permit.status = status as any;
          permit.updated_at = new Date().toISOString();
        }
      });
      return;
    }

    const { error } = await supabase
      .from('zawil_permits')
      .update({ status })
      .in('permit_id', permitIds);

    if (error) {
      throw new Error(`Failed to bulk update: ${error.message}`);
    }
  }

  // Export permits to CSV
  static exportToCSV(permits: ZawilPermit[]): void {
    const headers = [
      'Zawil Permit Id', 'Permit Type', 'Issued for', 'Arabic Name', 'English Name',
      'MOI Number', 'Passport Number', 'Nationality', 'Plate Number', 'Port Name',
      'Issue Date', 'Expiry Date', 'Status', 'Days Remaining'
    ];

    const csvContent = [
      headers.join(','),
      ...permits.map(permit => [
        permit.zawil_permit_id,
        permit.permit_type,
        permit.issued_for,
        permit.arabic_name || '',
        permit.english_name,
        permit.moi_number,
        permit.passport_number,
        permit.nationality,
        permit.plate_number || '',
        permit.port_name,
        permit.issue_date,
        permit.expiry_date,
        permit.status,
        permit.days_remaining
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zawil-permits-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}