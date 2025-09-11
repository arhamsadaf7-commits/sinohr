import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import toast from 'react-hot-toast';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Save, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Download,
  Eye,
  X
} from 'lucide-react';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ZawilRecord {
  id: string;
  fileName: string;
  employeeName: string;
  iqamaNumber: string;
  mobileNumber: string;
  companyName: string;
  permitNumber: string;
  permitType: string;
  permitStartDate: string;
  permitExpiryDate: string;
  permitIssueDate: string;
  extractedText?: string;
  status: 'success' | 'error' | 'warning';
  errors: string[];
}

export const ZawilUploader: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [extractedRecords, setExtractedRecords] = useState<ZawilRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showPreview, setShowPreview] = useState<string | null>(null);

  // Extract English text patterns from PDF content
  const extractZawilData = (text: string, fileName: string): ZawilRecord => {
    const record: ZawilRecord = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      fileName,
      employeeName: '',
      iqamaNumber: '',
      mobileNumber: '',
      companyName: '',
      permitNumber: '',
      permitType: '',
      permitStartDate: '',
      permitExpiryDate: '',
      permitIssueDate: '',
      extractedText: text,
      status: 'success',
      errors: []
    };

    try {
      // Extract Employee Name (English) - Look for patterns like "Name:" or "Employee Name:"
      const namePatterns = [
        /(?:Employee\s+Name|Name|Full\s+Name)[\s:]+([A-Z][a-zA-Z\s]+?)(?:\n|$)/i,
        /Name\s*:\s*([A-Z][a-zA-Z\s]+?)(?:\n|Iqama|Mobile)/i,
        /([A-Z][A-Z\s]+[A-Z])\s*(?:Iqama|ID|Mobile)/
      ];
      
      for (const pattern of namePatterns) {
        const nameMatch = text.match(pattern);
        if (nameMatch && nameMatch[1]) {
          record.employeeName = nameMatch[1].trim();
          break;
        }
      }

      // Extract Iqama Number - Look for 10-digit numbers
      const iqamaPatterns = [
        /(?:Iqama|ID|National\s+ID)[\s:]*(\d{10})/i,
        /(\d{10})/g
      ];
      
      for (const pattern of iqamaPatterns) {
        const iqamaMatch = text.match(pattern);
        if (iqamaMatch && iqamaMatch[1] && iqamaMatch[1].length === 10) {
          record.iqamaNumber = iqamaMatch[1];
          break;
        }
      }

      // Extract Mobile Number - Look for Saudi mobile patterns
      const mobilePatterns = [
        /(?:Mobile|Phone|Tel)[\s:]*(\+966\d{9}|\d{10}|05\d{8})/i,
        /(\+966\d{9}|05\d{8}|\d{10})/g
      ];
      
      for (const pattern of mobilePatterns) {
        const mobileMatch = text.match(pattern);
        if (mobileMatch && mobileMatch[1]) {
          let mobile = mobileMatch[1];
          // Normalize mobile number
          if (mobile.startsWith('+966')) {
            mobile = '0' + mobile.substring(4);
          } else if (mobile.length === 10 && mobile.startsWith('5')) {
            mobile = '0' + mobile;
          }
          record.mobileNumber = mobile;
          break;
        }
      }

      // Extract Company Name (English)
      const companyPatterns = [
        /(?:Company|Employer|Organization)[\s:]+([A-Z][a-zA-Z\s&.,]+?)(?:\n|Permit|License)/i,
        /Company\s*:\s*([A-Z][a-zA-Z\s&.,]+?)(?:\n|$)/i,
        /([A-Z][A-Z\s&.,]+(?:COMPANY|CORP|LTD|LLC|EST))/i
      ];
      
      for (const pattern of companyPatterns) {
        const companyMatch = text.match(pattern);
        if (companyMatch && companyMatch[1]) {
          record.companyName = companyMatch[1].trim();
          break;
        }
      }

      // Extract Permit Number
      const permitNumPatterns = [
        /(?:Permit|License)\s+(?:Number|No)[\s:]*([A-Z0-9\-\/]+)/i,
        /(?:Number|No)[\s:]*([A-Z0-9\-\/]{6,})/i
      ];
      
      for (const pattern of permitNumPatterns) {
        const permitMatch = text.match(pattern);
        if (permitMatch && permitMatch[1]) {
          record.permitNumber = permitMatch[1].trim();
          break;
        }
      }

      // Extract Permit Type
      const permitTypePatterns = [
        /(?:Permit|License)\s+Type[\s:]*([A-Z][a-zA-Z\s]+?)(?:\n|Date|Valid)/i,
        /Type[\s:]*([A-Z][a-zA-Z\s]+?)(?:\n|$)/i,
        /(Work\s+Permit|Residence\s+Permit|Business\s+License|Professional\s+License)/i
      ];
      
      for (const pattern of permitTypePatterns) {
        const typeMatch = text.match(pattern);
        if (typeMatch && typeMatch[1]) {
          record.permitType = typeMatch[1].trim();
          break;
        }
      }

      // Extract Dates - Look for various date formats
      const datePatterns = [
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/g,
        /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/g,
        /(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/g
      ];

      const foundDates: string[] = [];
      for (const pattern of datePatterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
          if (match[1]) {
            foundDates.push(match[1]);
          }
        }
      }

      // Assign dates based on context or order
      if (foundDates.length >= 1) {
        record.permitIssueDate = foundDates[0];
      }
      if (foundDates.length >= 2) {
        record.permitStartDate = foundDates[1];
      }
      if (foundDates.length >= 3) {
        record.permitExpiryDate = foundDates[2];
      } else if (foundDates.length === 2) {
        record.permitExpiryDate = foundDates[1];
      }

      // Validate extracted data and set status
      const errors: string[] = [];
      
      if (!record.employeeName) errors.push('Employee name not found');
      if (!record.iqamaNumber) errors.push('Iqama number not found');
      if (!record.mobileNumber) errors.push('Mobile number not found');
      if (!record.companyName) errors.push('Company name not found');
      if (!record.permitNumber) errors.push('Permit number not found');
      if (!record.permitType) errors.push('Permit type not found');
      if (!record.permitExpiryDate) errors.push('Permit expiry date not found');

      record.errors = errors;
      
      if (errors.length === 0) {
        record.status = 'success';
      } else if (errors.length <= 2) {
        record.status = 'warning';
      } else {
        record.status = 'error';
      }

    } catch (error) {
      record.status = 'error';
      record.errors = ['Failed to parse PDF content'];
      console.error('Error extracting data:', error);
    }

    return record;
  };

  // Process multiple PDF files
  const processZawilPDFs = async (files: File[]) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    const records: ZawilRecord[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingProgress(((i + 1) / files.length) * 100);

        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          
          let fullText = '';
          
          // Extract text from all pages
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            fullText += pageText + '\n';
          }

          // Extract structured data from the text
          const record = extractZawilData(fullText, file.name);
          records.push(record);

        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          records.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            fileName: file.name,
            employeeName: '',
            iqamaNumber: '',
            mobileNumber: '',
            companyName: '',
            permitNumber: '',
            permitType: '',
            permitStartDate: '',
            permitExpiryDate: '',
            permitIssueDate: '',
            status: 'error',
            errors: ['Failed to process PDF file']
          });
        }
      }

      setExtractedRecords(records);
      
      const successCount = records.filter(r => r.status === 'success').length;
      const warningCount = records.filter(r => r.status === 'warning').length;
      const errorCount = records.filter(r => r.status === 'error').length;

      if (successCount > 0) {
        toast.success(`Successfully processed ${successCount} files${warningCount > 0 ? ` (${warningCount} with warnings)` : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
      } else {
        toast.error(`Failed to process ${errorCount} files`);
      }

    } catch (error) {
      console.error('Error processing PDFs:', error);
      toast.error('Failed to process PDF files');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFiles = acceptedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== acceptedFiles.length) {
      toast.error('Only PDF files are allowed');
    }
    
    if (pdfFiles.length > 0) {
      setFiles(prev => [...prev, ...pdfFiles]);
      processZawilPDFs(pdfFiles);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
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
      record.status === 'success' || record.status === 'warning'
    );

    if (validRecords.length === 0) {
      toast.error('No valid records to save');
      return;
    }

    setIsSaving(true);

    try {
      // Simulate API call - replace with actual endpoint
      const response = await fetch('/api/employees_permits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: validRecords.map(record => ({
            employeeName: record.employeeName,
            iqamaNumber: record.iqamaNumber,
            mobileNumber: record.mobileNumber,
            companyName: record.companyName,
            permitNumber: record.permitNumber,
            permitType: record.permitType,
            permitStartDate: record.permitStartDate,
            permitExpiryDate: record.permitExpiryDate,
            permitIssueDate: record.permitIssueDate
          }))
        })
      });

      if (response.ok) {
        toast.success(`Successfully saved ${validRecords.length} records to database`);
        setExtractedRecords([]);
        setFiles([]);
      } else {
        throw new Error('Failed to save records');
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Zawil PDF Uploader</h1>
          <p className="text-gray-600">Upload and extract employee permit data from Zawil PDF documents</p>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
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
              {isDragActive ? 'Drop PDF files here' : 'Upload Zawil PDF Files'}
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop PDF files here, or click to browse and select files
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
                    <FileText className="w-5 h-5 text-red-600" />
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
              <h3 className="font-medium text-gray-900">Processing PDF Files...</h3>
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
                    <th className="text-left py-3 px-4 font-medium text-gray-700">File Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Employee Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Iqama Number</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Mobile Number</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Company Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Permit Number</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Permit Type</th>
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
                          <span className="text-xs capitalize">{record.status}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-32 truncate" title={record.fileName}>
                          {record.fileName}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-32 truncate" title={record.employeeName}>
                          {record.employeeName || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">{record.iqamaNumber || '-'}</td>
                      <td className="py-3 px-4 font-mono">{record.mobileNumber || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="max-w-32 truncate" title={record.companyName}>
                          {record.companyName || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">{record.permitNumber || '-'}</td>
                      <td className="py-3 px-4">{record.permitType || '-'}</td>
                      <td className="py-3 px-4">{record.permitExpiryDate || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowPreview(record.id)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Preview extracted text"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Extracted Text Preview</h3>
                <button
                  onClick={() => setShowPreview(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-96">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-lg">
                  {extractedRecords.find(r => r.id === showPreview)?.extractedText || 'No text extracted'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};