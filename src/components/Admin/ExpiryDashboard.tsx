import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Calendar, User, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ZawilService } from '../../services/zawilService';
import { ZawilPermit } from '../../types/zawil';
import { NotificationService } from '../../utils/notifications';

interface ExpiryDashboardProps {
  onRefresh?: () => void;
}

export const ExpiryDashboard: React.FC<ExpiryDashboardProps> = ({ onRefresh }) => {
  const [permits, setPermits] = useState<ZawilPermit[]>([]);
  const [filteredPermits, setFilteredPermits] = useState<ZawilPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [permitTypeFilter, setPermitTypeFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(20);
  const [selectedPermits, setSelectedPermits] = useState<string[]>([]);

  useEffect(() => {
    loadPermits();
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      loadPermits();
    };

    window.addEventListener('zawil-data-updated', handleRefresh);
    return () => window.removeEventListener('zawil-data-updated', handleRefresh);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [permits, searchTerm, statusFilter, permitTypeFilter, dateRangeFilter]);

  const loadPermits = async () => {
    try {
      setLoading(true);
      const data = await ZawilService.getZawilPermits({ limit: 1000 });
      setPermits(data.permits || []);
    } catch (error) {
      console.error('Error loading permits:', error);
      NotificationService.error('Failed to load permits');
      setPermits([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = permits.length;
    const expired = permits.filter(p => p.status === 'Expired').length;
    const expiringSoon = permits.filter(p => p.status === 'Expiring Soon').length;
    const valid = permits.filter(p => p.status === 'Valid').length;
    const done = permits.filter(p => p.status === 'Done').length;
    
    return { total, expired, expiringSoon, valid, done };
  }, [permits]);

  const applyFilters = () => {
    let filtered = [...permits];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(permit =>
        permit.english_name?.toLowerCase().includes(term) ||
        permit.moi_number?.toLowerCase().includes(term) ||
        permit.zawil_permit_id?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(permit => {
        switch (statusFilter) {
          case 'expired':
            return permit.status === 'Expired';
          case 'expiring':
            return permit.status === 'Expiring Soon';
          case 'active':
            return permit.status === 'Valid';
          case 'done':
            return permit.status === 'Done';
          default:
            return true;
        }
      });
    }

    // Permit type filter
    if (permitTypeFilter !== 'all') {
      filtered = filtered.filter(permit => permit.permit_type === permitTypeFilter);
    }

    // Date range filter
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(permit => {
        const expiryDate = new Date(permit.expiry_date);
        switch (dateRangeFilter) {
          case 'next30':
            return expiryDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          case 'next60':
            return expiryDate <= new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
          case 'next90':
            return expiryDate <= new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
          default:
            return true;
        }
      });
    }

    setFilteredPermits(filtered);
    setCurrentPage(1);
  };

  const handleStatusToggle = async (permitId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'Done' ? 'UNDONE' : 'Done';
      await ZawilService.updatePermitStatus(permitId, newStatus);
      
      // Update local state
      setPermits(prev => prev.map(permit => 
        permit.permit_id === permitId 
          ? { ...permit, status: newStatus === 'UNDONE' ? calculateStatus(permit.expiry_date) : 'Done' }
          : permit
      ));
      
      NotificationService.success(`Permit marked as ${newStatus === 'Done' ? 'Done' : 'Undone'}`);
    } catch (error) {
      console.error('Error updating permit status:', error);
      NotificationService.error('Failed to update permit status');
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedPermits.length === 0) {
      NotificationService.warning('Please select permits to update');
      return;
    }

    try {
      const permitIds = selectedPermits.map(id => parseInt(id));
      await ZawilService.bulkUpdateStatus(permitIds, status);
      
      // Update local state
      setPermits(prev => prev.map(permit => 
        selectedPermits.includes(permit.permit_id.toString())
          ? { ...permit, status: status as any }
          : permit
      ));
      
      setSelectedPermits([]);
      NotificationService.success(`Updated ${selectedPermits.length} permits to ${status}`);
    } catch (error) {
      NotificationService.error('Failed to update permits');
    }
  };

  const calculateStatus = (expiryDate: string): string => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'Expired';
    if (daysUntilExpiry <= 30) return 'Expiring Soon';
    return 'Valid';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Expired':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'Expiring Soon':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'Valid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Done':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Expired':
        return 'bg-red-100 text-red-800';
      case 'Expiring Soon':
        return 'bg-yellow-100 text-yellow-800';
      case 'Valid':
        return 'bg-green-100 text-green-800';
      case 'Done':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredPermits.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentPermits = filteredPermits.slice(startIndex, endIndex);

  const uniquePermitTypes = [...new Set(permits.map(p => p.permit_type).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Permits</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <div className="text-sm text-gray-600">Expired</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</div>
            <div className="text-sm text-gray-600">Expiring Soon</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
            <div className="text-sm text-gray-600">Valid</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{stats.done}</div>
            <div className="text-sm text-gray-600">Done</div>
          </div>
        </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Zawil Expiry Dashboard</h2>
          <p className="text-gray-600">Monitor and manage Zawil permit expiry dates</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => ZawilService.exportToCSV(filteredPermits)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Export CSV
          </button>
        <button
          onClick={loadPermits}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Refresh
        </button>
      </div>
        </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, MOI number, or permit ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="expired">Expired</option>
            <option value="expiring">Expiring Soon</option>
            <option value="active">Active</option>
            <option value="done">Done</option>
          </select>

          {/* Permit Type Filter */}
          <select
            value={permitTypeFilter}
            onChange={(e) => setPermitTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Permit Types</option>
            {uniquePermitTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Dates</option>
            <option value="next30">Next 30 Days</option>
            <option value="next60">Next 60 Days</option>
            <option value="next90">Next 90 Days</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPermits.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">{selectedPermits.length} permits selected</span>
            <div className="flex gap-2">
              <button onClick={() => handleBulkStatusUpdate('Done')} className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">Mark as Done</button>
              <button onClick={() => handleBulkStatusUpdate('Valid')} className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">Mark as Valid</button>
              <button onClick={() => setSelectedPermits([])} className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">Clear Selection</button>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredPermits.length)} of {filteredPermits.length} permits
          </span>
          <select
            value={recordsPerPage}
            onChange={(e) => {
              setRecordsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPermits.length === currentPermits.length && currentPermits.length > 0}
                    onChange={(e) => setSelectedPermits(e.target.checked ? currentPermits.map(p => p.permit_id.toString()) : [])}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MOI Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permit Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permit Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPermits.map((permit) => (
                <tr key={permit.permit_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedPermits.includes(permit.permit_id.toString())}
                      onChange={(e) => setSelectedPermits(prev => 
                        e.target.checked ? [...prev, permit.permit_id.toString()] : prev.filter(id => id !== permit.permit_id.toString())
                      )}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {permit.english_name || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {permit.moi_number || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {permit.zawil_permit_id || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {permit.permit_type || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {permit.issue_date ? new Date(permit.issue_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {permit.expiry_date ? new Date(permit.expiry_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      {getStatusIcon(permit.status)}
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(permit.status)}`}>
                        {permit.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {permit.status === 'Done' ? (
                        <button
                          onClick={() => handleStatusToggle(permit.permit_id, permit.status)}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
                        >
                          Mark as UNDONE
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusToggle(permit.permit_id, permit.status)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
                        >
                          Mark as DONE
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center px-4 py-2 border-t border-b border-gray-300 bg-white text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredPermits.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No permits found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {permits.length === 0 
              ? "No permits have been uploaded yet." 
              : "Try adjusting your search or filter criteria."
            }
          </p>
        </div>
      )}
      </div>
    </div>
  );
};