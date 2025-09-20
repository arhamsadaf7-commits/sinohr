import React, { useState, useEffect, useMemo } from 'react';
import { useEmployee } from '../../context/EmployeeContext';
import { 
  Calendar, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Search, 
  Filter,
  ChevronDown,
  ChevronUp,
  FileText,
  CreditCard,
  Shield,
  Car,
  Eye,
  Edit,
  Check,
  Download,
  X,
  User,
  Phone,
  Mail,
  Building,
  MapPin,
  Archive
} from 'lucide-react';
import { ExpiryItem, ExpiryStats, DashboardData } from '../../types/auth';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

interface ExtendedExpiryItem extends ExpiryItem {
  isDone?: boolean;
  completedAt?: string;
  completedBy?: string;
}

interface DocumentHistory {
  id: string;
  employeeId: string;
  employeeName: string;
  documentType: string;
  documentNumber: string;
  oldExpiryDate: string;
  newExpiryDate: string;
  updatedAt: string;
  updatedBy: string;
  action: 'updated' | 'marked_done' | 'archived';
}

type TabType = 'overview' | 'zawil' | 'iqama' | 'passport' | 'visa' | 'licence' | 'insurance';

export const ExpiryDashboard: React.FC = () => {
  const { state } = useEmployee();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showDetailsModal, setShowDetailsModal] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState<string | null>(null);
  const [documentHistory, setDocumentHistory] = useState<DocumentHistory[]>([]);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });

  // Enhanced expiry calculation with more granular status
  const calculateExpiryStatus = (expiryDate: string): ExpiryItem['status'] => {
    if (!expiryDate) return 'valid';
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring-soon';
    return 'valid';
  };

  const generateDashboardData = useMemo(() => {
    const today = new Date();
    const expiryItems: ExtendedExpiryItem[] = [];

    // Process documents with enhanced logic
    state.documents.forEach(doc => {
      const employee = state.employees.find(emp => emp.id === doc.employeeId);
      if (!employee) return;

      const documentTypes = [
        { type: 'iqama' as const, date: doc.iqamaExpiryDate, number: doc.iqamaNumber },
        { type: 'passport' as const, date: doc.passportExpiryDate, number: doc.passportNumber },
        { type: 'visa' as const, date: doc.visaNumber ? '2024-12-31' : '', number: doc.visaNumber }, // Mock visa expiry
        { type: 'insurance' as const, date: doc.insurancePolicyNumber ? '2024-11-30' : '', number: doc.insurancePolicyNumber },
        { type: 'licence' as const, date: '2024-10-31', number: 'LIC' + doc.iqamaNumber?.slice(-4) }, // Mock license
      ];

      documentTypes.forEach(({ type, date, number }) => {
        if (date && number) {
          const expiryDate = new Date(date);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const status = calculateExpiryStatus(date);
          const itemId = `${doc.employeeId}-${type}`;

          expiryItems.push({
            id: itemId,
            employeeId: doc.employeeId,
            employeeName: employee.fullName,
            documentType: type,
            documentNumber: number,
            expiryDate: date,
            daysUntilExpiry,
            status,
            isDone: completedItems.has(itemId)
          });
        }
      });
    });

    // Add mock Zawil permits with exact column structure
    state.employees.slice(0, 10).forEach((employee, index) => {
      const mockExpiryDate = new Date();
      mockExpiryDate.setDate(mockExpiryDate.getDate() + (index * 10 - 20)); // Some expired, some expiring
      
      const daysUntilExpiry = Math.ceil((mockExpiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const status = calculateExpiryStatus(mockExpiryDate.toISOString().split('T')[0]);
      const itemId = `${employee.id}-zawil`;

      expiryItems.push({
        id: itemId,
        employeeId: employee.id,
        employeeName: employee.fullName,
        documentType: 'zawil' as any,
        documentNumber: `ZWL${String(index + 1).padStart(3, '0')}`,
        zawilPermitId: `ZWL${String(index + 1).padStart(3, '0')}`,
        permitType: index % 3 === 0 ? 'Work Permit' : index % 3 === 1 ? 'Business License' : 'Professional License',
        issuedFor: index % 2 === 0 ? 'Individual' : 'Company',
        arabicName: `الاسم العربي ${index + 1}`,
        moiNumber: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        passportNumber: `P${String(Math.floor(10000000 + Math.random() * 90000000))}`,
        nationality: index % 4 === 0 ? 'Saudi Arabia' : index % 4 === 1 ? 'Egypt' : index % 4 === 2 ? 'Pakistan' : 'India',
        plateNumber: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(1000 + Math.random() * 9000)}`,
        portName: index % 3 === 0 ? 'King Abdulaziz Port' : index % 3 === 1 ? 'Jeddah Islamic Port' : 'Dammam Port',
        issueDate: new Date(Date.now() - (365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        expiryDate: mockExpiryDate.toISOString().split('T')[0],
        daysUntilExpiry,
        status,
        isDone: completedItems.has(itemId)
      });
    });

    // Group by document type
    const groupedData: DashboardData & { zawil: ExpiryStats & { items: ExtendedExpiryItem[] } } = {
      zawil: { expired: 0, expiringSoon: 0, expiringLater: 0, total: 0, items: [] },
      iqama: { expired: 0, expiringSoon: 0, expiringLater: 0, total: 0, items: [] },
      passport: { expired: 0, expiringSoon: 0, expiringLater: 0, total: 0, items: [] },
      insurance: { expired: 0, expiringSoon: 0, expiringLater: 0, total: 0, items: [] },
      licence: { expired: 0, expiringSoon: 0, expiringLater: 0, total: 0, items: [] },
      visa: { expired: 0, expiringSoon: 0, expiringLater: 0, total: 0, items: [] },
    };

    expiryItems.forEach(item => {
      const category = groupedData[item.documentType as keyof typeof groupedData];
      if (category) {
        category.items.push(item);
        category.total++;
        
        if (!item.isDone) {
          switch (item.status) {
            case 'expired':
              category.expired++;
              break;
            case 'expiring-soon':
              category.expiringSoon++;
              break;
            case 'expiring-later':
              category.expiringLater++;
              break;
          }
        }
      }
    });

    return groupedData;
  }, [state.documents, state.employees, completedItems]);

  useEffect(() => {
    setDashboardData(generateDashboardData);
  }, [generateDashboardData]);

  // Filter items based on search, status, and date filters
  const getFilteredItems = (items: ExtendedExpiryItem[]) => {
    return items.filter(item => {
      const matchesSearch = !searchTerm || 
        item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.documentNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'done' && item.isDone) ||
        (filterStatus !== 'done' && !item.isDone && item.status === filterStatus);
      
      const matchesDateFrom = !dateFilter.from || item.expiryDate >= dateFilter.from;
      const matchesDateTo = !dateFilter.to || item.expiryDate <= dateFilter.to;
      
      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  };

  // Mark item as done
  const markAsDone = (itemId: string) => {
    const newCompleted = new Set(completedItems);
    newCompleted.add(itemId);
    setCompletedItems(newCompleted);
    
    // Add to history
    const item = Object.values(dashboardData || {})
      .flatMap(category => category.items)
      .find(item => item.id === itemId);
    
    if (item) {
      const historyEntry: DocumentHistory = {
        id: Date.now().toString(),
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        documentType: item.documentType,
        documentNumber: item.documentNumber,
        oldExpiryDate: item.expiryDate,
        newExpiryDate: item.expiryDate,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Current User',
        action: 'marked_done'
      };
      
      setDocumentHistory(prev => [historyEntry, ...prev]);
      toast.success(`${item.documentType} document marked as done`);
    }
  };

  // Bulk mark as done
  const bulkMarkAsDone = () => {
    const newCompleted = new Set(completedItems);
    selectedItems.forEach(itemId => newCompleted.add(itemId));
    setCompletedItems(newCompleted);
    setSelectedItems(new Set());
    toast.success(`${selectedItems.size} items marked as done`);
  };

  // Export to Excel
  const exportToExcel = (items: ExtendedExpiryItem[], filename: string) => {
    const exportData = items.map(item => ({
      'Employee Name': item.employeeName,
      'Document Type': item.documentType.toUpperCase(),
      'Document Number': item.documentNumber,
      'Expiry Date': item.expiryDate,
      'Days Remaining': item.daysUntilExpiry,
      'Status': item.status.replace('-', ' ').toUpperCase(),
      'Completed': item.isDone ? 'Yes' : 'No'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expiry Data');
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Data exported successfully');
  };

  // Get status styling
  const getStatusStyling = (status: string, isDone?: boolean) => {
    if (isDone) return 'bg-blue-50 border-blue-200 text-blue-800';
    
    switch (status) {
      case 'expired': return 'bg-red-50 border-red-200 text-red-800';
      case 'expiring-soon': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'expiring-later': return 'bg-orange-50 border-orange-200 text-orange-800';
      default: return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  const getStatusIcon = (status: string, isDone?: boolean) => {
    if (isDone) return <CheckCircle className="w-4 h-4 text-blue-600" />;
    
    switch (status) {
      case 'expired': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'expiring-soon': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'expiring-later': return <Calendar className="w-4 h-4 text-orange-600" />;
      default: return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'zawil': return <FileText className="w-6 h-6" />;
      case 'iqama': return <CreditCard className="w-6 h-6" />;
      case 'passport': return <FileText className="w-6 h-6" />;
      case 'insurance': return <Shield className="w-6 h-6" />;
      case 'licence': return <Car className="w-6 h-6" />;
      case 'visa': return <FileText className="w-6 h-6" />;
      default: return <FileText className="w-6 h-6" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Calendar },
    { id: 'zawil', label: 'Zawil', icon: FileText },
    { id: 'iqama', label: 'Iqama', icon: CreditCard },
    { id: 'passport', label: 'Passport', icon: FileText },
    { id: 'visa', label: 'Visa', icon: FileText },
    { id: 'licence', label: 'Licence', icon: Car },
    { id: 'insurance', label: 'Insurance', icon: Shield },
  ];

  if (!dashboardData) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Zawil Permit Summary Card */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-sm p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Zawil Permit</h2>
            <p className="text-purple-100 mb-4">Monitor work permit expiration dates</p>
            <div className="flex gap-6">
              <div>
                <div className="text-3xl font-bold">{dashboardData.zawil?.expiringSoon || 0}</div>
                <div className="text-sm text-purple-200">Expiring Soon</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{dashboardData.zawil?.expired || 0}</div>
                <div className="text-sm text-purple-200">Expired</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{dashboardData.zawil?.total || 0}</div>
                <div className="text-sm text-purple-200">Total</div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <FileText className="w-16 h-16 text-purple-200 mb-4" />
            <button
              onClick={() => setActiveTab('zawil')}
              className="bg-white text-purple-600 px-6 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Object.entries(dashboardData).map(([key, data]) => {
          if (key === 'zawil') return null; // Already shown above
          
          const tabInfo = tabs.find(t => t.id === key);
          if (!tabInfo) return null;
          
          const Icon = tabInfo.icon;
          const colorClasses = {
            iqama: 'from-blue-500 to-blue-600',
            passport: 'from-green-500 to-green-600',
            visa: 'from-orange-500 to-orange-600',
            licence: 'from-red-500 to-red-600',
            insurance: 'from-indigo-500 to-indigo-600'
          };

          return (
            <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className={`bg-gradient-to-r ${colorClasses[key as keyof typeof colorClasses]} p-4 text-white`}>
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-6 h-6" />
                  <button
                    onClick={() => setActiveTab(key as TabType)}
                    className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded transition-colors"
                  >
                    View
                  </button>
                </div>
                <h3 className="font-bold capitalize">{key}</h3>
                <p className="text-sm opacity-90">Total: {data.total}</p>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Expired</span>
                  <span className="font-bold text-red-600">{data.expired}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Expiring Soon</span>
                  <span className="font-bold text-yellow-600">{data.expiringSoon}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {documentHistory.length > 0 ? (
          <div className="space-y-3">
            {documentHistory.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{entry.employeeName}</p>
                  <p className="text-sm text-gray-600">
                    {entry.action.replace('_', ' ')} {entry.documentType} document
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(entry.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        )}
      </div>
    </div>
  );

  const renderTabContent = (tabId: TabType) => {
    if (tabId === 'overview') return renderOverview();
    
    const data = dashboardData[tabId as keyof typeof dashboardData];
    if (!data) return null;

    const filteredItems = getFilteredItems(data.items);
    const selectedCount = selectedItems.size;

    return (
      <div className="space-y-6">
        {/* Tab Header with Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getDocumentIcon(tabId)}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 capitalize">{tabId} Documents</h2>
                <p className="text-gray-600">Manage {tabId} document expiration dates</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{data.expired}</div>
                <div className="text-sm text-gray-600">Expired</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{data.expiringSoon}</div>
                <div className="text-sm text-gray-600">Expiring Soon</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{data.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by employee name or document number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="expired">Expired</option>
              <option value="expiring-soon">Expiring Soon</option>
              <option value="valid">Valid</option>
              <option value="done">Completed</option>
            </select>
            <input
              type="date"
              value={dateFilter.from}
              onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="From Date"
            />
            <input
              type="date"
              value={dateFilter.to}
              onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="To Date"
            />
          </div>

          {/* Bulk Actions */}
          {selectedCount > 0 && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm text-blue-800">{selectedCount} items selected</span>
              <button
                onClick={bulkMarkAsDone}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Mark as Done
              </button>
              <button
                onClick={() => {
                  const selectedItemsData = filteredItems.filter(item => selectedItems.has(item.id));
                  exportToExcel(selectedItemsData, `${tabId}_selected`);
                }}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                Export Selected
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">
              {filteredItems.length} {tabId} documents
            </h3>
            <button
              onClick={() => exportToExcel(filteredItems, tabId)}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export All
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(new Set(filteredItems.map(item => item.id)));
                        } else {
                          setSelectedItems(new Set());
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  {tabId === 'zawil' ? (
                    <>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Zawil Permit Id</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Permit Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Issued for</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Arabic Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">English Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">MOI Number</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Passport Number</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nationality</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Plate Number</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Port Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Issue Date</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Document Number</th>
                    </>
                  )}
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Expiry Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Days Remaining</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 ${getStatusStyling(item.status, item.isDone)}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedItems);
                          if (e.target.checked) {
                            newSelected.add(item.id);
                          } else {
                            newSelected.delete(item.id);
                          }
                          setSelectedItems(newSelected);
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status, item.isDone)}
                        <span className="text-xs font-medium capitalize">
                          {item.isDone ? 'Done' : item.status.replace('-', ' ')}
                        </span>
                      </div>
                    </td>
                    {tabId === 'zawil' ? (
                      <>
                        <td className="px-4 py-3 font-mono text-sm">{(item as any).zawilPermitId || item.documentNumber}</td>
                        <td className="px-4 py-3 text-sm">{(item as any).permitType || 'Work Permit'}</td>
                        <td className="px-4 py-3 text-sm">{(item as any).issuedFor || 'Individual'}</td>
                        <td className="px-4 py-3 text-sm">{(item as any).arabicName || 'الاسم العربي'}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{item.employeeName}</td>
                        <td className="px-4 py-3 font-mono text-sm">{(item as any).moiNumber || '1234567890'}</td>
                        <td className="px-4 py-3 font-mono text-sm">{(item as any).passportNumber || 'P12345678'}</td>
                        <td className="px-4 py-3 text-sm">{(item as any).nationality || 'Saudi Arabia'}</td>
                        <td className="px-4 py-3 font-mono text-sm">{(item as any).plateNumber || 'ABC-1234'}</td>
                        <td className="px-4 py-3 text-sm">{(item as any).portName || 'King Abdulaziz Port'}</td>
                        <td className="px-4 py-3 text-sm">{(item as any).issueDate || '2024-01-01'}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-medium text-gray-900">{item.employeeName}</td>
                        <td className="px-4 py-3 font-mono text-sm">{item.documentNumber}</td>
                      </>
                    )}
                    <td className="px-4 py-3 text-sm">{new Date(item.expiryDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`font-medium ${
                        item.daysUntilExpiry < 0 ? 'text-red-600' :
                        item.daysUntilExpiry <= 30 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {item.daysUntilExpiry < 0 
                          ? `${Math.abs(item.daysUntilExpiry)} days ago`
                          : `${item.daysUntilExpiry} days`
                        }
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {!item.isDone && (
                          <button
                            onClick={() => markAsDone(item.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Mark as Done"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setShowUpdateModal(item.id)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Update"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDetailsModal(item.id)}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No documents found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Expiry Dashboard</h1>
          <p className="text-gray-600">Monitor and manage document expiration dates across all categories</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id !== 'overview' && dashboardData && (
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {dashboardData[tab.id as keyof typeof dashboardData]?.total || 0}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent(activeTab)}

        {/* Details Modal */}
        {showDetailsModal && (() => {
          const item = Object.values(dashboardData)
            .flatMap(category => category.items)
            .find(item => item.id === showDetailsModal);
          
          const employee = state.employees.find(emp => emp.id === item?.employeeId);
          const company = state.companies.find(c => c.id === employee?.companyId);
          const jobInfo = state.jobInfos.find(j => j.employeeId === employee?.id);

          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Document Details</h3>
                  <button
                    onClick={() => setShowDetailsModal(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {item && employee ? (
                  <div className="p-6 space-y-6">
                    {/* Document Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Document Information</h4>
                      {item.documentType === 'zawil' ? (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Zawil Permit Id:</span>
                            <span className="ml-2 font-mono">{(item as any).zawilPermitId || item.documentNumber}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Permit Type:</span>
                            <span className="ml-2 font-medium">{(item as any).permitType || 'Work Permit'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Issued for:</span>
                            <span className="ml-2 font-medium">{(item as any).issuedFor || 'Individual'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Arabic Name:</span>
                            <span className="ml-2 font-medium">{(item as any).arabicName || 'الاسم العربي'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">MOI Number:</span>
                            <span className="ml-2 font-mono">{(item as any).moiNumber || '1234567890'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Passport Number:</span>
                            <span className="ml-2 font-mono">{(item as any).passportNumber || 'P12345678'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Nationality:</span>
                            <span className="ml-2 font-medium">{(item as any).nationality || 'Saudi Arabia'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Plate Number:</span>
                            <span className="ml-2 font-mono">{(item as any).plateNumber || 'ABC-1234'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Port Name:</span>
                            <span className="ml-2 font-medium">{(item as any).portName || 'King Abdulaziz Port'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Issue Date:</span>
                            <span className="ml-2 font-medium">{(item as any).issueDate || '2024-01-01'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Expiry Date:</span>
                            <span className="ml-2 font-medium">{new Date(item.expiryDate).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Days Remaining:</span>
                            <span className={`ml-2 font-medium ${
                              item.daysUntilExpiry < 0 ? 'text-red-600' :
                              item.daysUntilExpiry <= 30 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {item.daysUntilExpiry < 0 
                                ? `${Math.abs(item.daysUntilExpiry)} days ago`
                                : `${item.daysUntilExpiry} days`
                              }
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Type:</span>
                            <span className="ml-2 font-medium capitalize">{item.documentType}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Number:</span>
                            <span className="ml-2 font-mono">{item.documentNumber}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Expiry Date:</span>
                            <span className="ml-2 font-medium">{new Date(item.expiryDate).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Days Remaining:</span>
                            <span className={`ml-2 font-medium ${
                              item.daysUntilExpiry < 0 ? 'text-red-600' :
                              item.daysUntilExpiry <= 30 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {item.daysUntilExpiry < 0 
                                ? `${Math.abs(item.daysUntilExpiry)} days ago`
                                : `${item.daysUntilExpiry} days`
                              }
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Employee Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Employee Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{employee.fullName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{employee.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{employee.contactNumber}</span>
                        </div>
                        {company && (
                          <div className="flex items-center gap-3">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span>{company.name}</span>
                          </div>
                        )}
                        {jobInfo && (
                          <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{jobInfo.jobTitle}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className={`p-4 rounded-lg border ${getStatusStyling(item.status, item.isDone)}`}>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status, item.isDone)}
                        <span className="font-medium capitalize">
                          {item.isDone ? 'Completed' : item.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    Document details not found
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Update Modal */}
        {showUpdateModal && (() => {
          const item = Object.values(dashboardData)
            .flatMap(category => category.items)
            .find(item => item.id === showUpdateModal);

          const [updateData, setUpdateData] = useState(() => {
            if (item?.documentType === 'zawil') {
              return {
                zawilPermitId: (item as any).zawilPermitId || item.documentNumber || '',
                permitType: (item as any).permitType || '',
                issuedFor: (item as any).issuedFor || '',
                arabicName: (item as any).arabicName || '',
                englishName: item.employeeName || '',
                moiNumber: (item as any).moiNumber || '',
                passportNumber: (item as any).passportNumber || '',
                nationality: (item as any).nationality || '',
                plateNumber: (item as any).plateNumber || '',
                portName: (item as any).portName || '',
                issueDate: (item as any).issueDate || '',
                expiryDate: item?.expiryDate || ''
              };
            } else {
              return {
                documentNumber: item?.documentNumber || '',
                expiryDate: item?.expiryDate || ''
              };
            }
          });

          const handleUpdate = () => {
            // In a real app, this would update the database
            toast.success('Document updated successfully');
            setShowUpdateModal(null);
            
            // Add to history
            if (item) {
              const historyEntry: DocumentHistory = {
                id: Date.now().toString(),
                employeeId: item.employeeId,
                employeeName: item.employeeName,
                documentType: item.documentType,
                documentNumber: item.documentNumber,
                oldExpiryDate: item.expiryDate,
                newExpiryDate: item.documentType === 'zawil' ? (updateData as any).expiryDate : (updateData as any).expiryDate,
                updatedAt: new Date().toISOString(),
                updatedBy: 'Current User',
                action: 'updated'
              };
              
              setDocumentHistory(prev => [historyEntry, ...prev]);
            }
          };

          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Update Document</h3>
                  <button
                    onClick={() => setShowUpdateModal(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  {item?.documentType === 'zawil' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Zawil Permit Id</label>
                        <input
                          type="text"
                          value={(updateData as any).zawilPermitId}
                          onChange={(e) => setUpdateData(prev => ({ ...prev, zawilPermitId: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Permit Type</label>
                        <select
                          value={(updateData as any).permitType}
                          onChange={(e) => setUpdateData(prev => ({ ...prev, permitType: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="Work Permit">Work Permit</option>
                          <option value="Business License">Business License</option>
                          <option value="Professional License">Professional License</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Issued for</label>
                        <select
                          value={(updateData as any).issuedFor}
                          onChange={(e) => setUpdateData(prev => ({ ...prev, issuedFor: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="Individual">Individual</option>
                          <option value="Company">Company</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Arabic Name</label>
                        <input
                          type="text"
                          value={(updateData as any).arabicName}
                          onChange={(e) => setUpdateData(prev => ({ ...prev, arabicName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">English Name</label>
                        <input
                          type="text"
                          value={(updateData as any).englishName}
                          onChange={(e) => setUpdateData(prev => ({ ...prev, englishName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">MOI Number</label>
                        <input
                          type="text"
                          value={(updateData as any).moiNumber}
                          onChange={(e) => setUpdateData(prev => ({ ...prev, moiNumber: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Passport Number</label>
                        <input
                          type="text"
                          value={(updateData as any).passportNumber}
                          onChange={(e) => setUpdateData(prev => ({ ...prev, passportNumber: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                        <input
                          type="text"
                          value={(updateData as any).nationality}
                          onChange={(e) => setUpdateData(prev => ({ ...prev, nationality: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Plate Number</label>
                        <input
                          type="text"
                          value={(updateData as any).plateNumber}
                          onChange={(e) => setUpdateData(prev => ({ ...prev, plateNumber: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Port Name</label>
                        <select
                          value={(updateData as any).portName}
                          onChange={(e) => setUpdateData(prev => ({ ...prev, portName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="King Abdulaziz Port">King Abdulaziz Port</option>
                          <option value="Jeddah Islamic Port">Jeddah Islamic Port</option>
                          <option value="Dammam Port">Dammam Port</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Issue Date</label>
                        <input
                          type="date"
                          value={(updateData as any).issueDate}
                          onChange={(e) => setUpdateData(prev => ({ ...prev, issueDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                        <input
                          type="date"
                          value={(updateData as any).expiryDate}
                          onChange={(e) => setUpdateData(prev => ({ ...prev, expiryDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Document Number</label>
                        <input
                          type="text"
                          value={(updateData as any).documentNumber}
                          onChange={(e) => setUpdateData(prev => ({ ...prev, documentNumber: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                        <input
                          type="date"
                          value={(updateData as any).expiryDate}
                          onChange={(e) => setUpdateData(prev => ({ ...prev, expiryDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleUpdate}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Update Document
                    </button>
                    <button
                      onClick={() => setShowUpdateModal(null)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};