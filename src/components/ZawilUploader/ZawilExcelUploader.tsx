import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, Loader2, Download, Eye, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ZawilService, UploadProgress, UploadResults } from '../../services/zawilService';
import { ZawilUploadRecord } from '../../types/zawil';
import toast from 'react-hot-toast';

interface ZawilExcelUploaderProps {
  onUploadComplete?: () => void;
}

export const ZawilExcelUploader: React.FC<ZawilExcelUploaderProps> = ({ onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [results, setResults] = useState<UploadResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [previewData, setPreviewData] = useState<ZawilUploadRecord[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus('idle');
      setUploadMessage('');
      setResults(null);
      setShowResults(false);
      setShowPreview(false);
      setPreviewData([]);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
      setUploadStatus('idle');
      setUploadMessage('');
      setResults(null);
      setShowResults(false);
      setShowPreview(false);
      setPreviewData([]);
    } else {
      toast.error('Please select a valid Excel file (.xlsx or .xls)');
    }
  };

  const processExcelFile = async (file: File): Promise<ZawilUploadRecord[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          if (jsonData.length < 2) {
            throw new Error('Excel file must contain at least a header row and one data row');
          }

          const headers = jsonData[0].map((h: any) => String(h).toLowerCase().trim());

          // Enhanced column mapping with multiple possible header names
          const findColumnIndex = (possibleNames: string[]) => {
            return headers.findIndex(h => 
              possibleNames.some(name => h.includes(name.toLowerCase()))
            );
          };

          const columnMap = {
            zawilPermitId: findColumnIndex(['zawil permit id', 'permit id', 'zawil id']),
            permitType: findColumnIndex(['permit type', 'type']),
            issuedFor: findColumnIndex(['issued for', 'issued to']),
            arabicName: findColumnIndex(['arabic name', 'name arabic']),
            englishName: findColumnIndex(['english name', 'name english', 'name']),
            moiNumber: findColumnIndex(['moi number', 'moi', 'id number']),
            passportNumber: findColumnIndex(['passport number', 'passport']),
            nationality: findColumnIndex(['nationality', 'country']),
            plateNumber: findColumnIndex(['plate number', 'plate']),
            portName: findColumnIndex(['port name', 'port']),
            issueDate: findColumnIndex(['issue date', 'issued date']),
            expiryDate: findColumnIndex(['expiry date', 'expire date', 'expiration date']),
          };

          const records: ZawilUploadRecord[] = [];
          
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;

            try {
              const record: ZawilUploadRecord = {
                id: `zawil_${Date.now()}_${i}`,
                zawilPermitId: columnMap.zawilPermitId >= 0 ? String(row[columnMap.zawilPermitId] || '').trim() : '',
                permitType: columnMap.permitType >= 0 ? String(row[columnMap.permitType] || '').trim() : '',
                issuedFor: columnMap.issuedFor >= 0 ? String(row[columnMap.issuedFor] || '').trim() : '',
                arabicName: columnMap.arabicName >= 0 ? String(row[columnMap.arabicName] || '').trim() : '',
                englishName: columnMap.englishName >= 0 ? String(row[columnMap.englishName] || '').trim() : '',
                moiNumber: columnMap.moiNumber >= 0 ? String(row[columnMap.moiNumber] || '').trim() : '',
                passportNumber: columnMap.passportNumber >= 0 ? String(row[columnMap.passportNumber] || '').trim() : '',
                nationality: columnMap.nationality >= 0 ? String(row[columnMap.nationality] || '').trim() : '',
                plateNumber: columnMap.plateNumber >= 0 ? String(row[columnMap.plateNumber] || '').trim() : '',
                portName: columnMap.portName >= 0 ? String(row[columnMap.portName] || '').trim() : '',
                issueDate: columnMap.issueDate >= 0 ? String(row[columnMap.issueDate] || '').trim() : '',
                expiryDate: columnMap.expiryDate >= 0 ? String(row[columnMap.expiryDate] || '').trim() : '',
                status: 'success',
                fileName: file.name,
                rowNumber: i + 1,
                errors: []
              };

              // Validate required fields
              const errors: string[] = [];
              if (!record.zawilPermitId) errors.push('Zawil Permit ID is required');
              if (!record.englishName) errors.push('English Name is required');
              if (!record.moiNumber) errors.push('MOI Number is required');
              if (!record.issueDate) errors.push('Issue Date is required');
              if (!record.expiryDate) errors.push('Expiry Date is required');
              if (!record.permitType) errors.push('Permit Type is required');
              if (!record.issuedFor) errors.push('Issued For is required');
              if (!record.portName) errors.push('Port Name is required');

              // Validate date formats
              if (record.issueDate && !isValidDate(record.issueDate)) {
                errors.push('Invalid Issue Date format');
              }
              if (record.expiryDate && !isValidDate(record.expiryDate)) {
                errors.push('Invalid Expiry Date format');
              }

              // Validate MOI number format (should be 10 digits)
              if (record.moiNumber && !/^\d{10}$/.test(record.moiNumber)) {
                errors.push('MOI Number should be 10 digits');
              }

              if (errors.length > 0) {
                record.status = 'error';
                record.errors = errors;
              } else if (errors.length <= 2) {
                record.status = 'warning';
                record.errors = errors;
              }

              // Include all records (valid and invalid) for preview
              if (record.zawilPermitId || record.englishName || record.moiNumber) {
                records.push(record);
              }
            } catch (error) {
              console.warn(`⚠️ Skipping row ${i + 1} due to error:`, error);
            }
          }

          resolve(records);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  const handlePreview = async () => {
    if (!file) return;

    try {
      setUploadMessage('Processing file for preview...');
      const records = await processExcelFile(file);
      setPreviewData(records);
      setShowPreview(true);
      setUploadMessage('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to preview file');
      setUploadMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadStatus('idle');
    setUploadMessage('Processing file...');
    setProgress(null);
    setResults(null);

    try {
      // Process Excel file
      const records = previewData.length > 0 ? previewData : await processExcelFile(file);
      
      if (records.length === 0) {
        throw new Error('No valid records found in the Excel file');
      }

      // Filter out error records for upload
      const validRecords = records.filter(r => r.status !== 'error');
      
      if (validRecords.length === 0) {
        throw new Error('No valid records to upload. Please fix the errors and try again.');
      }

      setUploadMessage(`Processing ${validRecords.length} valid records...`);

      // Upload with progress tracking
      const result = await ZawilService.processZawilUploadWithProgress(
        validRecords, 
        'Excel Upload', 
        file.name,
        (progressData) => {
          setProgress(progressData);
          setUploadMessage(progressData.status);
        }
      );
      
      setResults(result);
      setUploadStatus('success');
      setUploadMessage('Upload completed successfully!');
      setShowResults(true);

      // Show success toast
      toast.success(`Successfully processed ${result.inserted + result.updated} records`);

      // Trigger refresh events
      localStorage.setItem('zawil_data_updated', Date.now().toString());
      window.dispatchEvent(new CustomEvent('zawil_data_updated', { detail: 'zawil_data_updated' }));

      // Reset form
      setFile(null);
      setPreviewData([]);
      setShowPreview(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Callback
      onUploadComplete?.();

    } catch (error) {
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : 'Upload failed');
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setUploadStatus('idle');
    setUploadMessage('');
    setResults(null);
    setShowResults(false);
    setPreviewData([]);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const closeResults = () => {
    setShowResults(false);
    setResults(null);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewData([]);
  };

  const removePreviewRecord = (id: string) => {
    setPreviewData(prev => prev.filter(record => record.id !== id));
  };

  const downloadTemplate = () => {
    const templateData = [
      [
        'Zawil Permit ID',
        'Permit Type',
        'Issued For',
        'Arabic Name',
        'English Name',
        'MOI Number',
        'Passport Number',
        'Nationality',
        'Plate Number',
        'Port Name',
        'Issue Date',
        'Expiry Date'
      ],
      [
        'ZWL123456',
        'Work Permit',
        'Individual',
        'أحمد محمد',
        'Ahmed Mohammed',
        '1234567890',
        'A12345678',
        'Saudi Arabia',
        'ABC-1234',
        'King Abdulaziz Port',
        '2024-01-01',
        '2025-01-01'
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Zawil Template');
    XLSX.writeFile(wb, 'zawil_template.xlsx');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
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
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileSpreadsheet className="w-8 h-8 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold">Zawil Excel Uploader</h2>
                  <p className="text-blue-100">Upload Zawil permits from Excel file with advanced validation</p>
                </div>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Error Banner */}
            {uploadStatus === 'error' && uploadMessage && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
                <span className="text-red-800">{uploadMessage}</span>
              </div>
            )}

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-6 ${
                file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="flex items-center justify-center space-x-4">
                  <FileSpreadsheet className="w-12 h-12 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={clearFile}
                    className="p-2 hover:bg-red-100 rounded-full transition-colors"
                    disabled={uploading}
                  >
                    <X className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop your Excel file here
                  </p>
                  <p className="text-gray-500 mb-4">or click to browse (.xlsx, .xls files only)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    disabled={uploading}
                  >
                    Choose File
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {file && !showResults && (
              <div className="flex gap-4 mb-6">
                <button
                  onClick={handlePreview}
                  disabled={uploading}
                  className="flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Eye className="w-5 h-5" />
                  Preview Data
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    uploading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {uploading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {uploading ? 'Uploading...' : 'Upload Zawil Data'}
                </button>
              </div>
            )}

            {/* Progress Bar */}
            {progress && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-blue-900">
                    Processing Row {progress.currentRow} of {progress.totalRows}
                  </span>
                  <span className="text-sm font-medium text-blue-900">
                    {progress.percentage}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3 mb-2">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-blue-700">{progress.status}</p>
              </div>
            )}

            {/* Status Messages */}
            {uploadMessage && !progress && uploadStatus !== 'error' && (
              <div className={`mb-6 p-4 rounded-lg flex items-center ${
                uploadStatus === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                {uploadStatus === 'success' && <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
                <span>{uploadMessage}</span>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Excel File Format & Requirements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Required Columns:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>Zawil Permit ID</strong> - Unique permit identifier</li>
                    <li>• <strong>English Name</strong> - Employee full name</li>
                    <li>• <strong>MOI Number</strong> - 10-digit ID number</li>
                    <li>• <strong>Permit Type</strong> - Type of permit</li>
                    <li>• <strong>Issued For</strong> - Purpose of permit</li>
                    <li>• <strong>Port Name</strong> - Issuing port</li>
                    <li>• <strong>Issue Date</strong> - Date format: YYYY-MM-DD</li>
                    <li>• <strong>Expiry Date</strong> - Date format: YYYY-MM-DD</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Optional Columns:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Arabic Name</li>
                    <li>• Passport Number</li>
                    <li>• Nationality</li>
                    <li>• Plate Number</li>
                  </ul>
                  <h4 className="font-medium text-gray-800 mb-2 mt-4">Duplicate Handling:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Same Permit + MOI → Skip</li>
                    <li>• Same MOI, New Permit → Update</li>
                    <li>• New MOI + Permit → Insert</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Data Preview</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {previewData.length} records found. Review and remove incorrect entries before uploading.
                    </p>
                  </div>
                  <button
                    onClick={closePreview}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-auto max-h-[60vh] p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Row</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Permit ID</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">English Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">MOI Number</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Permit Type</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Issue Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Expiry Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Errors</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((record) => (
                        <tr key={record.id} className={`border-b border-gray-100 ${getStatusColor(record.status)}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(record.status)}
                              <span className="text-xs capitalize font-medium">{record.status}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{record.rowNumber}</td>
                          <td className="py-3 px-4 font-mono text-xs">{record.zawilPermitId || '-'}</td>
                          <td className="py-3 px-4 max-w-32 truncate" title={record.englishName}>
                            {record.englishName || '-'}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs">{record.moiNumber || '-'}</td>
                          <td className="py-3 px-4 text-xs">{record.permitType || '-'}</td>
                          <td className="py-3 px-4 text-xs">{record.issueDate || '-'}</td>
                          <td className="py-3 px-4 text-xs">{record.expiryDate || '-'}</td>
                          <td className="py-3 px-4">
                            {record.errors.length > 0 ? (
                              <div className="max-w-48">
                                <ul className="text-xs text-red-600 space-y-1">
                                  {record.errors.slice(0, 2).map((error, idx) => (
                                    <li key={idx}>• {error}</li>
                                  ))}
                                  {record.errors.length > 2 && (
                                    <li>• +{record.errors.length - 2} more...</li>
                                  )}
                                </ul>
                              </div>
                            ) : (
                              <span className="text-xs text-green-600">✓ Valid</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => removePreviewRecord(record.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Remove record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Valid: {previewData.filter(r => r.status === 'success').length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span>Warning: {previewData.filter(r => r.status === 'warning').length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span>Error: {previewData.filter(r => r.status === 'error').length}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={closePreview}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        closePreview();
                        handleUpload();
                      }}
                      disabled={previewData.filter(r => r.status !== 'error').length === 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Upload {previewData.filter(r => r.status !== 'error').length} Valid Records
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Modal */}
        {showResults && results && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Upload Results</h3>
                  <button
                    onClick={closeResults}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{results.inserted}</div>
                    <div className="text-sm text-green-700">Records Inserted</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{results.updated}</div>
                    <div className="text-sm text-blue-700">Records Updated</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-600">{results.skipped}</div>
                    <div className="text-sm text-yellow-700">Records Skipped</div>
                  </div>
                </div>

                {results.errors.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Errors ({results.errors.length})</h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                      {results.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-700 mb-1">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={closeResults}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};