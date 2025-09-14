import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { useEmployee } from '../../context/EmployeeContext';
import { 
  Upload, 
  FileSpreadsheet, 
  Trash2, 
  Save, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Download,
  Eye,
  X,
  ArrowRight
} from 'lucide-react';

interface ZawilRecord {
  id: string;
  fileName: string;
  rowNumber: number;
  englishName: string;
  iqamaNumber: string;
  mobileNumber: string;
  permitNumber: string;
  permitType: string;
  issuesDate: string;
  expiryDate: string;
  status: 'success' | 'error' | 'warning' | 'duplicate';
  errors: string[];
  isDuplicate?: boolean;
}

interface InsertedRecord extends ZawilRecord {
  insertedAt: string;
  employeeId?: string;
  isNewEmployee?: boolean;
}

export const ZawilExcelUploader: React.FC = () => {
  const { state, dispatch } = useEmployee();
  const [files, setFiles] = useState<File[]>([]);
  const [extractedRecords, setExtractedRecords] = useState<ZawilRecord[]>([]);
  const [insertedRecords, setInsertedRecords] = useState<InsertedRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [existingPermitNumbers] = useState<Set<string>>(new Set()); // This would come from database

  // Column mapping for different possible Excel headers
  const columnMappings = {
    englishName: ['english name', 'name', 'employee name', 'full name', 'worker name'],
    iqamaNumber: ['iqama number', 'iqama', 'moi number', 'id number', 'national id'],
    mobileNumber: ['mobile number', 'mobile', 'phone', 'contact', 'cell phone'],
    permitNumber: ['permit number', 'permit no', 'license number', 'license no'],
    permitType: ['permit type', 'type', 'license type', 'permit category'],
    issuesDate: ['issues date', 'issue date', 'issued date', 'start date'],
    expiryDate: ['expiry date', 'expire date', 'end date', 'valid until']
  };

  // Find column index by matching header names
  const findColumnIndex = (headers: string[], fieldMappings: string[]): number => {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]?.toString().toLowerCase().trim();
      if (fieldMappings.some(mapping => header.includes(mapping))) {
        return i;
      }
    }
    return -1;
  };

  // Format date from Excel serial number or string
  const formatDate = (value: any): string => {
    if (!value) return '';
    
    try {
      // If it's an Excel date serial number
      if (typeof value === 'number' && value > 25000) {
        const date = XLSX.SSF.parse_date_code(value);
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
      
      // If it's already a date string
      if (typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
        return value;
      }
      
      // If it's a Date object
      if (value instanceof Date) {
        return value.toISOString().split('T')[0];
      }
      
      return value.toString();
    } catch (error) {
      return value?.toString() || '';
    }
  };

  // Normalize mobile number to Saudi format
  const normalizeMobileNumber = (mobile: string): string => {
    if (!mobile) return '';
    
    const cleaned = mobile.toString().replace(/\D/g, '');
    
    if (cleaned.startsWith('966')) {
      return '0' + cleaned.substring(3);
    } else if (cleaned.startsWith('+966')) {
      return '0' + cleaned.substring(4);
    } else if (cleaned.length === 9 && cleaned.startsWith('5')) {
      return '0' + cleaned;
    } else if (cleaned.length === 10 && cleaned.startsWith('05')) {
      return cleaned;
    }
    
    return mobile;
  };

  // Check if permit number already exists
  const checkDuplicatePermit = (permitNumber: string): boolean => {
    return existingPermitNumbers.has(permitNumber);
  };

  // Extract data from Excel worksheet
  const extractDataFromWorksheet = (worksheet: XLSX.WorkSheet, fileName: string): ZawilRecord[] => {
    const records: ZawilRecord[] = [];
    
    try {
      // Convert worksheet to array of arrays
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
      
      if (data.length < 2) {
        toast.error(`${fileName}: No data rows found`);
        return records;
      }

      // Get headers from first row
      const headers = data[0].map((h: any) => h?.toString().toLowerCase().trim() || '');
      
      // Find column indices
      const columnIndices = {
        englishName: findColumnIndex(headers, columnMappings.englishName),
        iqamaNumber: findColumnIndex(headers, columnMappings.iqamaNumber),
        mobileNumber: findColumnIndex(headers, columnMappings.mobileNumber),
        permitNumber: findColumnIndex(headers, columnMappings.permitNumber),
        permitType: findColumnIndex(headers, columnMappings.permitType),
        issuesDate: findColumnIndex(headers, columnMappings.issuesDate),
        expiryDate: findColumnIndex(headers, columnMappings.expiryDate)
      };

      // Process data rows (skip header row)
      for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        
        // Skip empty rows
        if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
          continue;
        }

        const permitNumber = columnIndices.permitNumber >= 0 ? (row[columnIndices.permitNumber]?.toString().trim() || '') : '';
        const isDuplicate = permitNumber ? checkDuplicatePermit(permitNumber) : false;

        const record: ZawilRecord = {
          id: `${fileName}-${rowIndex}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          fileName,
          rowNumber: rowIndex + 1,
          englishName: columnIndices.englishName >= 0 ? (row[columnIndices.englishName]?.toString().trim() || '') : '',
          iqamaNumber: columnIndices.iqamaNumber >= 0 ? (row[columnIndices.iqamaNumber]?.toString().replace(/\D/g, '') || '') : '',
          mobileNumber: columnIndices.mobileNumber >= 0 ? normalizeMobileNumber(row[columnIndices.mobileNumber]?.toString() || '') : '',
          permitNumber,
          permitType: columnIndices.permitType >= 0 ? (row[columnIndices.permitType]?.toString().trim() || '') : '',
          issuesDate: columnIndices.issuesDate >= 0 ? formatDate(row[columnIndices.issuesDate]) : '',
          expiryDate: columnIndices.expiryDate >= 0 ? formatDate(row[columnIndices.expiryDate]) : '',
          status: 'success',
          errors: [],
          isDuplicate
        };

        // Validate extracted data
        const errors: string[] = [];
        
        if (!record.englishName) errors.push('English name missing');
        if (!record.iqamaNumber || record.iqamaNumber.length !== 10) errors.push('Valid Iqama number missing');
        if (!record.mobileNumber) errors.push('Mobile number missing');
        if (!record.permitNumber) errors.push('Permit number missing');
        if (!record.permitType) errors.push('Permit type missing');
        if (!record.expiryDate) errors.push('Expiry date missing');

        record.errors = errors;
        
        if (isDuplicate) {
          record.status = 'duplicate';
        } else if (errors.length === 0) {
          record.status = 'success';
        } else if (errors.length <= 2) {
          record.status = 'warning';
        } else {
          record.status = 'error';
        }

        records.push(record);
      }

    } catch (error) {
      console.error(`Error processing ${fileName}:`, error);
      toast.error(`Failed to process ${fileName}`);
    }

    return records;
  };

  // Process multiple Excel files
  const processZawilExcel = async (files: File[]) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    const allRecords: ZawilRecord[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingProgress(((i + 1) / files.length) * 100);

        try {
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          
          // Process all worksheets in the workbook
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const records = extractDataFromWorksheet(worksheet, `${file.name} (${sheetName})`);
            allRecords.push(...records);
          });

        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          toast.error(`Failed to process ${file.name}`);
        }
      }

      setExtractedRecords(allRecords);
      
      const successCount = allRecords.filter(r => r.status === 'success').length;
      const warningCount = allRecords.filter(r => r.status === 'warning').length;
      const errorCount = allRecords.filter(r => r.status === 'error').length;
      const duplicateCount = allRecords.filter(r => r.status === 'duplicate').length;

      if (successCount > 0) {
        toast.success(`Successfully processed ${successCount} records${warningCount > 0 ? ` (${warningCount} with warnings)` : ''}${duplicateCount > 0 ? `, ${duplicateCount} duplicates found` : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
      } else {
        toast.error(`Failed to process ${errorCount} records`);
      }

    } catch (error) {
      console.error('Error processing Excel files:', error);
      toast.error('Failed to process Excel files');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const excelFiles = acceptedFiles.filter(file => 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    );
    
    if (excelFiles.length !== acceptedFiles.length) {
      toast.error('Only Excel files (.xlsx, .xls) are allowed');
    }
    
    if (excelFiles.length > 0) {
      setFiles(prev => [...prev, ...excelFiles]);
      processZawilExcel(excelFiles);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: true
  });

  // Remove a record from the list
  const removeRecord = (id: string) => {
    setExtractedRecords(prev => prev.filter(record => record.id !== id));
    toast.success('Record removed');
  };

  // Check if Iqama number matches existing employee
  const findEmployeeByIqama = (iqamaNumber: string) => {
    return state.employees.find(emp => {
      const empDocs = state.documents.find(doc => doc.employeeId === emp.id);
      return empDocs?.iqamaNumber === iqamaNumber;
    });
  };

  // Create new employee from Zawil data
  const createEmployeeFromZawil = (record: ZawilRecord) => {
    const newEmployeeId = `EMP${Date.now()}`;
    
    // Create employee
    const newEmployee = {
      id: newEmployeeId,
      companyId: '', // Will need to be set based on company name or default
      fullName: record.englishName,
      gender: 'Male' as const, // Default, can be updated later
      dateOfBirth: '', // Not available in Zawil data
      nationality: '', // Not available in Zawil data
      maritalStatus: 'Single' as const, // Default
      contactNumber: record.mobileNumber,
      email: '', // Not available in Zawil data
      address: '' // Not available in Zawil data
    };

    // Create documents with Iqama number
    const newDocuments = {
      employeeId: newEmployeeId,
      passportNumber: '',
      passportExpiryDate: '',
      iqamaNumber: record.iqamaNumber,
      iqamaIssueDate: '',
      iqamaExpiryDate: '',
      visaNumber: '',
      insurancePolicyNumber: '',
      bankAccount: ''
    };

    return { employee: newEmployee, documents: newDocuments };
  };

  // Save records to database with duplicate handling and Zawil expiry logic
  const saveToDatabase = async () => {
    const validRecords = extractedRecords.filter(record => 
      record.status === 'success' || record.status === 'warning'
    );

    if (validRecords.length === 0) {
      toast.error('No valid records to save');
      return;
    }

    setIsSaving(true);
    const inserted: InsertedRecord[] = [];

    try {
      for (const record of validRecords) {
        // Skip duplicates
        if (record.isDuplicate) {
          continue;
        }

        // Check if Iqama number matches existing employee
        const existingEmployee = findEmployeeByIqama(record.iqamaNumber);
        
        let employeeId: string;
        let isNewEmployee = false;

        if (existingEmployee) {
          // Use existing employee
          employeeId = existingEmployee.id;
        } else {
          // Create new employee from Zawil data
          const { employee, documents } = createEmployeeFromZawil(record);
          
          // Add employee to context
          dispatch({ type: 'ADD_EMPLOYEE', payload: employee });
          dispatch({ type: 'ADD_DOCUMENTS', payload: documents });
          
          employeeId = employee.id;
          isNewEmployee = true;
        }

        // Add Zawil record to database (this would be a new Zawil table)
        // For now, we'll simulate this by adding to skills/experience
        const zawilData = {
          employeeId,
          skills: `Zawil Permit: ${record.permitType}`,
          previousExperience: `Permit Number: ${record.permitNumber}`,
          trainingCourses: `Issues Date: ${record.issuesDate}`,
          remarks: `Expiry Date: ${record.expiryDate} (Zawil Data)`
        };

        // Check if skills/experience already exists for this employee
        const existingSkills = state.skillsExperiences.find(se => se.employeeId === employeeId);
        if (existingSkills) {
          // Update existing
          const updatedSkills = {
            ...existingSkills,
            skills: existingSkills.skills ? `${existingSkills.skills}, ${zawilData.skills}` : zawilData.skills,
            remarks: existingSkills.remarks ? `${existingSkills.remarks}\n${zawilData.remarks}` : zawilData.remarks
          };
          dispatch({ type: 'UPDATE_SKILLS_EXPERIENCE', payload: updatedSkills });
        } else {
          // Add new
          dispatch({ type: 'ADD_SKILLS_EXPERIENCE', payload: zawilData });
        }

        // Add to inserted records
        inserted.push({
          ...record,
          insertedAt: new Date().toISOString(),
          employeeId,
          isNewEmployee
        });

        // Add permit number to existing set to prevent future duplicates
        existingPermitNumbers.add(record.permitNumber);
      }

      setInsertedRecords(inserted);
      toast.success(`Successfully saved ${inserted.length} records to database`);
      setShowResults(true);
      
      // Clear extracted records after successful save
      setExtractedRecords([]);
      setFiles([]);

    } catch (error) {
      console.error('Error saving to database:', error);
      toast.error('Failed to save records to database');
    } finally {
      setIsSaving(false);
    }
  };

  // Clear all files and records
  const clearAll = () => {
    setFiles([]);
    setExtractedRecords([]);
    setInsertedRecords([]);
    setShowResults(false);
    toast.success('All files cleared');
  };

  // Export sample Excel template
  const downloadTemplate = () => {
    const templateData = [
      ['English Name', 'Iqama Number', 'Mobile Number', 'Permit Number', 'Permit Type', 'Issues Date', 'Expiry Date'],
      ['John Doe', '1234567890', '0501234567', 'PRM123456', 'Work Permit', '2024-01-01', '2024-12-31'],
      ['Jane Smith', '0987654321', '0509876543', 'PRM789012', 'Business License', '2024-02-01', '2025-01-31']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Zawil Data');
    XLSX.writeFile(workbook, 'Zawil_Data_Template.xlsx');
    toast.success('Template downloaded successfully');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'duplicate':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'duplicate':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (showResults) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Zawil Upload Results</h1>
              <p className="text-gray-600">Successfully inserted {insertedRecords.length} records</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResults(false)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload More Files
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{insertedRecords.length}</div>
                <div className="text-sm text-green-700">Records Inserted</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {insertedRecords.filter(r => r.isNewEmployee).length}
                </div>
                <div className="text-sm text-blue-700">New Employees Created</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">
                  {insertedRecords.filter(r => !r.isNewEmployee).length}
                </div>
                <div className="text-sm text-purple-700">Existing Employees Updated</div>
              </div>
            </div>
          </div>

          {/* Inserted Records Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inserted Records</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">English Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Iqama Number</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Mobile Number</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Permit Number</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Permit Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Expiry Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Employee Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Inserted At</th>
                  </tr>
                </thead>
                <tbody>
                  {insertedRecords.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600">Inserted</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">{record.englishName}</td>
                      <td className="py-3 px-4 font-mono">{record.iqamaNumber}</td>
                      <td className="py-3 px-4 font-mono">{record.mobileNumber}</td>
                      <td className="py-3 px-4 font-mono">{record.permitNumber}</td>
                      <td className="py-3 px-4">{record.permitType}</td>
                      <td className="py-3 px-4">{record.expiryDate}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          record.isNewEmployee 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {record.isNewEmployee ? 'New Employee' : 'Existing Employee'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {new Date(record.insertedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Zawil Excel Uploader</h1>
          <p className="text-gray-600">Upload and extract employee permit data from Excel files with duplicate handling</p>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upload Excel Files</h2>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? 'Drop Excel files here' : 'Upload Excel Files'}
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop Excel files (.xlsx, .xls) here, or click to browse and select files
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Browse Files
            </button>
          </div>

          {files.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-900">Uploaded Files ({files.length})</h4>
                <button
                  onClick={clearAll}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                    <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Processing Progress */}
        {isProcessing && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <h3 className="font-medium text-gray-900">Processing Excel Files...</h3>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{Math.round(processingProgress)}% complete</p>
          </div>
        )}

        {/* Extracted Data Preview */}
        {extractedRecords.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Extracted Data Preview</h3>
                <p className="text-sm text-gray-600">
                  {extractedRecords.length} records extracted. Review and remove incorrect entries before saving.
                </p>
              </div>
              <button
                onClick={saveToDatabase}
                disabled={isSaving || extractedRecords.filter(r => r.status !== 'error' && r.status !== 'duplicate').length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save to Database ({extractedRecords.filter(r => r.status !== 'error' && r.status !== 'duplicate').length})
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Row</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">English Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Iqama Number</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Mobile Number</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Permit Number</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Permit Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Issues Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Expiry Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedRecords.map((record) => (
                    <tr key={record.id} className={`border-b border-gray-100 ${getStatusColor(record.status)}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(record.status)}
                          <span className="text-xs capitalize">
                            {record.status === 'duplicate' ? 'Duplicate' : record.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">{record.rowNumber}</td>
                      <td className="py-3 px-4">
                        <div className="max-w-32 truncate" title={record.englishName}>
                          {record.englishName || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">{record.iqamaNumber || '-'}</td>
                      <td className="py-3 px-4 font-mono">{record.mobileNumber || '-'}</td>
                      <td className="py-3 px-4 font-mono">{record.permitNumber || '-'}</td>
                      <td className="py-3 px-4">{record.permitType || '-'}</td>
                      <td className="py-3 px-4">{record.issuesDate || '-'}</td>
                      <td className="py-3 px-4">{record.expiryDate || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {record.errors.length > 0 && (
                            <button
                              onClick={() => setShowPreview(record.id)}
                              className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                              title={`View errors: ${record.errors.join(', ')}`}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => removeRecord(record.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Remove record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-6 flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Success: {extractedRecords.filter(r => r.status === 'success').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span>Warning: {extractedRecords.filter(r => r.status === 'warning').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Error: {extractedRecords.filter(r => r.status === 'error').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span>Duplicate: {extractedRecords.filter(r => r.status === 'duplicate').length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Record Details</h3>
                <button
                  onClick={() => setShowPreview(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                {(() => {
                  const record = extractedRecords.find(r => r.id === showPreview);
                  return record ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">File: {record.fileName}</h4>
                        <p className="text-sm text-gray-600">Row: {record.rowNumber}</p>
                      </div>
                      {record.errors.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Errors:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {record.errors.map((error, index) => (
                              <li key={index} className="text-sm text-red-600">{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {record.isDuplicate && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <p className="text-blue-800 text-sm">
                            <strong>Duplicate Permit Number:</strong> This permit number already exists in the database and will be skipped during insertion.
                          </p>
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Extracted Data:</h4>
                        <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                          <p><strong>English Name:</strong> {record.englishName || 'Not found'}</p>
                          <p><strong>Iqama Number:</strong> {record.iqamaNumber || 'Not found'}</p>
                          <p><strong>Mobile Number:</strong> {record.mobileNumber || 'Not found'}</p>
                          <p><strong>Permit Number:</strong> {record.permitNumber || 'Not found'}</p>
                          <p><strong>Permit Type:</strong> {record.permitType || 'Not found'}</p>
                          <p><strong>Issues Date:</strong> {record.issuesDate || 'Not found'}</p>
                          <p><strong>Expiry Date:</strong> {record.expiryDate || 'Not found'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Record not found</p>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};