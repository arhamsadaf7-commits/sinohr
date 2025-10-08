import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ZawilService } from '../../services/zawilService';
import { ZawilUploadRecord } from '../../types/zawil';

interface ZawilExcelUploaderProps {
  onUploadComplete?: () => void;
}

export const ZawilExcelUploader: React.FC<ZawilExcelUploaderProps> = ({ onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadedCount, setUploadedCount] = useState(0);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus('idle');
      setUploadMessage('');
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
    }
  };

  const processExcelFile = async (file: File): Promise<ZawilUploadRecord[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          console.log('🔍 Processing Excel file:', file.name);
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          if (jsonData.length < 2) {
            throw new Error('Excel file must contain at least a header row and one data row');
          }

          const headers = jsonData[0].map((h: any) => String(h).toLowerCase().trim());
          console.log('📋 Headers found:', headers);

          // Column mapping
          const columnMap = {
            zawilPermitId: headers.findIndex(h => h.includes('zawil') && h.includes('permit') && h.includes('id')),
            permitType: headers.findIndex(h => h.includes('permit') && h.includes('type')),
            issuedFor: headers.findIndex(h => h.includes('issued') && h.includes('for')),
            arabicName: headers.findIndex(h => h.includes('arabic') && h.includes('name')),
            englishName: headers.findIndex(h => h.includes('english') && h.includes('name')),
            moiNumber: headers.findIndex(h => h.includes('moi') && h.includes('number')),
            passportNumber: headers.findIndex(h => h.includes('passport') && h.includes('number')),
            nationality: headers.findIndex(h => h.includes('nationality')),
            plateNumber: headers.findIndex(h => h.includes('plate') && h.includes('number')),
            portName: headers.findIndex(h => h.includes('port') && h.includes('name')),
            issueDate: headers.findIndex(h => h.includes('issue') && h.includes('date')),
            expiryDate: headers.findIndex(h => h.includes('expiry') && h.includes('date')),
            status: headers.findIndex(h => h.includes('status'))
          };

          console.log('🗺️ Column mapping:', columnMap);

          const records: ZawilUploadRecord[] = [];
          
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;

            try {
              const record: ZawilUploadRecord = {
                id: `zawil_${Date.now()}_${i}`,
                zawilPermitId: columnMap.zawilPermitId >= 0 ? String(row[columnMap.zawilPermitId] || '') : '',
                permitType: columnMap.permitType >= 0 ? String(row[columnMap.permitType] || '') : '',
                issuedFor: columnMap.issuedFor >= 0 ? String(row[columnMap.issuedFor] || '') : '',
                arabicName: columnMap.arabicName >= 0 ? String(row[columnMap.arabicName] || '') : '',
                englishName: columnMap.englishName >= 0 ? String(row[columnMap.englishName] || '') : '',
                moiNumber: columnMap.moiNumber >= 0 ? String(row[columnMap.moiNumber] || '') : '',
                passportNumber: columnMap.passportNumber >= 0 ? String(row[columnMap.passportNumber] || '') : '',
                nationality: columnMap.nationality >= 0 ? String(row[columnMap.nationality] || '') : '',
                plateNumber: columnMap.plateNumber >= 0 ? String(row[columnMap.plateNumber] || '') : '',
                portName: columnMap.portName >= 0 ? String(row[columnMap.portName] || '') : '',
                issueDate: columnMap.issueDate >= 0 ? String(row[columnMap.issueDate] || '') : '',
                expiryDate: columnMap.expiryDate >= 0 ? String(row[columnMap.expiryDate] || '') : '',
                status: columnMap.status >= 0 ? String(row[columnMap.status] || 'Active') : 'Active',
                fileName: file.name,
                rowNumber: i,
                uploadedAt: new Date().toISOString(),
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

              if (errors.length > 0) {
                record.status = 'error';
                record.errors = errors;
              }

              // Include all records (valid and invalid)
              if (record.zawilPermitId || record.englishName) {
                records.push(record);
              }
            } catch (error) {
              console.warn(`⚠️ Skipping row ${i} due to error:`, error);
            }
          }

          console.log('✅ Extracted records:', records.length);
          resolve(records);
        } catch (error) {
          console.error('❌ Excel processing error:', error);
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadStatus('idle');
    setUploadMessage('Processing file...');
    setProgressCurrent(0);
    setProgressTotal(0);
    setProgressPercentage(0);
    setUploadedCount(0);
    setUpdatedCount(0);

    try {
      // Process Excel file
      const records = await processExcelFile(file);

      if (records.length === 0) {
        throw new Error('No valid records found in the Excel file');
      }

      setUploadMessage(`Processing ${records.length} records...`);
      setProgressTotal(records.length);

      // Upload to service with progress callback
      const result = await ZawilService.processZawilUpload(
        records,
        'Excel Upload',
        file.name,
        (current, total, percentage) => {
          setProgressCurrent(current);
          setProgressTotal(total);
          setProgressPercentage(percentage);
        }
      );

      if (!result.success) {
        throw new Error(result.message);
      }

      setUploadedCount(result.insertedCount);
      setUpdatedCount(result.updatedCount);
      setUploadStatus('success');
      setUploadMessage(`Upload completed successfully`);

      // Trigger refresh events
      localStorage.setItem('zawil_data_updated', Date.now().toString());
      window.dispatchEvent(new CustomEvent('zawil_data_updated', { detail: 'zawil_data_updated' }));

      // Callback
      onUploadComplete?.();

    } catch (error) {
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setUploadStatus('idle');
    setUploadMessage('');
    setUploadedCount(0);
    setUpdatedCount(0);
    setProgressCurrent(0);
    setProgressTotal(0);
    setProgressPercentage(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <FileSpreadsheet className="w-8 h-8 text-blue-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Zawil Excel Uploader</h2>
            <p className="text-gray-600">Upload Zawil permits from Excel file</p>
          </div>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400'
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
                className="p-1 hover:bg-red-100 rounded-full"
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
              <p className="text-gray-500 mb-4">or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={uploading}
              >
                Choose File
              </button>
            </div>
          )}
        </div>

        {/* Upload Button */}
        {file && uploadStatus === 'idle' && (
          <div className="mt-6">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                uploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {uploading ? 'Processing...' : 'Upload Zawil Data'}
            </button>
          </div>
        )}

        {/* Progress Bar */}
        {uploading && progressTotal > 0 && (
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Processing records...</span>
              <span>{progressCurrent} / {progressTotal} ({progressPercentage}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Banner */}
        {uploadStatus === 'error' && uploadMessage && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800 mb-1">Upload Failed</h3>
                <p className="text-sm text-red-700">{uploadMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Results Page */}
        {uploadStatus === 'success' && (
          <div className="mt-6 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-green-900">Upload Successful</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Records Inserted</p>
                  <p className="text-3xl font-bold text-green-600">{uploadedCount}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Records Updated</p>
                  <p className="text-3xl font-bold text-blue-600">{updatedCount}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Total Processed</p>
                  <p className="text-3xl font-bold text-gray-700">{uploadedCount + updatedCount}</p>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={clearFile}
                  className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Upload Another File
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {uploadStatus !== 'success' && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Excel File Format:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Zawil Permit ID (required)</li>
              <li>• Permit Type (required)</li>
              <li>• Issued For (required)</li>
              <li>• Arabic Name</li>
              <li>• English Name (required)</li>
              <li>• MOI Number (required)</li>
              <li>• Passport Number</li>
              <li>• Nationality</li>
              <li>• Plate Number</li>
              <li>• Port Name (required)</li>
              <li>• Issue Date (required)</li>
              <li>• Expiry Date (required)</li>
              <li>• Status</li>
            </ul>
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Smart Duplicate Handling:</strong> If the same MOI Number exists with a different Permit Number, the record will be updated with the new Permit Number.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};