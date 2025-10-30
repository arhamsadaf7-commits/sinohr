import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { RefreshCw, Settings, Bell, Search, Filter, Eye, Check, X, Trash2, ChevronDown, ChevronUp, Calendar, FileText, AlertTriangle, CheckCircle, Clock, User, CreditCard, Car, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { ZawilToDoListModal } from './ZawilToDoListModal';
import { ZawilNotificationPanel } from './ZawilNotificationPanel';

interface ZawilPermit {
  permit_id: number;
  zawil_permit_id: string;
  permit_type: string;
  issued_for: string;
  english_name: string;
  arabic_name: string;
  moi_number: string;
  passport_number: string;
  nationality: string;
  vehicle_plate_number?: string;
  port_name: string;
  issue_date: string;
  expiry_date: string;
  is_done?: boolean;
  done_at?: string;
  done_by?: string;
  created_at: string;
}

interface StatusSettings {
  activeDays: number;
  expiringSoonDays: number;
  notifyDays: number;
}

type StatusType = 'active' | 'expiring' | 'expired';

export const ZawilExpiryDashboard: React.FC = () => {
  const [permits, setPermits] = useState<ZawilPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StatusType>('all');
  const [issuedForFilter, setIssuedForFilter] = useState<string>('all');
  const [permitTypeFilter, setPermitTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'issue_date' | 'expiry_date' | 'days_remaining'>('expiry_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedPermit, setSelectedPermit] = useState<ZawilPermit | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showToDoList, setShowToDoList] = useState(false);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '', type: 'expiry' as 'issue' | 'expiry' });

  const [settings, setSettings] = useState<StatusSettings>({
    activeDays: 15,
    expiringSoonDays: 15,
    notifyDays: 7
  });

  useEffect(() => {
    loadSettings();
    fetchPermits();
  }, []);

  const loadSettings = () => {
    const saved = localStorage.getItem('zawil_expiry_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  };

  const saveSettings = (newSettings: StatusSettings) => {
    setSettings(newSettings);
    localStorage.setItem('zawil_expiry_settings', JSON.stringify(newSettings));
    toast.success('Settings saved successfully');
    setShowSettingsModal(false);
  };

  const fetchPermits = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('zawil_permits')
        .select('*')
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      setPermits(data || []);
    } catch (error: any) {
      console.error('Error fetching permits:', error);
      toast.error('Failed to load permits');
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysRemaining = (expiryDate: string): number => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatus = (daysRemaining: number): StatusType => {
    if (daysRemaining <= 0) return 'expired';
    if (daysRemaining <= settings.expiringSoonDays) return 'expiring';
    return 'active';
  };

  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'expiring': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getStatusIcon = (status: StatusType) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'expiring': return Clock;
      case 'expired': return AlertTriangle;
    }
  };

  const permitsWithStatus = useMemo(() => {
    return permits.map(permit => {
      const daysRemaining = calculateDaysRemaining(permit.expiry_date);
      const status = getStatus(daysRemaining);
      return { ...permit, daysRemaining, status };
    });
  }, [permits, settings]);

  const filteredPermits = useMemo(() => {
    return permitsWithStatus.filter(permit => {
      const matchesSearch =
        permit.zawil_permit_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permit.english_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permit.moi_number.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || permit.status === statusFilter;
      const matchesIssuedFor = issuedForFilter === 'all' || permit.issued_for === issuedForFilter;
      const matchesPermitType = permitTypeFilter === 'all' || permit.permit_type.toLowerCase() === permitTypeFilter.toLowerCase();

      let matchesDate = true;
      if (dateFilter.startDate && dateFilter.endDate) {
        const compareDate = dateFilter.type === 'issue' ? permit.issue_date : permit.expiry_date;
        matchesDate = compareDate >= dateFilter.startDate && compareDate <= dateFilter.endDate;
      }

      return matchesSearch && matchesStatus && matchesIssuedFor && matchesPermitType && matchesDate;
    });
  }, [permitsWithStatus, searchTerm, statusFilter, issuedForFilter, permitTypeFilter, dateFilter]);

  const sortedPermits = useMemo(() => {
    return [...filteredPermits].sort((a, b) => {
      let aVal, bVal;

      if (sortField === 'days_remaining') {
        aVal = a.daysRemaining;
        bVal = b.daysRemaining;
      } else {
        aVal = new Date(a[sortField]).getTime();
        bVal = new Date(b[sortField]).getTime();
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filteredPermits, sortField, sortDirection]);

  const stats = useMemo(() => {
    const active = permitsWithStatus.filter(p => p.status === 'active').length;
    const expiring = permitsWithStatus.filter(p => p.status === 'expiring').length;
    const expired = permitsWithStatus.filter(p => p.status === 'expired').length;
    const total = permitsWithStatus.length;

    return { active, expiring, expired, total };
  }, [permitsWithStatus]);

  const notificationPermits = useMemo(() => {
    return permitsWithStatus.filter(p =>
      (p.status === 'expiring' && p.daysRemaining <= settings.notifyDays) ||
      p.status === 'expired'
    );
  }, [permitsWithStatus, settings.notifyDays]);

  const toDoPermits = useMemo(() => {
    return permitsWithStatus.filter(p => p.status === 'expiring' && !p.is_done);
  }, [permitsWithStatus]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleDone = async (permitId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('zawil_permits')
        .update({
          is_done: !currentStatus,
          done_at: !currentStatus ? new Date().toISOString() : null,
          done_by: !currentStatus ? 'current_user' : null
        })
        .eq('permit_id', permitId);

      if (error) throw error;

      toast.success(!currentStatus ? 'Marked as done' : 'Marked as undone');
      fetchPermits();
    } catch (error: any) {
      console.error('Error updating permit:', error);
      toast.error('Failed to update permit');
    }
  };

  const handleDelete = async (permitId: number) => {
    if (!confirm('Are you sure you want to delete this permit?')) return;

    try {
      const { error } = await supabase
        .from('zawil_permits')
        .delete()
        .eq('permit_id', permitId);

      if (error) throw error;

      toast.success('Permit deleted successfully');
      fetchPermits();
    } catch (error: any) {
      console.error('Error deleting permit:', error);
      toast.error('Failed to delete permit');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, status }: {
    title: string;
    value: number;
    icon: any;
    color: string;
    status?: 'all' | StatusType;
  }) => (
    <button
      onClick={() => setStatusFilter(status || 'all')}
      className={`bg-white rounded-xl shadow-sm border-2 p-6 hover:shadow-md transition-all ${
        statusFilter === status ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm font-medium text-gray-600">{title}</p>
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Zawil Permit Expiry Dashboard</h1>
              <p className="text-gray-600">Monitor and manage permit expiry statuses</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchPermits}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => setShowToDoList(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors relative"
              >
                <Check className="w-4 h-4" />
                To Do List
                {toDoPermits.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {toDoPermits.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {notificationPermits.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {notificationPermits.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Active Permits" value={stats.active} icon={CheckCircle} color="bg-green-500" status="active" />
          <StatCard title="Expiring Soon" value={stats.expiring} icon={Clock} color="bg-yellow-500" status="expiring" />
          <StatCard title="Expired" value={stats.expired} icon={AlertTriangle} color="bg-red-500" status="expired" />
          <StatCard title="Total Permits" value={stats.total} icon={FileText} color="bg-blue-500" status="all" />
        </div>

        {/* Notification Panel */}
        {showNotificationPanel && (
          <ZawilNotificationPanel
            permits={notificationPermits}
            onClose={() => setShowNotificationPanel(false)}
            onSendToTodo={(permits) => {
              setShowNotificationPanel(false);
              setShowToDoList(true);
            }}
          />
        )}

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by Permit ID, Name, or MOI Number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="expiring">Expiring Soon</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issued For</label>
              <select
                value={issuedForFilter}
                onChange={(e) => setIssuedForFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="VISITOR">Visitor</option>
                <option value="PERMANENT">Permanent</option>
                <option value="VEHICLE">Vehicle</option>
                <option value="PERSON">Person</option>
                <option value="PERSON WITH VEHICLE">Person with Vehicle</option>
                <option value="VEHICLE / HEAVY EQUIPMENT">Vehicle / Heavy Equipment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Permit Type</label>
              <select
                value={permitTypeFilter}
                onChange={(e) => setPermitTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="temporary">Temporary</option>
                <option value="visitor">Visitor</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Data Table - Desktop */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permit ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued For</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MOI Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nationality</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('issue_date')}>
                    Issue Date {sortField === 'issue_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('expiry_date')}>
                    Expiry Date {sortField === 'expiry_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('days_remaining')}>
                    Days Left {sortField === 'days_remaining' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPermits.map((permit) => {
                  const StatusIcon = getStatusIcon(permit.status);
                  return (
                    <tr key={permit.permit_id} className={`hover:bg-gray-50 ${
                      permit.status === 'active' ? 'bg-green-50' :
                      permit.status === 'expiring' ? 'bg-yellow-50' :
                      'bg-red-50'
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(permit.status)}`}>
                          <StatusIcon className="w-3 h-3" />
                          {permit.status === 'active' ? 'Active' : permit.status === 'expiring' ? 'Expiring' : 'Expired'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => { setSelectedPermit(permit); setShowDetailsModal(true); }}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {permit.zawil_permit_id}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.permit_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{permit.issued_for}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{permit.english_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{permit.moi_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{permit.nationality}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(permit.issue_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(permit.expiry_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          permit.daysRemaining > settings.expiringSoonDays ? 'text-green-600' :
                          permit.daysRemaining > 0 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {permit.daysRemaining > 0 ? `${permit.daysRemaining} days` : `${Math.abs(permit.daysRemaining)} days ago`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setSelectedPermit(permit); setShowDetailsModal(true); }}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleDone(permit.permit_id, permit.is_done || false)}
                            className={permit.is_done ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-gray-600'}
                            title={permit.is_done ? 'Mark as Undone' : 'Mark as Done'}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(permit.permit_id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
          {sortedPermits.map((permit) => {
            const StatusIcon = getStatusIcon(permit.status);
            return (
              <div
                key={permit.permit_id}
                className={`bg-white rounded-xl shadow-sm border-l-4 p-4 ${
                  permit.status === 'active' ? 'border-green-500 bg-green-50' :
                  permit.status === 'expiring' ? 'border-yellow-500 bg-yellow-50' :
                  'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-lg">{permit.english_name}</p>
                    <p className="text-sm text-gray-600">{permit.permit_type}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(permit.status)}`}>
                    <StatusIcon className="w-3 h-3" />
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expiry Date:</span>
                    <span className="font-medium text-gray-900">{new Date(permit.expiry_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days Remaining:</span>
                    <span className={`font-medium ${
                      permit.daysRemaining > settings.expiringSoonDays ? 'text-green-600' :
                      permit.daysRemaining > 0 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {permit.daysRemaining > 0 ? `${permit.daysRemaining} days` : `${Math.abs(permit.daysRemaining)} days ago`}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => { setSelectedPermit(permit); setShowDetailsModal(true); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => toggleDone(permit.permit_id, permit.is_done || false)}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      permit.is_done
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedPermit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Permit Details</h2>
                  <button onClick={() => setShowDetailsModal(false)}>
                    <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Permit ID</p>
                    <p className="font-medium text-gray-900">{selectedPermit.zawil_permit_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Permit Type</p>
                    <p className="font-medium text-gray-900">{selectedPermit.permit_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Issued For</p>
                    <p className="font-medium text-gray-900">{selectedPermit.issued_for}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedPermit.status)}`}>
                      {selectedPermit.status}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">English Name</p>
                    <p className="font-medium text-gray-900">{selectedPermit.english_name}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Arabic Name</p>
                    <p className="font-medium text-gray-900">{selectedPermit.arabic_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">MOI Number</p>
                    <p className="font-medium text-gray-900">{selectedPermit.moi_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Passport Number</p>
                    <p className="font-medium text-gray-900">{selectedPermit.passport_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nationality</p>
                    <p className="font-medium text-gray-900">{selectedPermit.nationality}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Vehicle Plate</p>
                    <p className="font-medium text-gray-900">{selectedPermit.vehicle_plate_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Port Name</p>
                    <p className="font-medium text-gray-900">{selectedPermit.port_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Issue Date</p>
                    <p className="font-medium text-gray-900">{new Date(selectedPermit.issue_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expiry Date</p>
                    <p className="font-medium text-gray-900">{new Date(selectedPermit.expiry_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Days Remaining</p>
                    <p className={`font-medium ${
                      selectedPermit.daysRemaining > settings.expiringSoonDays ? 'text-green-600' :
                      selectedPermit.daysRemaining > 0 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {selectedPermit.daysRemaining > 0 ? `${selectedPermit.daysRemaining} days` : `Expired ${Math.abs(selectedPermit.daysRemaining)} days ago`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Status Calculation Settings</h2>
                  <button onClick={() => setShowSettingsModal(false)}>
                    <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Active Status (greater than days)
                    </label>
                    <input
                      type="number"
                      value={settings.activeDays}
                      onChange={(e) => setSettings({ ...settings, activeDays: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Permits with more than this many days are marked as Active</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiring Soon (less than or equal days)
                    </label>
                    <input
                      type="number"
                      value={settings.expiringSoonDays}
                      onChange={(e) => setSettings({ ...settings, expiringSoonDays: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Permits with this many days or less are marked as Expiring Soon</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notification Threshold (days before)
                    </label>
                    <input
                      type="number"
                      value={settings.notifyDays}
                      onChange={(e) => setSettings({ ...settings, notifyDays: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Show notifications when permits expire in this many days or less</p>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Expired Status:</span> System-defined (≤ 0 days)
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => saveSettings(settings)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => saveSettings({ activeDays: 15, expiringSoonDays: 15, notifyDays: 7 })}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* To Do List Modal */}
        {showToDoList && (
          <ZawilToDoListModal
            permits={permitsWithStatus}
            onClose={() => setShowToDoList(false)}
            onRefresh={fetchPermits}
          />
        )}
      </div>
    </div>
  );
};
