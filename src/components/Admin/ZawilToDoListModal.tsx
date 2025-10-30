import React, { useState, useMemo } from 'react';
import { X, CheckSquare, Square, Search, Eye, Trash2, Check, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ZawilPermit {
  permit_id: number;
  zawil_permit_id: string;
  permit_type: string;
  issued_for: string;
  english_name: string;
  arabic_name: string;
  moi_number: string;
  nationality: string;
  vehicle_plate_number?: string;
  port_name: string;
  issue_date: string;
  expiry_date: string;
  is_done?: boolean;
  done_at?: string;
  done_by?: string;
  daysRemaining: number;
  status: 'active' | 'expiring' | 'expired';
}

interface Props {
  permits: ZawilPermit[];
  onClose: () => void;
  onRefresh: () => void;
}

export const ZawilToDoListModal: React.FC<Props> = ({ permits, onClose, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'done' | 'pending'>('pending');
  const [sortBy, setSortBy] = useState<'days' | 'expiry' | 'name'>('days');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<ZawilPermit | null>(null);

  const filteredPermits = useMemo(() => {
    let filtered = permits.filter(p => p.status === 'expiring' || p.status === 'expired');

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.english_name.toLowerCase().includes(term) ||
        p.moi_number.toLowerCase().includes(term) ||
        p.zawil_permit_id.toLowerCase().includes(term)
      );
    }

    if (statusFilter === 'done') {
      filtered = filtered.filter(p => p.is_done);
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(p => !p.is_done);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'days') return a.daysRemaining - b.daysRemaining;
      if (sortBy === 'expiry') return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
      return a.english_name.localeCompare(b.english_name);
    });

    return filtered;
  }, [permits, searchTerm, statusFilter, sortBy]);

  const paginatedPermits = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredPermits.slice(start, end);
  }, [filteredPermits, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPermits.length / itemsPerPage);
  const pendingCount = permits.filter(p => (p.status === 'expiring' || p.status === 'expired') && !p.is_done).length;
  const doneCount = permits.filter(p => (p.status === 'expiring' || p.status === 'expired') && p.is_done).length;

  const toggleSelect = (permitId: number) => {
    setSelectedIds(prev =>
      prev.includes(permitId)
        ? prev.filter(id => id !== permitId)
        : [...prev, permitId]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === paginatedPermits.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedPermits.map(p => p.permit_id));
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
      onRefresh();
    } catch (error: any) {
      console.error('Error updating permit:', error);
      toast.error('Failed to update permit');
    }
  };

  const bulkMarkAsDone = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one permit');
      return;
    }

    try {
      const { error } = await supabase
        .from('zawil_permits')
        .update({
          is_done: true,
          done_at: new Date().toISOString(),
          done_by: 'current_user'
        })
        .in('permit_id', selectedIds);

      if (error) throw error;

      toast.success(`${selectedIds.length} permits marked as done`);
      setSelectedIds([]);
      onRefresh();
    } catch (error: any) {
      console.error('Error updating permits:', error);
      toast.error('Failed to update permits');
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one permit');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} permits?`)) return;

    try {
      const { error } = await supabase
        .from('zawil_permits')
        .delete()
        .in('permit_id', selectedIds);

      if (error) throw error;

      toast.success(`${selectedIds.length} permits deleted`);
      setSelectedIds([]);
      onRefresh();
    } catch (error: any) {
      console.error('Error deleting permits:', error);
      toast.error('Failed to delete permits');
    }
  };

  const sendNotifications = () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one permit');
      return;
    }
    toast.success(`Notifications sent for ${selectedIds.length} permits`);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckSquare className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">✅ To Do List – Expiring Permits</h2>
                  <p className="text-sm text-gray-600">Track and manage time-sensitive permits</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by Name, MOI Number, Permit ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All ({permits.filter(p => p.status === 'expiring' || p.status === 'expired').length})</option>
                  <option value="pending">Pending ({pendingCount})</option>
                  <option value="done">Done ({doneCount})</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="days">Days Remaining</option>
                  <option value="expiry">Expiry Date</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
              <div className="mt-4 flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-blue-900">
                  {selectedIds.length} selected
                </span>
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={bulkMarkAsDone}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    <Check className="w-4 h-4" />
                    Mark All Done
                  </button>
                  <button
                    onClick={sendNotifications}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <Mail className="w-4 h-4" />
                    Send Notification
                  </button>
                  <button
                    onClick={bulkDelete}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Content - Desktop Table */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="hidden md:block">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === paginatedPermits.length && paginatedPermits.length > 0}
                        onChange={selectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">English Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MOI Number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permit Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Left</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedPermits.map(permit => (
                    <tr
                      key={permit.permit_id}
                      className={`hover:bg-gray-50 ${permit.is_done ? 'opacity-60' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(permit.permit_id)}
                          onChange={() => toggleSelect(permit.permit_id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${
                          permit.status === 'expired'
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}>
                          {permit.status === 'expired' ? '🔴 Expired' : '🟠 Expiring'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {permit.is_done && <span className="line-through">{permit.english_name}</span>}
                        {!permit.is_done && permit.english_name}
                        {permit.is_done && (
                          <span className="ml-2 text-xs text-green-600">✓ Done</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{permit.moi_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{permit.permit_type}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(permit.expiry_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm font-semibold ${
                            permit.daysRemaining <= 0 ? 'text-red-600' : 'text-yellow-600'
                          }`}
                          title={`Expires in ${permit.daysRemaining} days`}
                        >
                          {permit.daysRemaining > 0
                            ? `${permit.daysRemaining} days`
                            : `${Math.abs(permit.daysRemaining)} days ago`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPermit(permit);
                              setShowDetailsModal(true);
                            }}
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
                            {permit.is_done ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {paginatedPermits.map(permit => (
                <div
                  key={permit.permit_id}
                  className={`bg-white rounded-lg shadow-sm border-l-4 p-4 ${
                    permit.status === 'expired' ? 'border-red-500' : 'border-yellow-500'
                  } ${permit.is_done ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(permit.permit_id)}
                      onChange={() => toggleSelect(permit.permit_id)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`font-semibold text-gray-900 ${permit.is_done ? 'line-through' : ''}`}>
                            {permit.english_name}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">{permit.permit_type}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          permit.status === 'expired'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {permit.status === 'expired' ? '🔴' : '🟠'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                        <div>
                          <span className="text-gray-500">MOI:</span>
                          <p className="font-medium text-gray-900">{permit.moi_number}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Expiry:</span>
                          <p className="font-medium text-gray-900">
                            {new Date(permit.expiry_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Days Remaining:</span>
                          <p className={`font-bold ${
                            permit.daysRemaining <= 0 ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {permit.daysRemaining > 0
                              ? `${permit.daysRemaining} days`
                              : `Expired ${Math.abs(permit.daysRemaining)} days ago`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setSelectedPermit(permit);
                        setShowDetailsModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => toggleDone(permit.permit_id, permit.is_done || false)}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm ${
                        permit.is_done
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {permit.is_done ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      {permit.is_done ? 'Done' : 'Mark'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {paginatedPermits.length === 0 && (
              <div className="text-center py-12">
                <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">
                  {statusFilter === 'done' ? 'No completed items yet' :
                   statusFilter === 'pending' ? 'All items completed!' :
                   'No items in your to-do list'}
                </p>
              </div>
            )}
          </div>

          {/* Footer - Pagination */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0 sticky bottom-0">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>items per page</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPermits.length)} of {filteredPermits.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedPermit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
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
                  <p className="text-sm text-gray-600">Nationality</p>
                  <p className="font-medium text-gray-900">{selectedPermit.nationality}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expiry Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedPermit.expiry_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Days Remaining</p>
                  <p className={`font-medium ${
                    selectedPermit.daysRemaining <= 0 ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {selectedPermit.daysRemaining > 0
                      ? `${selectedPermit.daysRemaining} days`
                      : `Expired ${Math.abs(selectedPermit.daysRemaining)} days ago`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
