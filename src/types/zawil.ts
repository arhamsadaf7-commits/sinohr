export interface Employee {
  employee_id: number;
  arabic_name?: string;
  english_name: string;
  moi_number: string;
  passport_number?: string;
  nationality?: string;
  created_at: string;
  updated_at: string;
}

export interface ZawilPermit {
  permit_id: number;
  zawil_permit_id: string;
  permit_type: string;
  issued_for: string;
  arabic_name?: string;
  english_name: string;
  moi_number: string;
  passport_number: string;
  nationality: string;
  plate_number?: string;
  port_name: string;
  issue_date: string;
  expiry_date: string;
  employee_id?: number;
  status: 'Valid' | 'Expiring Soon' | 'Expired' | 'Done';
  days_remaining: number;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface UploadLog {
  upload_id: number;
  uploader_name: string;
  file_name: string;
  upload_date: string;
  rows_inserted: number;
  rows_skipped: number;
  total_rows: number;
  upload_status: string;
}

export interface ZawilUploadRecord {
  id: string;
  fileName: string;
  rowNumber: number;
  zawilPermitId: string;
  permitType: string;
  issuedFor: string;
  arabicName: string;
  englishName: string;
  moiNumber: string;
  passportNumber: string;
  nationality: string;
  plateNumber: string;
  portName: string;
  issueDate: string;
  expiryDate: string;
  status: 'success' | 'error' | 'warning' | 'duplicate';
  errors: string[];
  isDuplicate?: boolean;
}