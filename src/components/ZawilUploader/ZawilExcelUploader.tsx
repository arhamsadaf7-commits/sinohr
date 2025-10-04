import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus('idle');
      setUploadMessage('');
      setResults(null);
      setShowResults(false);
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
                status: 'success',
                fileName: file.name,
                rowNumber: i,
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

          resolve(records);
        } catch (error) {
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
    setProgress(null);
    setResults(null);

    try {
      // Process Excel file
      const records = await processExcelFile(file);
      
      if (records.length === 0) {
        throw new Error('No valid records found in the Excel file');
      }

      setUploadMessage(`Processing ${records.length} records...`);

      // Upload with progress tracking
      const result = await ZawilService.processZawilUploadWithProgress(
        records, 
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const closeResults = () => {
    setShowResults(false);
    setResults(null);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <FileSpreadsheet className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Zawil Excel Uploader</h2>
              <p className="text-gray-600">Upload Zawil permits from Excel file with duplicate handling</p>
            </div>
          </div>

          {/* Error Banner */}
          {uploadStatus === 'error' && uploadMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{uploadMessage}</span>
            </div>
          )}

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
          {file && !showResults && (
            <div className="mt-6">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
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
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-blue-900">
                  Processing Row {progress.currentRow} of {progress.totalRows}
                </span>
                <span className="text-sm font-medium text-blue-900">
                  {progress.percentage}%
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-blue-700">{progress.status}</p>
            </div>
          )}

          {/* Status Messages */}
          {uploadMessage && !progress && uploadStatus !== 'error' && (
            <div className={`mt-4 p-4 rounded-lg flex items-center ${
              uploadStatus === 'success' 
                ? 'bg-green-50 text-green-800' 
                : 'bg-blue-50 text-blue-800'
            }`}>
              {uploadStatus === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
              <span>{uploadMessage}</span>
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
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{results.inserted}</div>
                      <div className="text-sm text-green-700">Records Inserted</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{results.updated}</div>
                      <div className="text-sm text-blue-700">Records Updated</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
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
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Excel File Format & Duplicate Handling:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Required Columns:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Zawil Permit ID</li>
                  <li>• English Name</li>
                  <li>• MOI Number</li>
                  <li>• Permit Type</li>
                  <li>• Issued For</li>
                  <li>• Port Name</li>
                  <li>• Issue Date</li>
                  <li>• Expiry Date</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Duplicate Handling:</h4>
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
    </div>
  );
};