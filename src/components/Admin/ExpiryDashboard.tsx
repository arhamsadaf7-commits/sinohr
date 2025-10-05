import React, { useState, useEffect, useMemo } from 'react';
import { ZawilService } from '../../services/zawilService';
import { ZawilPermit, UploadLog } from '../../types/zawil';
import { Calendar, AlertTriangle, Clock, CheckCircle, Search, Filter, ChevronDown, ChevronUp, FileText, CreditCard, Shield, Car, Eye, CreditCard as Edit, Check, Download, X, User, Phone, Mail, Building, MapPin, Archive, Loader2 } from 'lucide-react';
import { ExpiryItem, ExpiryStats } from '../../types/auth';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

interface ExtendedExpiryItem extends ExpiryItem {
  isDone?: boolean;
  completedAt?: string;
  completedBy?: string;
  // Zawil-specific fields
  zawilPermitId?: string;
  permitType?: string;
  issuedFor?: string;
  arabicName?: string;
  moiNumber?: string;
  passportNumber?: string;
  nationality?: string;
  plateNumber?: string;
  portName?: string;
  issueDate?: string;
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
  const [zawilPermits, setZawilPermits] = useState<ZawilPermit[]>([]);
  const [uploadHistory, setUploadHistory] = useState<UploadLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ZawilPermit | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'mark-done' | 'export' | null>(null);
  const [documentHistory, setDocumentHistory] = useState<DocumentHistory[]>([]);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  // Listen for data changes from uploads
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'zawil_data_updated') {
        setRefreshTrigger(prev => prev + 1);
        localStorage.removeItem('zawil_data_updated');
      }
    };

    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail === 'zawil_data_updated') {
        setRefreshTrigger(prev => prev + 1);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('zawil_data_updated' as any, handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('zawil_data_updated' as any, handleCustomEvent);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [permits, history] = await Promise.all([
        ZawilService.getZawilPermits(),
        ZawilService.getUploadHistory()
      ]);
      setZawilPermits(permits);
      setUploadHistory(history);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

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

  // Calculate dashboard data from employee context
  const dashboardData = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Convert Zawil permits to dashboard format
    const zawilItems = zawilPermits.map(permit => ({
      id: permit.permit_id.toString(),
      employeeId: permit.employee_id?.toString() || '',
      employeeName: permit.english_name,
      documentType: 'zawil' as const,
      documentNumber: permit.zawil_permit_id,
      expiryDate: permit.expiry_date,
      daysUntilExpiry: permit.days_remaining,
      status: permit.status === 'Expired' ? 'expired' as const :
              permit.status === 'Expiring Soon' ? 'expiring-soon' as const :
              permit.status === 'Valid' ? 'valid' as const : 'valid' as const,
      // Zawil-specific fields
      zawilPermitId: permit.zawil_permit_id,
      permitType: permit.permit_type,
      issuedFor: permit.issued_for,
      arabicName: permit.arabic_name,
      moiNumber: permit.moi_number,
      passportNumber: permit.passport_number,
      nationality: permit.nationality,
      plateNumber: permit.plate_number,
      portName: permit.port_name,
      issueDate: permit.issue_date
    }));

    return {
      zawil: {
        expired: zawilItems.filter(item => item.status === 'expired').length,
        expiringSoon: zawilItems.filter(item => item.status === 'expiring-soon').length,
        expiringLater: zawilItems.filter(item => item.daysUntilExpiry > 15 && item.daysUntilExpiry <= 30).length,
        total: zawilItems.length,
        items: zawilItems
      },
      iqama: { expired: 0, expiringSoon: 0, expiringLater: 0, total: 0, items: [] },
      passport: { expired: 0, expiringSoon: 0, expiringLater: 0, total: 0, items: [] },
      visa: { expired: 0, expiringSoon: 0, expiringLater: 0, total: 0, items: [] },
      license: { expired: 0, expiringSoon: 0, expiringLater: 0, total: 0, items: [] },
      insurance: { expired: 0, expiringSoon: 0, expiringLater: 0, total: 0, items: [] }
    };
  }, [zawilPermits]);

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

  // Get current tab data
  const getCurrentTabData = () => {
    if (activeTab === 'overview') return [];
    const tabData = dashboardData[activeTab as keyof typeof dashboardData];
    return getFilteredItems(tabData?.items || []);
  };

  // Handle mark as done
  const handleMarkAsDone = async (item: ZawilPermit) => {
    try {
      await ZawilService.updatePermitStatus(item.permit_id, 'Done');
      toast.success(`Marked ${item.english_name}'s permit as done`);
      loadData(); // Reload data
    } catch (error) {
      toast.error('Failed to mark as done');
    }
  };

  // Handle bulk mark as done
  const handleBulkMarkAsDone = async () => {
    try {
      const permitIds = Array.from(selectedItems).map(id => parseInt(id));
      await ZawilService.bulkUpdateStatus(permitIds, 'Done');
      toast.success(`Marked ${selectedItems.size} items as done`);
      setSelectedItems(new Set());
      setBulkAction(null);
      loadData(); // Reload data
    } catch (error) {
      toast.error('Failed to bulk mark as done');
    }
  };

  // Handle export
  const handleExport = () => {
    const currentData = getCurrentTabData();
    
    if (activeTab === 'zawil') {
      const permits = zawilPermits.filter(permit => 
        selectedItems.size === 0 || selectedItems.has(permit.permit_id.toString())
      );
      ZawilService.exportToCSV(permits);
    } else {
      // Handle other document types
      const csvContent = [
        ['Employee Name', 'Document Type', 'Document Number', 'Expiry Date', 'Days Remaining', 'Status'].join(','),
        ...currentData.map(item => [
          item.employeeName,
          item.documentType,
          item.documentNumber,
          item.expiryDate,
          item.daysUntilExpiry,
          item.status
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-expiry-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    toast.success('Data exported successfully');
    setSelectedItems(new Set());
    setBulkAction(null);
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

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading dashboard data...</span>
          </div>
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
                onClick={handleBulkMarkAsDone}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Mark as Done
              </button>
              <button
                onClick={handleExport}
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
              onClick={handleExport}
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
                     checked={filteredItems.length > 0 && selectedItems.size === filteredItems.length}
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
                  {activeTab === 'zawil' ? (
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
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Expiry Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Days Remaining</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Document Number</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Expiry Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Days Remaining</th>
                    </>
                  )}
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getCurrentTabData().map((item) => (
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
                    {activeTab === 'zawil' ? (
                      <>
                        <td className="px-4 py-3 font-mono text-sm">{item.zawilPermitId}</td>
                        <td className="px-4 py-3 text-sm">{item.permitType}</td>
                        <td className="px-4 py-3 text-sm">{item.issuedFor}</td>
                        <td className="px-4 py-3 text-sm">{item.arabicName}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{item.employeeName}</td>
                        <td className="px-4 py-3 font-mono text-sm">{item.moiNumber}</td>
                        <td className="px-4 py-3 font-mono text-sm">{item.passportNumber}</td>
                        <td className="px-4 py-3 text-sm">{item.nationality}</td>
                        <td className="px-4 py-3 text-sm">{item.plateNumber}</td>
                        <td className="px-4 py-3 text-sm">{item.portName}</td>
                        <td className="px-4 py-3 text-sm">{new Date(item.issueDate!).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm">{new Date(item.expiryDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`font-medium ${
                            item.daysUntilExpiry < 0 ? 'text-red-600' :
                            item.daysUntilExpiry <= 30 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {item.daysUntilExpiry} days
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-medium text-gray-900">{item.employeeName}</td>
                        <td className="px-4 py-3 font-mono text-sm">{item.documentNumber}</td>
                        <td className="px-4 py-3 text-sm">{new Date(item.expiryDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`font-medium ${
                            item.daysUntilExpiry < 0 ? 'text-red-600' :
                            item.daysUntilExpiry <= 30 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {item.daysUntilExpiry} days
                          </span>
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (activeTab === 'zawil') {
                              const permit = zawilPermits.find(p => p.permit_id.toString() === item.id);
                              if (permit) handleMarkAsDone(permit);
                            }
                          }}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Mark as Done"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (activeTab === 'zawil') {
                              const permit = zawilPermits.find(p => p.permit_id.toString() === item.id);
                              if (permit) {
                                setSelectedItem(permit);
                              }
                            }
                            setShowUpdateModal(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Update"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (activeTab === 'zawil') {
                              const permit = zawilPermits.find(p => p.permit_id.toString() === item.id);
                              if (permit) {
                                setSelectedItem(permit);
                              }
                            }
                            setShowDetailsModal(true);
                          }}
                          className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
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

          {getCurrentTabData().length === 0 && (
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

        {/* Update Modal */}
        {showUpdateModal && selectedItem && (
          <UpdateModal 
            item={selectedItem} 
            onClose={() => setShowUpdateModal(false)}
            onUpdate={loadData}
          />
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedItem && (
          <DetailsModal 
            item={selectedItem} 
            onClose={() => setShowDetailsModal(false)}
          />
        )}
      </div>
    </div>
  );
};

// Update Modal Component
const UpdateModal: React.FC<{
  item: ZawilPermit;
  onClose: () => void;
  onUpdate: () => void;
}> = ({ item, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    zawil_permit_id: item.zawil_permit_id,
    permit_type: item.permit_type,
    issued_for: item.issued_for,
    arabic_name: item.arabic_name || '',
    english_name: item.english_name,
    moi_number: item.moi_number,
    passport_number: item.passport_number,
    nationality: item.nationality,
    plate_number: item.plate_number || '',
    port_name: item.port_name,
    issue_date: item.issue_date,
    expiry_date: item.expiry_date
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await ZawilService.updatePermit(item.permit_id, formData);
      toast.success('Permit updated successfully');
      onUpdate();
      onClose();
    } catch (error) {
      toast.error('Failed to update permit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Update Zawil Permit</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zawil Permit Id</label>
                <input
                  type="text"
                  value={formData.zawil_permit_id}
                  onChange={(e) => setFormData({ ...formData, zawil_permit_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Permit Type</label>
                <input
                  type="text"
                  value={formData.permit_type}
                  onChange={(e) => setFormData({ ...formData, permit_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issued for</label>
                <input
                  type="text"
                  value={formData.issued_for}
                  onChange={(e) => setFormData({ ...formData, issued_for: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arabic Name</label>
                <input
                  type="text"
                  value={formData.arabic_name}
                  onChange={(e) => setFormData({ ...formData, arabic_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">English Name</label>
                <input
                  type="text"
                  value={formData.english_name}
                  onChange={(e) => setFormData({ ...formData, english_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MOI Number</label>
                <input
                  type="text"
                  value={formData.moi_number}
                  onChange={(e) => setFormData({ ...formData, moi_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                <input
                  type="text"
                  value={formData.passport_number}
                  onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
                <input
                  type="text"
                  value={formData.plate_number}
                  onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Port Name</label>
                <input
                  type="text"
                  value={formData.port_name}
                  onChange={(e) => setFormData({ ...formData, port_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                <input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Update Permit
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Details Modal Component
const DetailsModal: React.FC<{
  item: ZawilPermit;
  onClose: () => void;
}> = ({ item, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Zawil Permit Details</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Zawil Permit Id</label>
                <p className="text-gray-900 font-mono">{item.zawil_permit_id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Permit Type</label>
                <p className="text-gray-900">{item.permit_type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Issued for</label>
                <p className="text-gray-900">{item.issued_for}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Arabic Name</label>
                <p className="text-gray-900">{item.arabic_name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">English Name</label>
                <p className="text-gray-900 font-medium">{item.english_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">MOI Number</label>
                <p className="text-gray-900 font-mono">{item.moi_number}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Passport Number</label>
                <p className="text-gray-900 font-mono">{item.passport_number}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Nationality</label>
                <p className="text-gray-900">{item.nationality}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Plate Number</label>
                <p className="text-gray-900">{item.plate_number || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Port Name</label>
                <p className="text-gray-900">{item.port_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Issue Date</label>
                <p className="text-gray-900">{new Date(item.issue_date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Expiry Date</label>
                <p className="text-gray-900">{new Date(item.expiry_date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Days Remaining</label>
                <p className={`font-medium text-lg ${
                  item.days_remaining < 0 ? 'text-red-600' :
                  item.days_remaining <= 30 ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {item.days_remaining} days
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                  item.status === 'Expired' ? 'bg-red-100 text-red-800' :
                  item.status === 'Expiring Soon' ? 'bg-yellow-100 text-yellow-800' :
                  item.status === 'Done' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {item.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                <p className="text-gray-900 text-sm">{new Date(item.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};