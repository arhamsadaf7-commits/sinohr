import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Check, X, FileText, Search, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface PermitRequest {
  request_id: number;
  permit_type: string;
  issued_for: 'VISITOR' | 'PERMANENT' | 'VEHICLE';
  english_name: string;
  iqama_moi_number: string;
  passport_number: string;
  nationality: string;
  vehicle_plate_number?: string;
  port_name: string;
  iqama_image_url?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submitted_by: string;
  is_public_submission: boolean;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_by_user_id?: string;
}

export const PermitRequestsPage: React.FC = () => {
  const { state } = useAuth();
  const [requests, setRequests] = useState<PermitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [canUpdate, setCanUpdate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState<PermitRequest | null>(null);
  const [viewingRequest, setViewingRequest] = useState<PermitRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [issuedForFilter, setIssuedForFilter] = useState<string>('ALL');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    permit_type: '',
    issued_for: 'VISITOR' as 'VISITOR' | 'PERMANENT' | 'VEHICLE',
    english_name: '',
    iqama_moi_number: '',
    passport_number: '',
    nationality: '',
    vehicle_plate_number: '',
    port_name: '',
    iqama_image_url: '',
    submitted_by: '',
    admin_notes: '',
    status: 'PENDING' as 'PENDING' | 'APPROVED' | 'REJECTED'
  });

  useEffect(() => {
    fetchRequests();
    checkPermissions();
  }, [state.user]);

  const checkPermissions = () => {
    if (!state.user) return;

    const zawilModule = state.user.role.permissions.filter(p => p.module === 'Zawil Requests');
    setCanCreate(zawilModule.some(p => p.action === 'create'));
    setCanUpdate(zawilModule.some(p => p.action === 'update'));
    setCanDelete(zawilModule.some(p => p.action === 'delete'));
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('zawil_permit_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast.error('Failed to load permit requests');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `iqama_images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('permits')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('permits')
        .getPublicUrl(filePath);

      setFormData({ ...formData, iqama_image_url: publicUrl });
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error('Failed to upload image');
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.user) {
      toast.error('You must be logged in');
      return;
    }

    try {
      if (editingRequest) {
        if (!canUpdate) {
          toast.error('You do not have permission to update requests');
          return;
        }

        const { error } = await supabase
          .from('zawil_permit_requests')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
            reviewed_at: formData.status !== 'PENDING' ? new Date().toISOString() : null,
            reviewed_by: formData.status !== 'PENDING' ? state.user.email : null
          })
          .eq('request_id', editingRequest.request_id);

        if (error) throw error;
        toast.success('Request updated successfully');
      } else {
        if (!canCreate) {
          toast.error('You do not have permission to create requests');
          return;
        }

        const { error } = await supabase
          .from('zawil_permit_requests')
          .insert([{
            ...formData,
            is_public_submission: false,
            created_by_user_id: state.user.id,
            submitted_by: state.user.email
          }]);

        if (error) throw error;
        toast.success('Request created successfully');
      }

      resetForm();
      fetchRequests();
    } catch (error: any) {
      toast.error(editingRequest ? 'Failed to update request' : 'Failed to create request');
      console.error(error);
    }
  };

  const handleEdit = (request: PermitRequest) => {
    setEditingRequest(request);
    setFormData({
      permit_type: request.permit_type,
      issued_for: request.issued_for,
      english_name: request.english_name,
      iqama_moi_number: request.iqama_moi_number,
      passport_number: request.passport_number,
      nationality: request.nationality,
      vehicle_plate_number: request.vehicle_plate_number || '',
      port_name: request.port_name,
      iqama_image_url: request.iqama_image_url || '',
      submitted_by: request.submitted_by,
      admin_notes: request.admin_notes || '',
      status: request.status
    });
    setShowForm(true);
  };

  const handleDelete = async (requestId: number) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete requests');
      return;
    }

    if (!confirm('Are you sure you want to delete this request?')) return;

    try {
      const { error } = await supabase
        .from('zawil_permit_requests')
        .delete()
        .eq('request_id', requestId);

      if (error) throw error;
      toast.success('Request deleted successfully');
      fetchRequests();
    } catch (error: any) {
      toast.error('Failed to delete request');
      console.error(error);
    }
  };

  const handleStatusUpdate = async (requestId: number, newStatus: 'APPROVED' | 'REJECTED') => {
    if (!canUpdate) {
      toast.error('You do not have permission to update requests');
      return;
    }

    if (!state.user) {
      toast.error('You must be logged in');
      return;
    }

    try {
      const { error } = await supabase
        .from('zawil_permit_requests')
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: state.user.email,
          updated_at: new Date().toISOString()
        })
        .eq('request_id', requestId);

      if (error) throw error;
      toast.success(`Request ${newStatus.toLowerCase()} successfully`);
      fetchRequests();
    } catch (error: any) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      permit_type: '',
      issued_for: 'VISITOR',
      english_name: '',
      iqama_moi_number: '',
      passport_number: '',
      nationality: '',
      vehicle_plate_number: '',
      port_name: '',
      iqama_image_url: '',
      submitted_by: '',
      admin_notes: '',
      status: 'PENDING'
    });
    setEditingRequest(null);
    setShowForm(false);
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch =
      request.english_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.iqama_moi_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.passport_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;
    const matchesIssuedFor = issuedForFilter === 'ALL' || request.issued_for === issuedForFilter;

    return matchesSearch && matchesStatus && matchesIssuedFor;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || styles.PENDING;
  };

  const getPublicFormLink = () => {
    return `${window.location.origin}/public/permit-request`;
  };

  const copyPublicLink = () => {
    navigator.clipboard.writeText(getPublicFormLink());
    toast.success('Public form link copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Zawil Permit Requests</h1>
          <p className="text-gray-600">Manage visitor, permanent, and vehicle permit requests</p>
        </div>

        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-700">Public Form Link:</span>
              <code className="text-sm bg-gray-100 px-3 py-1 rounded">{getPublicFormLink()}</code>
            </div>
            <button
              onClick={copyPublicLink}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Copy Link
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, IQAMA, or passport..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <select
                value={issuedForFilter}
                onChange={(e) => setIssuedForFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Types</option>
                <option value="VISITOR">Visitor</option>
                <option value="PERMANENT">Permanent</option>
                <option value="VEHICLE">Vehicle</option>
              </select>

              {canCreate && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  New Request
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Total:</span>
              <span className="font-semibold">{filteredRequests.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Pending:</span>
              <span className="font-semibold text-yellow-600">
                {filteredRequests.filter(r => r.status === 'PENDING').length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Approved:</span>
              <span className="font-semibold text-green-600">
                {filteredRequests.filter(r => r.status === 'APPROVED').length}
              </span>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingRequest ? 'Edit Permit Request' : 'New Permit Request'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Permit Type *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.permit_type}
                      onChange={(e) => setFormData({ ...formData, permit_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Issued For *
                    </label>
                    <select
                      required
                      value={formData.issued_for}
                      onChange={(e) => setFormData({ ...formData, issued_for: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="VISITOR">Visitor</option>
                      <option value="PERMANENT">Permanent</option>
                      <option value="VEHICLE">Vehicle</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      English Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.english_name}
                      onChange={(e) => setFormData({ ...formData, english_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IQAMA/MOI Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.iqama_moi_number}
                      onChange={(e) => setFormData({ ...formData, iqama_moi_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passport Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.passport_number}
                      onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nationality *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Plate Number
                    </label>
                    <input
                      type="text"
                      value={formData.vehicle_plate_number}
                      onChange={(e) => setFormData({ ...formData, vehicle_plate_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Port Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.port_name}
                      onChange={(e) => setFormData({ ...formData, port_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Submitted By *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.submitted_by}
                      onChange={(e) => setFormData({ ...formData, submitted_by: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload IQAMA Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      disabled={uploadingImage}
                    />
                    {uploadingImage && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                    {formData.iqama_image_url && (
                      <p className="text-sm text-green-600 mt-1">Image uploaded successfully</p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Notes
                    </label>
                    <textarea
                      value={formData.admin_notes}
                      onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingRequest ? 'Update Request' : 'Create Request'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {viewingRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Request Details</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Request ID</p>
                    <p className="font-medium">{viewingRequest.request_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(viewingRequest.status)}`}>
                      {viewingRequest.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Permit Type</p>
                    <p className="font-medium">{viewingRequest.permit_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Issued For</p>
                    <p className="font-medium">{viewingRequest.issued_for}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">English Name</p>
                    <p className="font-medium">{viewingRequest.english_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">IQAMA/MOI Number</p>
                    <p className="font-medium">{viewingRequest.iqama_moi_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Passport Number</p>
                    <p className="font-medium">{viewingRequest.passport_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nationality</p>
                    <p className="font-medium">{viewingRequest.nationality}</p>
                  </div>
                  {viewingRequest.vehicle_plate_number && (
                    <div>
                      <p className="text-sm text-gray-500">Vehicle Plate Number</p>
                      <p className="font-medium">{viewingRequest.vehicle_plate_number}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Port Name</p>
                    <p className="font-medium">{viewingRequest.port_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Submitted By</p>
                    <p className="font-medium">{viewingRequest.submitted_by}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Submission Type</p>
                    <p className="font-medium">{viewingRequest.is_public_submission ? 'Public' : 'Admin'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Created At</p>
                    <p className="font-medium">{new Date(viewingRequest.created_at).toLocaleString()}</p>
                  </div>
                  {viewingRequest.admin_notes && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Admin Notes</p>
                      <p className="font-medium">{viewingRequest.admin_notes}</p>
                    </div>
                  )}
                  {viewingRequest.iqama_image_url && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 mb-2">IQAMA Image</p>
                      <img
                        src={viewingRequest.iqama_image_url}
                        alt="IQAMA"
                        className="max-w-full h-auto rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setViewingRequest(null)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued For</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Port</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No permit requests found
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request.request_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{request.request_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.english_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {request.permit_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {request.issued_for}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {request.port_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setViewingRequest(request)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canUpdate && (
                            <button
                              onClick={() => handleEdit(request)}
                              className="text-gray-600 hover:text-gray-800"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canUpdate && request.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(request.request_id, 'APPROVED')}
                                className="text-green-600 hover:text-green-800"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(request.request_id, 'REJECTED')}
                                className="text-red-600 hover:text-red-800"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(request.request_id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
