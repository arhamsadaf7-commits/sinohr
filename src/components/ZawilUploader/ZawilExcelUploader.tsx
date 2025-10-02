import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { ZawilService } from '../../services/zawilService';
import { ZawilUploadRecord } from '../../types/zawil';
import { useAuth } from '../../context/AuthContext';
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

export const ZawilExcelUploader: React.FC = () => {
  const { state: authState } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [extractedRecords, setExtractedRecords] = useState<ZawilUploadRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showPreview, setShowPreview] = useState<string | null>(null);

  // Exact required columns as specified
  const requiredColumns = [
    'Zawil Permit Id',
    'Permit Type',
    'Issued for',
    'Arabic Name',
    'English Name',
    'MOI Number',
    'Passport Number',
    'Nationality',
    'Plate Number',
    'Port Name',
    'Issue Date',
    'Expiry Date'
  ];

  // Column mapping for finding columns in Excel
  const columnMappings = {
    zawilPermitId: ['zawil permit id', 'permit id', 'zawil id'],
    permitType: ['permit type', 'type'],
    issuedFor: ['issued for', 'issued to'],
    arabicName: ['arabic name', 'name arabic'],
    englishName: ['english name', 'name english'],
    moiNumber: ['moi number', 'iqama number', 'national id'],
    passportNumber: ['passport number', 'passport no'],
    nationality: ['nationality', 'country'],
    plateNumber: ['plate number', 'plate no', 'vehicle number'],
    portName: ['port name', 'port'],
    issueDate: ['issue date', 'issued date', 'start date'],
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

  // Validate required columns are present
  const validateColumns = (headers: string[]): { isValid: boolean; missingColumns: string[] } => {
    const normalizedHeaders = headers.map(h => h?.toString().toLowerCase().trim() || '');
    const missingColumns: string[] = [];

    for (const requiredCol of requiredColumns) {
      const fieldKey = Object.keys(columnMappings).find(key => 
        requiredCol.toLowerCase().includes(key.toLowerCase().replace(/([A-Z])/g, ' $1').trim())
      ) as keyof typeof columnMappings;
      
      if (fieldKey) {
        const columnIndex = findColumnIndex(normalizedHeaders, columnMappings[fieldKey]);
        if (columnIndex === -1) {
          missingColumns.push(requiredCol);
        }
      }
    }

    return {
      isValid: missingColumns.length === 0,
      missingColumns
    };
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

  // Validate date format
  const isValidDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  // Check for duplicates based on MOI Number + Issue Date
  const checkDuplicate = (moiNumber: string, issueDate: string): boolean => {
    // For now, we'll handle duplicates in the service layer
    return false;
  };

  // Extract data from Excel worksheet with exact column validation
  const extractDataFromWorksheet = (worksheet: XLSX.WorkSheet, fileName: string): ZawilUploadRecord[] => {
    const records: ZawilUploadRecord[] = [];
    
    try {
      // Convert worksheet to array of arrays
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
      
      if (data.length < 2) {
        toast.error(`${fileName}: No data rows found`);
        return records;
      }

      // Get headers from first row
      const headers = data[0].map((h: any) => h?.toString().trim() || '');
      console.log('Excel headers found:', headers);
      
      // Validate required columns
      const validation = validateColumns(headers);
      if (!validation.isValid) {
        toast.error(`${fileName}: Missing required columns: ${validation.missingColumns.join(', ')}`);
        console.error('Missing columns:', validation.missingColumns);
        return records;
      }

      // Find column indices
      const columnIndices = {
        zawilPermitId: findColumnIndex(headers.map(h => h.toLowerCase()), columnMappings.zawilPermitId),
        permitType: findColumnIndex(headers.map(h => h.toLowerCase()), columnMappings.permitType),
        issuedFor: findColumnIndex(headers.map(h => h.toLowerCase()), columnMappings.issuedFor),
        arabicName: findColumnIndex(headers.map(h => h.toLowerCase()), columnMappings.arabicName),
        englishName: findColumnIndex(headers.map(h => h.toLowerCase()), columnMappings.englishName),
        moiNumber: findColumnIndex(headers.map(h => h.toLowerCase()), columnMappings.moiNumber),
        passportNumber: findColumnIndex(headers.map(h => h.toLowerCase()), columnMappings.passportNumber),
        nationality: findColumnIndex(headers.map(h => h.toLowerCase()), columnMappings.nationality),
        plateNumber: findColumnIndex(headers.map(h => h.toLowerCase()), columnMappings.plateNumber),
        portName: findColumnIndex(headers.map(h => h.toLowerCase()), columnMappings.portName),
        issueDate: findColumnIndex(headers.map(h => h.toLowerCase()), columnMappings.issueDate),
        expiryDate: findColumnIndex(headers.map(h => h.toLowerCase()), columnMappings.expiryDate)
      };

      console.log('Column indices:', columnIndices);

      // Process data rows (skip header row)
      for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        
        // Skip empty rows
        if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
          continue;
        }

        const moiNumber = columnIndices.moiNumber >= 0 ? (row[columnIndices.moiNumber]?.toString().replace(/\D/g, '') || '') : '';
        const issueDate = columnIndices.issueDate >= 0 ? formatDate(row[columnIndices.issueDate]) : '';
        const expiryDate = columnIndices.expiryDate >= 0 ? formatDate(row[columnIndices.expiryDate]) : '';

        const record: ZawilUploadRecord = {
          id: `${fileName}-${rowIndex}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          fileName,
          rowNumber: rowIndex + 1,
          zawilPermitId: columnIndices.zawilPermitId >= 0 ? (row[columnIndices.zawilPermitId]?.toString().trim() || '') : '',
          permitType: columnIndices.permitType >= 0 ? (row[columnIndices.permitType]?.toString().trim() || '') : '',
          issuedFor: columnIndices.issuedFor >= 0 ? (row[columnIndices.issuedFor]?.toString().trim() || '') : '',
          arabicName: columnIndices.arabicName >= 0 ? (row[columnIndices.arabicName]?.toString().trim() || '') : '',
          englishName: columnIndices.englishName >= 0 ? (row[columnIndices.englishName]?.toString().trim() || '') : '',
          moiNumber,
          passportNumber: columnIndices.passportNumber >= 0 ? (row[columnIndices.passportNumber]?.toString().trim() || '') : '',
          nationality: columnIndices.nationality >= 0 ? (row[columnIndices.nationality]?.toString().trim() || '') : '',
          plateNumber: columnIndices.plateNumber >= 0 ? (row[columnIndices.plateNumber]?.toString().trim() || '') : '',
          portName: columnIndices.portName >= 0 ? (row[columnIndices.portName]?.toString().trim() || '') : '',
          issueDate,
          expiryDate,
          status: 'success',
          errors: [],
        };

        // Validate extracted data
        const errors: string[] = [];
        
        if (!record.zawilPermitId) errors.push('Zawil Permit Id missing');
        if (!record.permitType) errors.push('Permit Type missing');
        if (!record.issuedFor) errors.push('Issued for missing');
        if (!record.englishName) errors.push('English Name missing');
        if (!record.moiNumber || record.moiNumber.length !== 10) errors.push('Valid MOI Number missing (10 digits)');
        if (!record.passportNumber) errors.push('Passport Number missing');
        if (!record.nationality) errors.push('Nationality missing');
        if (!record.portName) errors.push('Port Name missing');
        if (!record.issueDate || !isValidDate(record.issueDate)) errors.push('Valid Issue Date missing');
        if (!record.expiryDate || !isValidDate(record.expiryDate)) errors.push('Valid Expiry Date missing');

        // Validate date logic
        if (record.issueDate && record.expiryDate && isValidDate(record.issueDate) && isValidDate(record.expiryDate)) {
          if (new Date(record.issueDate) >= new Date(record.expiryDate)) {
            errors.push('Issue Date must be before Expiry Date');
          }
        }

        record.errors = errors;
        
        if (errors.length === 0) {
          record.status = 'success';
        } else if (errors.length <= 2) {
          record.status = 'warning';
        } else {
          record.status = 'error';
        }

        records.push(record);
      }

      console.log(`Extracted ${records.length} records from ${fileName}`);

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
    const allRecords: ZawilUploadRecord[] = [];

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
      const duplicateCount = allRecords.filter(r => r.isDuplicate).length;

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

  // Save records to database
  const saveToDatabase = async () => {
    const validRecords = extractedRecords.filter(record => 
      record.status !== 'error'
    );

    if (validRecords.length === 0) {
      toast.error('No valid records to save');
      return;
    }

    console.log('Saving to database:', { validRecords: validRecords.length, authUser: authState.user?.username });

    setIsSaving(true);

    try {
      const result = await ZawilService.processZawilUpload(
        validRecords,
        authState.user?.username || 'Unknown User',
        files.map(f => f.name).join(', ')
      );

      console.log('Upload result:', result);

      if (result.success) {
        toast.success(result.message);
        // Clear form after successful upload
        setExtractedRecords([]);
        setFiles([]);
        
        // Trigger dashboard refresh
        localStorage.setItem('zawil_data_updated', Date.now().toString());
        window.dispatchEvent(new CustomEvent('zawil_data_updated', { detail: 'zawil_data_updated' }));
        
        console.log('Triggered zawil_data_updated event');
      } else {
        toast.error(result.message);
        if (result.errors.length > 0) {
          console.error('Upload errors:', result.errors);
        }
      }
      

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
    toast.success('All files cleared');
  };

  // Export sample Excel template with exact columns
  const downloadTemplate = () => {
    const templateData = [
      requiredColumns,
      [
        'ZWL001',
        'Work Permit',
        'Individual',
        'أحمد محمد علي',
        'Ahmed Mohammed Ali',
        '1234567890',
        'A12345678',
        'Saudi Arabia',
        'ABC-1234',
        'King Abdulaziz Port',
        '2024-01-01',
        '2024-12-31'
      ],
      [
        'ZWL002',
        'Business License',
        'Company',
        'فاطمة أحمد سالم',
        'Fatima Ahmed Salem',
        '0987654321',
        'B87654321',
        'Egypt',
        'XYZ-5678',
        'Jeddah Islamic Port',
        '2024-02-01',
        '2025-01-31'
      ]
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

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Zawil Excel Uploader</h1>
          <p className="text-gray-600">Upload Zawil permit data with exact column validation and duplicate prevention</p>
        </div>

        {/* Required Columns Info */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Required Excel Columns</h2>
          <p className="text-blue-800 mb-3">Your Excel file must contain exactly these columns in any order:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {requiredColumns.map((col, index) => (
              <div key={index} className="bg-white px-3 py-2 rounded border border-blue-200">
                <span className="text-sm font-medium text-blue-900">{col}</span>
              </div>
            ))}
          </div>
          <p className="text-blue-700 text-sm mt-3">
            <strong>Note:</strong> Duplicates are checked using MOI Number + Issue Date combination.
          </p>
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
                disabled={isSaving || extractedRecords.filter(r => r.status !== 'error').length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save to Database ({extractedRecords.filter(r => r.status !== 'error').length})
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Row</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Zawil Permit Id</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Permit Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">English Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">MOI Number</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Passport Number</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nationality</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Issue Date</th>
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
                      <td className="py-3 px-4 font-mono">{record.zawilPermitId || '-'}</td>
                      <td className="py-3 px-4">{record.permitType || '-'}</td>
                      <td className="py-3 px-4">{record.englishName || '-'}</td>
                      <td className="py-3 px-4 font-mono">{record.moiNumber || '-'}</td>
                      <td className="py-3 px-4 font-mono">{record.passportNumber || '-'}</td>
                      <td className="py-3 px-4">{record.nationality || '-'}</td>
                      <td className="py-3 px-4">{record.issueDate || '-'}</td>
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
            </div>
          </div>
        )}

        {/* Error Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Record Details</h3>
                <button
                  onClick={() => setShowPreview(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-96">
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
                          <h4 className="font-medium text-gray-900 mb-2">Validation Errors:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {record.errors.map((error, index) => (
                              <li key={index} className="text-sm text-red-600">{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Extracted Data:</h4>
                        <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                          <div className="grid grid-cols-2 gap-4">
                            <p><strong>Zawil Permit Id:</strong> {record.zawilPermitId || 'Not found'}</p>
                            <p><strong>Permit Type:</strong> {record.permitType || 'Not found'}</p>
                            <p><strong>Issued for:</strong> {record.issuedFor || 'Not found'}</p>
                            <p><strong>Arabic Name:</strong> {record.arabicName || 'Not found'}</p>
                            <p><strong>English Name:</strong> {record.englishName || 'Not found'}</p>
                            <p><strong>MOI Number:</strong> {record.moiNumber || 'Not found'}</p>
                            <p><strong>Passport Number:</strong> {record.passportNumber || 'Not found'}</p>
                            <p><strong>Nationality:</strong> {record.nationality || 'Not found'}</p>
                            <p><strong>Plate Number:</strong> {record.plateNumber || 'Not found'}</p>
                            <p><strong>Port Name:</strong> {record.portName || 'Not found'}</p>
                            <p><strong>Issue Date:</strong> {record.issueDate || 'Not found'}</p>
                            <p><strong>Expiry Date:</strong> {record.expiryDate || 'Not found'}</p>
                          </div>
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