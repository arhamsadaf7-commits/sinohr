import React, { useState } from 'react';
import { useEmployee } from '../../context/EmployeeContext';
import { Download, Filter, Calendar, FileText, Users, Building } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { state } = useEmployee();
  const [selectedReport, setSelectedReport] = useState('employee-summary');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filters, setFilters] = useState({
    company: '',
    department: '',
    employeeType: '',
    documentStatus: ''
  });

  const reports = [
    { id: 'employee-summary', name: 'Employee Summary Report', icon: Users },
    { id: 'company-breakdown', name: 'Company Breakdown', icon: Building },
    { id: 'document-expiry', name: 'Document Expiry Report', icon: FileText },
    { id: 'joining-trends', name: 'Joining Trends', icon: Calendar },
  ];

  const generateReport = () => {
    let reportData: any[] = [];
    
    switch (selectedReport) {
      case 'employee-summary':
        reportData = state.employees.map(emp => {
          const company = state.companies.find(c => c.id === emp.companyId);
          const jobInfo = state.jobInfos.find(j => j.employeeId === emp.id);
          const docs = state.documents.find(d => d.employeeId === emp.id);
          
          return {
            'Employee ID': emp.id,
            'Full Name': emp.fullName,
            'Company': company?.name || 'N/A',
            'Department': company?.department || 'N/A',
            'Job Title': jobInfo?.jobTitle || 'N/A',
            'Employee Type': jobInfo?.employeeType || 'N/A',
            'Email': emp.email,
            'Phone': emp.contactNumber,
            'Joining Date': jobInfo?.joiningDate || 'N/A',
            'Passport Expiry': docs?.passportExpiryDate || 'N/A',
            'Iqama Expiry': docs?.iqamaExpiryDate || 'N/A'
          };
        });
        break;
        
      case 'document-expiry':
        reportData = state.documents.map(doc => {
          const employee = state.employees.find(e => e.id === doc.employeeId);
          const passportDaysLeft = doc.passportExpiryDate 
            ? Math.ceil((new Date(doc.passportExpiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : null;
          const iqamaDaysLeft = doc.iqamaExpiryDate 
            ? Math.ceil((new Date(doc.iqamaExpiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : null;
            
          return {
            'Employee ID': doc.employeeId,
            'Employee Name': employee?.fullName || 'Unknown',
            'Passport Number': doc.passportNumber,
            'Passport Expiry': doc.passportExpiryDate,
            'Passport Days Left': passportDaysLeft,
            'Iqama Number': doc.iqamaNumber,
            'Iqama Expiry': doc.iqamaExpiryDate,
            'Iqama Days Left': iqamaDaysLeft,
            'Status': (passportDaysLeft && passportDaysLeft < 30) || (iqamaDaysLeft && iqamaDaysLeft < 30) 
              ? 'Expiring Soon' : 'Valid'
          };
        });
        break;
    }

    return reportData;
  };

  const exportReport = () => {
    const reportData = generateReport();
    if (reportData.length === 0) return;

    const headers = Object.keys(reportData[0]);
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => 
        headers.map(header => `"${String(row[header]).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reportData = generateReport();

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
            <p className="text-gray-600">Generate comprehensive reports and export data</p>
          </div>
          <button
            onClick={exportReport}
            disabled={reportData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Report Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Types</h2>
            <div className="space-y-2">
              {reports.map(report => {
                const Icon = report.icon;
                return (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors ${
                      selectedReport === report.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{report.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Filters */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                  <select
                    value={filters.company}
                    onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Companies</option>
                    {state.companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Report Preview */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {reports.find(r => r.id === selectedReport)?.name}
            </h2>
            
            {reportData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {Object.keys(reportData[0]).map(header => (
                        <th key={header} className="text-left py-3 px-4 font-medium text-gray-700">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.slice(0, 10).map((row, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex} className="py-3 px-4 text-gray-600">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.length > 10 && (
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Showing 10 of {reportData.length} records. Export to see all data.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No data available for this report</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};